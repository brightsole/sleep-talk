import { createExpressions, ExpressionAttributes } from './createExpressions';

type QueryMatch =
  | Array<string>
  | Array<number>
  | boolean
  | string
  | number
  | {
      $notContains?: string;
      $contains?: string;
      $notNull?: string;
      $isNull?: string;
      $notEq?: string;
      $gt?: string;
      $lt?: string;
    };

export type Query = {
  $isAscending?: boolean;
  $startFromId?: string;
  $limit?: number;
  [index: string]: undefined | QueryMatch;
};

export type QueryInput = {
  ExclusiveStartKey?: any; // strings
  ScanIndexForward?: boolean;
  FilterExpression: string;
  Limit?: number;
  Select: string;
} & ExpressionAttributes;

const getMatchingExpression = (key: string, queryMatch: QueryMatch): string => {
  if (Array.isArray(queryMatch)) {
    return `#${key} IN (${queryMatch
      .map((_: string | number, i: number) => `:${key}${i}`)
      .join(', ')})`;
  }

  if (queryMatch && typeof queryMatch === 'object') {
    const matchKeys = Object.keys(queryMatch);

    if (matchKeys.includes('$notContains')) return `not contains(#${key}, :${key})`;
    if (matchKeys.includes('$contains')) return `contains(#${key}, :${key})`;
    if (matchKeys.includes('$isNull')) return `attribute_not_exists(#${key})`;
    if (matchKeys.includes('$notNull')) return `attribute_exists(#${key})`;
    if (matchKeys.includes('$notEq')) return `#${key} <> :${key}`;
    if (matchKeys.includes('$gt')) return `#${key} > :${key}`;
    if (matchKeys.includes('$lt')) return `#${key} < :${key}`;
  }

  return `#${key} = :${key}`;
};

export const createFilterExpression = (
  { $limit, $startFromId, $isAscending = true, ...query }: Query,
  override: string = ''
): QueryInput => {
  const flatProperties = Object.entries(query).reduce((res, [key, value]) => {
    const isMatchingParameter = value && typeof value === 'object' && !Array.isArray(value);
    return isMatchingParameter
      ? { ...res, [key]: Object.values(value as any)[0] }
      : { ...res, [key]: value };
  }, {});

  const FilterExpression = Object.entries(query).reduce(
    (expression: string, [key, val]: any, i: number): string =>
      `${expression}${i === 0 ? '' : ' and '}${getMatchingExpression(key, val)}`,
    override
  );

  // both "exists" methods don't have values in their variables
  // so we can remove those values from our ExpressionAttributeValues
  const unusedAttributeValues = FilterExpression.match(/exists\(#([^)]+)\)/gi)?.map((e) =>
    e.replace(/exists\(#(.+)\)/, '$1')
  );

  return {
    ...createExpressions({ fields: flatProperties, unusedAttributeValues, isFilter: true }),
    ...($startFromId && { ExclusiveStartKey: $startFromId }),
    ...($limit && { Limit: $limit }),
    ScanIndexForward: $isAscending,
    Select: 'ALL_ATTRIBUTES',
    FilterExpression,
  };
};
