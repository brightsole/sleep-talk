import { createExpressions, ExpressionAttributes } from './createExpressions';

export type UpdateExpression = {
  UpdateExpression: string;
} & ExpressionAttributes;

export const createUpdateExpression = (item: any, override: string = 'SET '): UpdateExpression => {
  const now = new Date();
  const fields = { ...item, updatedAt: now.toISOString() };

  const { length } = Object.keys(fields);
  const updateExpression = Object.keys(fields).reduce(
    (expression: string, key: string, i: number): string =>
      `${expression}#${key} = :${key}${i === length - 1 ? '' : ', '}`,
    override
  );

  return { ...createExpressions(fields), UpdateExpression: updateExpression };
};
