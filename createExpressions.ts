export type ExpressionAttributes = {
  ExpressionAttributeNames: {
    [key: string]: string;
  };
  ExpressionAttributeValues: {
    [key: string]: string;
  };
};

const BASE_EXPRESSION = {
  ExpressionAttributeValues: {},
  ExpressionAttributeNames: {},
};

export const createExpressions = (
  fields: any,
  unusedAttributeValues: string[] = [],
  startingExpression: ExpressionAttributes = BASE_EXPRESSION
): ExpressionAttributes =>
  Object.entries(fields).reduce(
    (expression, [key, value]: any): ExpressionAttributes => ({
      ExpressionAttributeNames: {
        ...expression.ExpressionAttributeNames,
        [`#${key}`]: key,
      },
      ExpressionAttributeValues: {
        ...expression.ExpressionAttributeValues,
        ...(!unusedAttributeValues.includes(key) && { [`:${key}`]: value }),
      },
    }),
    startingExpression
  );
