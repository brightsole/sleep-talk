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

export type ExpressionProps = {
  fields: any;
  unusedAttributeValues?: string[];
  startingExpression?: ExpressionAttributes;
  isFilter?: boolean;
};

export const createExpressions = ({
  fields,
  unusedAttributeValues = [],
  startingExpression = BASE_EXPRESSION,
  isFilter,
}: ExpressionProps): ExpressionAttributes =>
  Object.entries(fields).reduce((expression, [key, value]: any): ExpressionAttributes => {
    const unfiltered = !unusedAttributeValues.includes(key);
    const isArray = Array.isArray(value);

    const arrayValues =
      isArray &&
      isFilter &&
      value.reduce((res: any, val: any, i: number) => ({ ...res, [`:${key}${i}`]: val }), {});

    return {
      ExpressionAttributeNames: {
        ...expression.ExpressionAttributeNames,
        [`#${key}`]: key,
      },
      ExpressionAttributeValues: {
        ...expression.ExpressionAttributeValues,
        ...(unfiltered && !arrayValues && { [`:${key}`]: value }),
        ...arrayValues,
      },
    };
  }, startingExpression);
