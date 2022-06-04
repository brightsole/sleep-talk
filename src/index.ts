import { DynamoDB } from 'aws-sdk';
import { DataSource } from 'apollo-datasource';
import { AttributeMap, ScanOutput } from 'aws-sdk/clients/dynamodb';
import { createUpdateExpression } from './createUpdateExpression';
import { createFilterExpression, Query as _Query } from './createFilterExpression';
import { createExpressions } from './createExpressions';

const CHUNK = 100; // max array properties in dynamo queries/scans

export type ConstructionProps = {
  getId: () => string;
  tableName: string;
  region: string;
};

export type ItemResponse<T> = {
  item: T;
  consumedCapacity?: number;
};
export type ItemsResponse<T> = {
  consumedCapacity?: number;
  lastScannedId?: string;
  count?: number;
  items: T[];
};
export type ContextOptions = {
  hashKey: any;
  ConditionExpression?: string;
  withMetadata?: boolean;
};
export type Query = _Query;

export default class DocDatabase<T extends { [index: string]: any }> extends DataSource {
  client: DynamoDB.DocumentClient;

  tableName: DynamoDB.TableName;

  getId: () => string;

  constructor({ tableName, region, getId }: ConstructionProps) {
    super();

    this.getId = getId;
    this.tableName = tableName;
    this.client = new DynamoDB.DocumentClient({ region });
  }

  async getItem(
    id: string,
    { hashKey, withMetadata }: ContextOptions
  ): Promise<T | ItemResponse<T>> {
    const result = await this.client
      .get({
        Key: { hashKey, id },
        ReturnConsumedCapacity: 'TOTAL',
        TableName: this.tableName,
      })
      .promise();

    if (!withMetadata) return result.Item as T;

    return {
      item: result.Item as T,
      consumedCapacity: result.ConsumedCapacity?.CapacityUnits || 0,
    };
  }

  async createItem(
    params: Partial<T>,
    { hashKey, ConditionExpression, withMetadata }: ContextOptions
  ): Promise<T | ItemResponse<T>> {
    const now = new Date();

    const Item = {
      id: this.getId(),
      ...params,
      hashKey,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    } as unknown as T;

    const result = await this.client
      .put({
        ConditionExpression: ConditionExpression || 'attribute_not_exists(id)',
        ReturnConsumedCapacity: 'TOTAL',
        TableName: this.tableName,
        Item,
      })
      .promise();

    if (!withMetadata) return Item;

    return { item: Item, consumedCapacity: result.ConsumedCapacity?.CapacityUnits || 0 };
  }

  async updateItem(
    partial: Partial<T>,
    { hashKey, ConditionExpression, withMetadata }: ContextOptions
  ): Promise<T | ItemResponse<T>> {
    const { id, ...rest } = partial;

    const result = await this.client
      .update({
        ...(ConditionExpression && { ConditionExpression }),
        ...createUpdateExpression(rest),
        ReturnConsumedCapacity: 'TOTAL',
        TableName: this.tableName,
        ReturnValues: 'ALL_NEW',
        Key: { hashKey, id },
      })
      .promise();

    if (!withMetadata) return result.Attributes as T;

    return {
      item: result.Attributes as T,
      consumedCapacity: result.ConsumedCapacity?.CapacityUnits || 0,
    };
  }

  async getAll({ hashKey, withMetadata }: ContextOptions): Promise<T[] | ItemsResponse<T>> {
    const result = await this.client
      .query({
        KeyConditionExpression: '#hashKey = :hashKey',
        ...createExpressions({ fields: { hashKey } }),
        ReturnConsumedCapacity: 'TOTAL',
        TableName: this.tableName,
      })
      .promise();

    if (!withMetadata) return result.Items as T[];

    return {
      consumedCapacity: result.ConsumedCapacity?.CapacityUnits || 0,
      lastScannedId: result.LastEvaluatedKey as any,
      items: result.Items as T[],
      count: result.Count,
    };
  }

  async _batchScan(query: Query): Promise<ScanOutput> {
    const [longKey, longQuery] = Object.entries(query).find(
      ([, value]) => Array.isArray(value) && value.length > CHUNK
    ) as [string, any[]];

    const chunkedQuery = longQuery.reduce(
      (chunks: any[][], item: any, i: number) => {
        chunks[Math.floor(i / CHUNK)].push(item);
        return chunks;
      },
      Array.from({ length: Math.ceil(longQuery.length / CHUNK) }, () => [])
    );

    const results = await Promise.all(
      chunkedQuery.map((val) =>
        this.client
          .scan({
            ...createFilterExpression({ ...query, [longKey]: val }),
            ReturnConsumedCapacity: 'TOTAL',
            TableName: this.tableName,
          })
          .promise()
      )
    );

    const items = results.map((result) => result.Items).flat() as AttributeMap[];

    return {
      ConsumedCapacity: {
        CapacityUnits: results.reduce(
          (sum, result) => (result.ConsumedCapacity?.CapacityUnits || 0) + sum,
          0
        ),
      },
      LastEvaluatedKey: results[results.length - 1].LastEvaluatedKey,
      Items: items,
      Count: items.length,
    };
  }

  async query(
    query: Query,
    { withMetadata }: Partial<ContextOptions> = {}
  ): Promise<T[] | ItemsResponse<T>> {
    const longArrayQueries = Object.values(query).filter(
      (e) => Array.isArray(e) && e.length > CHUNK
    );
    if (longArrayQueries.length > 1) {
      // you could, in fact, create an overlapping matrix that would get all elements
      // but it scales into _unusable_ too fast. if you want 2+ array matchers with
      // 100+ elements in each parameter, it's very like an architecture mistake
      throw new Error('Too many long IN statements to resolve well.');
    }

    const result = await (longArrayQueries.length === 1
      ? this._batchScan(query)
      : this.client
          .scan({
            ...createFilterExpression({ ...query }),
            ReturnConsumedCapacity: 'TOTAL',
            TableName: this.tableName,
          })
          .promise());

    if (!withMetadata) return result.Items as T[];

    return {
      consumedCapacity: result.ConsumedCapacity?.CapacityUnits || 0,
      lastScannedId: result.LastEvaluatedKey as any,
      items: result.Items as T[],
      count: result.Count,
    };
  }

  async deleteItem(
    id: string,
    { hashKey, ConditionExpression, withMetadata }: ContextOptions
  ): Promise<null | ItemResponse<null>> {
    const result = await this.client
      .delete({
        Key: { hashKey, id },
        TableName: this.tableName,
        ReturnConsumedCapacity: 'TOTAL',
        ...(ConditionExpression && { ConditionExpression }),
      })
      .promise();

    if (!withMetadata) return null;

    return { item: null, consumedCapacity: result.ConsumedCapacity?.CapacityUnits || 0 };
  }
}
