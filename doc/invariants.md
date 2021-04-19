## Invariants
List of functions in this API grouped by `invariants` object:
`export const invariants = { ... }`.
To understand the invariants the [Order model](./sales.pdf) (page 1, 4) should be understood first:

- **CI** - stands for **not canceled** and **not invoiced** part of the order (`CI >= 0`)
- **IR** - stands for **invoiced** and **not refunded** part of the order (`IR >= 0`)

Use these functions to check the invariants for sales calculations.
If you use sales ([order](./order.md)) functions without checking invariants,
**the correct result not guaranteed**.

Negative values correspond to the "missing" amount/quantity in the [Order model](./sales.pdf) state.

### invariants.total
```
total: <T extends Order<Total>>({
  total,
  invoiced,
  canceled,
  refunded
}: T) => {
  ci: number;
  ir: number;
}
```
Based on the order information in the documents (`invoiced`, `refunded`, `canceled`)
gives you `CI` and `IR` for `total` fields.
Must not be negative!

### invariants.shipping
```
shipping: <T extends Order<Shipping>>({
  shipping,
  invoiced,
  refunded,
  canceled
}: T) => {
  total: {
    ci: number;
    ir: number;
  };
  qty: number;
}
```
Same as `invariants.total`, but gives you 2 fields:

- `total` - is the same `CI` and `IR` values, but for the `shipping` costs - must not be negative
- `qty` - if you want to control, that shipping costs are `invoiced` (`refunded`, `canceled`) only once, then this value must not be negative

## invariants.items.qty
```
qty: <
  V extends ItemQty,
  U extends Items<V>,
  T extends Order<U>
>(order: T) => {
    ci: V[];
    ir: V[];
}
```
Gives you `CI` and `IR` values for each item quantity (`qty`).
Aggregated per item `id`.
Quantity for each item `id` must not be negative!

## invariants.items.total
```
total: <
  V extends ItemTotal,
  U extends Items<V>,
  T extends Order<U>
>(order: T) => {
  ci: V[];
  ir: V[];
}
```
Gives you `CI` and `IR` values for each item `total`.
Aggregated per item `id`.
The `total` for each item `id` must not be negative!

If you need `CI`, `IR`, `CR` values (not invariants),
use `order.sales` from the [order API](./order.md)

### Read more
- [README home](../readme.md)
- [Order model](./sales.pdf)
- [Business scenarios](./sales/business-scenarios.pdf)
- [Basics](./basics.md) (low-order functions)
- [Documents](./documents.md)
- [Cart](./cart.md)
- [Order](./order.md) (high-order functions)
