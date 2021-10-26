## Order (sales) API
List of functions in this API grouped by `order` object:
`export const order = { ... }`.
The core functions to do the **sales calculations**.
Slicing your order in different contexts (shipping, total, items - see [Order model](./sales.pdf), page 4),
gives you the way to calculate proper values for each context in the requested
`invoice`, `refund`, or `cancel` operation (let's call it just **sales operation**).

### order.shipping
```
shipping: <
  U extends Shipping,
  T extends Order<U>
>(order: T) => {
  invoice: (invoice: U) => Qty & Total;
  cancel: (cancelation: U) => Qty & Total;
  refund: (refund: U) => Qty & Total;
}
```
Here you can get (future) values for shipping invariants
(see [Invariants](./invariants.md)) after the "sales operation".
The information is static - does not require a [Cart model](./cart.md).

### order.itemsQty
```
itemsQty: <
  V extends ItemQty,
  U extends Items<V>,
  T extends Order<U>
>(order: T) => {
  invoice: (invoice: U) => V[];
  cancel: (cancelation: U) => V[];
  refund: (refund: U) => V[];
}
```
Here you can get (future) values for items quantity invariants
(see [Invariants](./invariants.md)) after the "sales operation".
The information is static - does not require a [Cart model](./cart.md).

### order.sales.shipping
```
shipping: <T extends Order<Shipping>>(order: T) => {
  ci: number;
  cr: number;
  ir: number;
}
```
The function gives values for the shipping costs in `CI`, `IR`, `CR`.

### order.sales.total
```
total: <T extends Order<Total>>(order: T) => {
  ci: number;
  cr: number;
  ir: number;
}
```
The function gives values for the `total` costs in `CI`, `IR`, `CR`.

### order.sales.items
```
items: <
  V extends ItemQty & Total & Price,
  U extends Items<V>,
  T extends Order<U>
>(order: T) => {
  ci: V[];
  cr: V[];
  ir: V[];
}
```
The function gives values for the items (`qty`, `total`) in `CI`, `IR`, `CR`.
Grouped by each item `id`.

### order.total
This function designed to calculate the final costs (for items and the "sales operation" `total` costs)
based on the provided [Cart model](./cart.md).
This is the main, the most high-order function in the library.
```
total: <
  S extends CartItem,
  I extends S & Total,
  R extends Items<I>,
  T extends Order<R & Shipping & Total>
>(order: T) => {
  invoice: <D extends Cart<S>>(invoice: D) => D & Items<I> & {
    total: <
      U extends S & Total,
      V extends D & CartTotals<U>
    >(cart: V) => D & Total & Items<U>
  };
  cancel: <D extends Cart<S>>(cancel: D) => D & Items<I> & {
    total: <
      U extends S & Total,
      V extends D & CartTotals<U>
    >(cart: V) => D & Total & Items<U>
  };
  refund: <D extends Cart<S>>(refund: D) => D & Items<I> & {
    total: <
      U extends S & Total,
      V extends D & CartTotals<U>
    >(cart: V) => D & Total & Items<U>
  };
}
```
First, you initialize this function with the order itself.
After this you have 3 "sales operations", each of them has the same interface:
```
  operation: <D extends Cart<S>>(request: D) => D & Items<I> & {
    total: <
      U extends S & Total,
      V extends D & CartTotals<U>
    >(cart: V) => D & Total & Items<U>
  };
```
Each operation receives the `request` first, and calculates **the cart** according to the [model](./sales.pdf) (page 2-3).
You receive your request enriched by new `shipping` costs (available by the **Order model**),
items - `qty` and `total` (available by the **Order model**) and the `total()` function.
Once you calculated the cart `total`s based on the given `shipping` and `items` (see [Carts examples](./cart.md)),
you can call the `total()` function. Pass the calculated totals for the cart -
and this function will give you back the final "document" for your request,
the document of `invoice`, `refund`, or `cancellation`.   

See examples in the tests.
The `sales` tests help to cover some edge cases in invoice and cancelation calculations
and also prove the [business cases](./sales/business.md) for custom cart calculations.

### Read more
- [README home](../readme.md)
- [Order model](./sales.pdf)
- [Business scenarios](./sales/business.md)
- [Basics](./basics.md) (low-order functions)
- [Documents](./documents.md)
- [Invariants](./invariants.md)
- [Cart](./cart.md)
- [Injectable API](./injectable.md)