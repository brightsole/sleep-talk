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
  Object.entries(fields).reduce((expression, [key, value]: any): ExpressionAttributes => {
    const unfiltered = !unusedAttributeValues.includes(key);
    const isArray = Array.isArray(value);

    const arrayValues =
      isArray &&
      value.reduce((res: any, val: any, i: number) => ({ ...res, [`:${key}${i}`]: val }), {});

    return {
      ExpressionAttributeNames: {
        ...expression.ExpressionAttributeNames,
        [`#${key}`]: key,
      },
      ExpressionAttributeValues: {
        ...expression.ExpressionAttributeValues,
        ...(unfiltered && !isArray && { [`:${key}`]: value }),
        ...arrayValues,
      },
    };
  }, startingExpression);
