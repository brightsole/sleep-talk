# sleep-talk

### What is it?

<details>
  <summary>
    tl;dr: a minimal noSQL orm for DynamoDB
  </summary>
  <br />

DynamoDB is a complicated beast at the best of times. I've striven to make a wrapper around it that works like many other ORMs. It should make it easier to folks coming from places like mongo where `{ property: { $contains: "partialWord" } }` is something thrown around.

| Method name | Input | Response |
| :---------- | :---- | :------- |
| getItem     | `(T.id, { hashKey })` | `Promise<ItemResponse<T>>` |
| createItem | `(partial<T>, { hashKey })` | `Promise<ItemResponse<T>>` |
| updateItem | `(Partial<T>, { hashKey })` | `Promise<ItemResponse<T>>` |
| getAll | `({ hashKey })` | `Promise<ItemsResponse<T>>` |
| query | `(query, { hashKey })` | `Promise<ItemsResponse<T>>` |
| deleteItem | `(T.id, { hashKey })` | `Promise<ItemResponse<null>>` |

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
  1. the `hashKey` isn't a unique reference, but is a required property that makes `query`ing work. It's understood that it will be used to narrow the scanning/querying pool to something manageable, since most groupings of items should be reasonably small.
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