import sinon from 'sinon';
import { createUpdateExpression } from './createUpdateExpression';

describe('createUpdateExpression(item)', () => {
  const toDate = new Date(2020, 1, 1, 1, 1, 1, 0);
  sinon.useFakeTimers(toDate);

  test('sets and updatedAt', () => {
    const result = createUpdateExpression({});

    expect(result.ExpressionAttributeNames).toEqual({
      '#updatedAt': 'updatedAt',
    });
    expect(result.ExpressionAttributeValues).toEqual({
      ':updatedAt': toDate.toISOString(),
    });

    expect(result.UpdateExpression).toEqual('SET #updatedAt = :updatedAt');
  });

  test('sets the expression attribute names to avoid keywords', () => {
    const item = {
      type: 'spice',
      name: 'thyme',
    };

    const result = createUpdateExpression(item);
    expect(result.UpdateExpression).toContain('#type = :type,');
    expect(result.UpdateExpression).toContain('#name = :name,');
    expect(result.ExpressionAttributeValues).toMatchObject({
      ':name': 'thyme',
      ':type': 'spice',
    });
    expect(result.ExpressionAttributeNames).toMatchObject({
      '#name': 'name',
      '#type': 'type',
    });
  });

  test('does not have a comma on the end of the update string', () => {
    const result = createUpdateExpression({});
    expect(result.UpdateExpression.slice(-1)).not.toEqual(',');
  });
});
