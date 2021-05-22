import { createFilterExpression } from './createFilterExpression';

describe('createFilterExpression(query)', () => {
  const toDate = new Date(2020, 1, 1, 1, 1, 1, 0);

  test('allows a passthrough', () => {
    const result = createFilterExpression({
      userId: 'niner',
      updatedAt: { $gt: toDate.toISOString() },
    });

    expect(result.ExpressionAttributeNames).toEqual({
      '#userId': 'userId',
      '#updatedAt': 'updatedAt',
    });
    expect(result.ExpressionAttributeValues).toEqual({
      ':userId': 'niner',
      ':updatedAt': toDate.toISOString(),
    });

    expect(result.FilterExpression).toEqual('#userId = :userId and #updatedAt > :updatedAt');
  });
});
