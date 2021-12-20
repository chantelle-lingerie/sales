## Cart
The Cart (in the scope of order) described in the [Order model](./model.md#the-cart).
The cart should be able to calculate `total`s for each item and the cart `total`.
Two cart implementations provided in the `cart` object.

### cart.basic
```typescript
basic: <
  U extends CartItem,
  T extends Cart<U>
>(request: T) => T & CartTotals<U & Total>
```
This implementation just does `enrichItem()` for each item,
and calculates cart `total` as the sum of items `total`s.

### cart.order
```typescript
order: <
  V extends CartItem & Total,
  T extends Order<CartTotals<V>>
>(order: T) =>
  <S extends Cart<V>>(request: S) => S & Total
```
This cart uses the order information (related to the cart).
First, we should give the current order state,
then the cart proportionally adjusts cart `total` based on subtotal values (see the [Order model](./model.md#the-cart)).

Both implementations are synchronous pure functions.
In this case, sales calculation could be done synchronously and without side effects.
The "order cart" is commonly used, that's why there is already provided wrapper
for [order functions](./order.md) calculated with the "order cart".

### orderCart
```typescript
orderCart: <
  S extends CartItem,
  I extends S & Total,
  R extends Items<I>,
  T extends Order<R & Shipping & Total>
>(order: T) => {
  invoice: <D extends Cart<S>>(invoice: D) => D & CartTotals<I>;
  refund: <D extends Cart<S>>(refund: D) => D & CartTotals<I>;
  cancel: <D extends Cart<S>>(cancel: D) => D & CartTotals<I>;
}
```
So, with the `orderCart` initialized by the order, we have 3 functions easy to use:
`invoice()`, `refund()` and `cancel()` - to create the "sales document".

### Read more
- [README home](../README.md)
- [Order model](./model.md)
- [Interfaces](./interfaces.md)
- [Business scenarios](./sales/business.md)
- [Basics](./basics.md) (low-order functions)
- [Documents](./documents.md)
- [Invariants](./invariants.md)
- [Order](./order.md) (high-order functions)
- [Injectable API](./injectable.md)