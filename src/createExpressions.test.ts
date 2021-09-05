import sinon from 'sinon';
import { createExpressions } from './createExpressions';

describe('createExpressions({ fields, unusedAttributeValues, startingExpression, isFilter })', () => {
  const toDate = new Date(2020, 1, 1, 1, 1, 1, 0);
  sinon.useFakeTimers(toDate);

  test('allows a passthrough', () => {
    const result = createExpressions({
      fields: {},
      unusedAttributeValues: [],
      startingExpression: {
        ExpressionAttributeNames: { '#createdAt': 'createdAt' },
        ExpressionAttributeValues: {
          ':createdAt': toDate.toISOString(),
        },
      },
    });
    expect(result.ExpressionAttributeNames).toEqual({
      '#createdAt': 'createdAt',
    });
    expect(result.ExpressionAttributeValues).toEqual({
      ':createdAt': toDate.toISOString(),
    });
  });

  test('turns key-values into DDB key-values', () => {
    const result = createExpressions({ fields: { dingle: 'flinglbop' } });
    expect(result.ExpressionAttributeNames).toEqual({
      '#dingle': 'dingle',
    });
    expect(result.ExpressionAttributeValues).toEqual({
      ':dingle': 'flinglbop',
    });
  });

  test('turns array key-values into DDB key-values when filtering', () => {
    const result = createExpressions({
      fields: { dingle: ['flinglbop', 'flooble'] },
      isFilter: true,
    });
    expect(result.ExpressionAttributeNames).toEqual({
      '#dingle': 'dingle',
    });
    expect(result.ExpressionAttributeValues).toEqual({
      ':dingle0': 'flinglbop',
      ':dingle1': 'flooble',
    });
  });

  test('filters out unused values based on named list', () => {
    const result = createExpressions({
      fields: { dingle: 'flinglbop' },
      unusedAttributeValues: ['dingle'],
    });
    expect(result.ExpressionAttributeNames).toEqual({
      '#dingle': 'dingle',
    });
    expect(result.ExpressionAttributeValues).toEqual({});
  });
});
