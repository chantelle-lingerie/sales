## Documents API
List of functions in this API grouped by `documents` object:
`export const documents = { ... }`.
This API mostly used as helper functions.

### documents.total
`total: <T extends Total>(documents: T[]) => number`

Simple sum of `total` in each element - calculates as prices (costs).

### documents.shipping
`shipping: <T extends Shipping>(documents: T[]) => number`

Simple sum of `shipping` in each element - calculates as prices (costs).

### documents.items.total
```
total: <
  U extends ItemTotal,
  T extends Items<U>
>(documents: T[]) => U[]
```
In this list of documents, each element is a list of items.
The function reduces items through all documents, aggregating by `id`
and accumulates `total` for each item `id`.

### documents.items.qty
```
qty: <
  U extends ItemQty,
  T extends Items<U>
>(documents: T[]) => U[]
```
In this list of documents, each element is a list of items.
The function reduces items through all documents, aggregating by `id`
and accumulates `qty` for each item `id`.

### documents.items.minus
```
minus: <
  I extends ItemQty & Total,
  S extends Items<I>,
  P extends ItemQty & Total & Price,
  T extends Items<P>
>(from: T[], subtrahend: S[]) => P[]
```
This is the next-order function based on `minusItem()` from [Basics](./basics.md).
This function allows you to do the same, but:

- the minuend is the list of documents (each document is the list of items)
- the subtrahend is the list of items
- function does `minusItem()` per each item `id` separately, so takes into account **different** items 

### Read more
- [README home](../readme.md)
- [Order model](./sales.pdf)
- [Business scenarios](./sales/business-scenarios.pdf)
- [Basics](./basics.md) (low-order functions)
- [Invariants](./invariants.md)
- [Cart](./cart.md)
- [Order](./order.md) (high-order functions)
