import { DynamoDB } from 'aws-sdk';
import { DataSource } from 'apollo-datasource';
import { createUpdateExpression } from './createUpdateExpression';
import { createFilterExpression, Query } from './createFilterExpression';
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
};

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

  async getItem(id: string, { hashKey }: ContextOptions): Promise<ItemResponse<T>> {
    const result = await this.client
      .get({
        Key: { hashKey, id },
        ReturnConsumedCapacity: 'TOTAL',
        TableName: this.tableName,
      })
      .promise();

    return {
      item: result.Item as any,
      consumedCapacity: result.ConsumedCapacity?.CapacityUnits,
    };
  }

  async createItem(params: Partial<T>, { hashKey }: ContextOptions): Promise<ItemResponse<T>> {
    const now = new Date();

    const Item = {
      ...params,
      hashKey,
      id: this.getId(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const result = await this.client
      .put({
        ConditionExpression: 'attribute_not_exists(id)',
        ReturnConsumedCapacity: 'TOTAL',
        TableName: this.tableName,
        Item,
      })
      .promise();

    return { item: Item as any, consumedCapacity: result.ConsumedCapacity?.CapacityUnits };
  }

  async updateItem(partial: Partial<T>, { hashKey }: ContextOptions): Promise<ItemResponse<T>> {
    const { id, ...rest } = partial as any;

    const result = await this.client
      .update({
        Key: { hashKey, id },
        ...createUpdateExpression(rest),
        ReturnConsumedCapacity: 'TOTAL',
        TableName: this.tableName,
        ReturnValues: 'ALL_NEW',
      })
      .promise();

    return {
      item: result.Attributes as any,
      consumedCapacity: result.ConsumedCapacity?.CapacityUnits,
    };
  }

  async getAll({ hashKey }: ContextOptions): Promise<ItemsResponse<T>> {
    const result = await this.client
      .query({
        KeyConditionExpression: '#hashKey = :hashKey',
        ...createExpressions({ hashKey }),
        ReturnConsumedCapacity: 'TOTAL',
        TableName: this.tableName,
      })
      .promise();

    return {
      consumedCapacity: result.ConsumedCapacity?.CapacityUnits,
      lastScannedId: result.LastEvaluatedKey as any,
      items: result.Items as any[],
      count: result.Count,
    };
  }

  async query(query: Query, { hashKey }: ContextOptions): Promise<ItemsResponse<T>> {
    const result = await this.client
      .scan({
        ...createFilterExpression({ ...query, hashKey }),
        ReturnConsumedCapacity: 'TOTAL',
        TableName: this.tableName,
      })
      .promise();

    return {
      consumedCapacity: result.ConsumedCapacity?.CapacityUnits,
      lastScannedId: result.LastEvaluatedKey as any,
      items: result.Items as any[],
      count: result.Count,
    };
  }

  async deleteItem(id: string, { hashKey }: ContextOptions): Promise<ItemResponse<null>> {
    const result = await this.client
      .delete({
        Key: { hashKey, id },
        ReturnConsumedCapacity: 'TOTAL',
        TableName: this.tableName,
      })
      .promise();

    return { item: null, consumedCapacity: result.ConsumedCapacity?.CapacityUnits };
  }
}
