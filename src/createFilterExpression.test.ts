import { createFilterExpression } from './createFilterExpression';

describe('createFilterExpression(query)', () => {
  const toDate = new Date(2020, 1, 1, 1, 1, 1, 0);

  test('allows querying for equals and other properties', () => {
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

  test('filters out limits & pagination params from expressionAttributes and names', () => {
    const result = createFilterExpression({
      $limit: 4,
      $isAscending: false,
      $startFromId: 'niner',
      updatedAt: { $lt: toDate.toISOString() },
    });

    expect(result.ExpressionAttributeNames).toEqual({
      '#updatedAt': 'updatedAt',
    });
    expect(result.ExpressionAttributeValues).toEqual({
      ':updatedAt': toDate.toISOString(),
    });
    expect(result.FilterExpression).toEqual('#updatedAt < :updatedAt');

    expect(result.Limit).toEqual(4);
    expect(result.ScanIndexForward).toEqual(false);
    expect(result.ExclusiveStartKey).toEqual('niner');
  });

  test('filter for any match of a list of things', () => {
    const result = createFilterExpression({
      genres: ['sci-fi', 'turbinado', 'matadorian'],
    });

    expect(result.ExpressionAttributeNames).toEqual({
      '#genres': 'genres',
    });
    expect(result.ExpressionAttributeValues).toEqual({
      ':genres0': 'sci-fi',
      ':genres1': 'turbinado',
      ':genres2': 'matadorian',
    });
    expect(result.FilterExpression).toEqual('#genres IN (:genres0, :genres1, :genres2)');
  });
});
