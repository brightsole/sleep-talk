import { DynamoDB } from 'aws-sdk';
import { DataSource } from 'apollo-datasource';
import { createUpdateExpression } from './createUpdateExpression';
import { createFilterExpression, Query as _Query } from './createFilterExpression';
import { createExpressions } from './createExpressions';

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
  hashKey: DynamoDB.Key;
  ConditionExpression?: string;
  withMetadata?: boolean;
};
export type Query = _Query;

export default class DocDatabase<T> extends DataSource {
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
      consumedCapacity: result.ConsumedCapacity?.CapacityUnits,
    };
  }

  async createItem(
    params: Partial<T>,
    { hashKey, ConditionExpression, withMetadata }: ContextOptions
  ): Promise<T | ItemResponse<T>> {
    const now = new Date();

    const Item = {
      id: this.getId(), // allow a savvy user to set their own id
      ...params,
      hashKey,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const result = await this.client
      .put({
        ConditionExpression: ConditionExpression || 'attribute_not_exists(id)',
        ReturnConsumedCapacity: 'TOTAL',
        TableName: this.tableName,
        Item,
      })
      .promise();

    if (!withMetadata) return Item as unknown as T;

    return { item: Item as unknown as T, consumedCapacity: result.ConsumedCapacity?.CapacityUnits };
  }

  async updateItem(
    partial: Partial<T>,
    { hashKey, ConditionExpression, withMetadata }: ContextOptions
  ): Promise<T | ItemResponse<T>> {
    const { id, ...rest } = partial as any;

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
      consumedCapacity: result.ConsumedCapacity?.CapacityUnits,
    };
  }

  async getAll({ hashKey, withMetadata }: ContextOptions): Promise<T[] | ItemsResponse<T>> {
    const result = await this.client
      .query({
        KeyConditionExpression: '#hashKey = :hashKey',
        ...createExpressions({ hashKey }),
        ReturnConsumedCapacity: 'TOTAL',
        TableName: this.tableName,
      })
      .promise();

    if (!withMetadata) return result.Items as T[];

    return {
      consumedCapacity: result.ConsumedCapacity?.CapacityUnits,
      lastScannedId: result.LastEvaluatedKey as any,
      items: result.Items as T[],
      count: result.Count,
    };
  }

  async query(
    query: Query,
    { withMetadata }: Partial<ContextOptions> = {}
  ): Promise<T[] | ItemsResponse<T>> {
    const result = await this.client
      .scan({
        ...createFilterExpression({ ...query }),
        ReturnConsumedCapacity: 'TOTAL',
        TableName: this.tableName,
      })
      .promise();

    if (!withMetadata) return result.Items as T[];

    return {
      consumedCapacity: result.ConsumedCapacity?.CapacityUnits,
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

    return { item: null, consumedCapacity: result.ConsumedCapacity?.CapacityUnits };
  }
}
