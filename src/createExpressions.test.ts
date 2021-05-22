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

  // TODO: test the filterExpressions

  // TODO: test the expression creation more thoroughly
});
