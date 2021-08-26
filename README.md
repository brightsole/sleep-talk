# sleep-talk

### What is it?

<details>
  <summary>
    tl;dr: a minimal noSQL orm for DynamoDB
  </summary>
  <br />

DynamoDB is a complicated beast at the best of times. I've striven to make a wrapper around it that works like many other ORMs. It should make it easier to folks coming from places like mongo where `{ property: { $contains: "partialWord" } }` is something thrown around.

**1.0.0** breaking change. You may pass in `withMetadata` into the context options to get the `ItemResponse<T>` type of response. It will include things straight from DynamoDB like count & ConsumedCapacity. This info isn't always super useful however, so the default return value is now just the `T`/`T[]` item or items with none of the object wrapping. This plays better with restful routes and a clearer interface.

| Method name | Input | Response |
| :---------- | :---- | :------- |
| getItem     | `(T.id, { hashKey, withMetadata })`       | `Promise<T | ItemResponse<T>>`        |
| createItem  | `(partial<T>, { hashKey, withMetadata })` | `Promise<T | ItemResponse<T>>`        |
| updateItem  | `(Partial<T>, { hashKey, withMetadata })` | `Promise<T | ItemResponse<T>>`        |
| getAll      | `({ hashKey, withMetadata })`             | `Promise<T[] | ItemsResponse<T>>`     |
| query       | `(query, { withMetadata })`               | `Promise<T[] | ItemsResponse<T>>`     |
| deleteItem  | `(T.id, { hashKey, withMetadata })`       | `Promise<null | ItemResponse<null>>`  |

There is a query language at work in `sleep-talk` it allows for more nuanced scanning than direct equality. There are also parameters that aide in pagination. All of these special properties begin with `$` to create a clear separation of concerns.

You may pass any property, with a 1:1 matching being the assumption *(ie: `{ name: 'bob' })` and it will fetch all records named bob)*

You may also pass in an array, and it will match any records that match ANY property in that list: *(ie: `{ name: ['tina', 'louise'] }` will return all records named tina OR louise)*

In addition: nearly all filter behaviour that is useful from DynamoDB is recreated as follows:

| query parameters | InputType | Expression conversion |
| :--------------- | :-------- | :-------------------- |
| $contains    | `string`   | `contains(input, property_name)`      |
| $notContains | `string`   | `not contains(input, property_name)`  |
| $notNull     | `anything` | `attribute_not_exists(property_name)` |
| $null        | `anything` | `attribute_exists(property_name)`     |
| $notEq       | `value`    | `input <> property_name`              |
| $gt          | `value`    | `input > property_name`               |
| $lt          | `value`    | `input < property_name`               |
| $limit       | `integer`  | `Limit: input`                        |
| $startFromId | `string`   | `ExclusiveStartKey: input`            |
| $isAscending | `boolean`  | `ScanIndexForward: input`             |
| ANYTHING     | `anything` | `input = property_name`               |
| ANYTHING     | `array of anything` | `input IN (p1, p2, pn...)`   |

</details>
<br/>

### How to use it?
<details>
  <summary>
    tl;dr: `npm i @brightsole/sleep-talk`
  </summary>
  <br />

#### STEPS
Instantiated like so
```ts
const itemSource = new Database({
    tableName,
    region,
    getId: nanoid, // for example
  });
```

### CHOICES THAT HAVE BEEN MADE
  1. `T` is assumed to have a unique identifier `id`
  1. the `hashKey` isn't a unique reference, but is a required property that makes `getAll`ing work. It's understood that it will be used to narrow the querying pool to something manageable, since most groupings of items should be reasonably small.
  1. `getId` was pulled into a function, since most id generation libraries play up with `Lambdas` and serialisation.

</details>
<br/>

### TODO:
<details>
<summary>tl;dr: a little; open to suggestions!</summary>
<br />

  1. full pagination support (all `lastScannedId` returns are `null`)
  1. finish filling out tests for the `createFilterExpression`

</details>
<br/>

<a href="https://www.buymeacoffee.com/Ao9uzMG" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-violet.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>