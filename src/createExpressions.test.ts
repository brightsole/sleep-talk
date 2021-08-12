import sinon from 'sinon';
import { createExpressions } from './createExpressions';

describe('createExpressions(item, filterVals, passthrough)', () => {
  const toDate = new Date(2020, 1, 1, 1, 1, 1, 0);
  sinon.useFakeTimers(toDate);

  test('allows a passthrough', () => {
    const result = createExpressions({}, [], {
      ExpressionAttributeNames: { '#createdAt': 'createdAt' },
      ExpressionAttributeValues: {
        ':createdAt': toDate.toISOString(),
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
    const result = createExpressions({ dingle: 'flinglbop' });
    expect(result.ExpressionAttributeNames).toEqual({
      '#dingle': 'dingle',
    });
    expect(result.ExpressionAttributeValues).toEqual({
      ':dingle': 'flinglbop',
    });
  });

  test('turns array key-values into DDB key-values', () => {
    const result = createExpressions({ dingle: ['flinglbop', 'flooble'] });
    expect(result.ExpressionAttributeNames).toEqual({
      '#dingle': 'dingle',
    });
    expect(result.ExpressionAttributeValues).toEqual({
      ':dingle0': 'flinglbop',
      ':dingle1': 'flooble',
    });
  });

  test('filters out unused values based on named list', () => {
    const result = createExpressions({ dingle: 'flinglbop' }, ['dingle']);
    expect(result.ExpressionAttributeNames).toEqual({
      '#dingle': 'dingle',
    });
    expect(result.ExpressionAttributeValues).toEqual({});
  });
});
