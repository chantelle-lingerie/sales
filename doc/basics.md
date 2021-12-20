## Basic API

### addPrices
```typescript
addPrices: (...prices: number[]) => number
```

Assumes that all arguments are prices (costs) and calculate accordingly.
For example, `addPrices(.1, .2) === .3` (without any rounding issue).

### minusPrice
```typescript
minusPrice: (a: number, b: number) => number
```

Treats both arguments as prices (costs) and calculate accordingly.
For example, `minusPrice(.51, .04) === .47` (without any rounding issue).

### itemPrice
```typescript
itemPrice: <T extends Qty & Price>({ price, qty }: T) => number
```

Calculates the item price based on the price of one item and the quantity.
You can consider this function as a multiplication of price by an integer number (quantity).

This way you can write different formulas with prices.
For example, if you want to calculate `3 * (price1 + price2) - 4 * price3`, you just compose:
```typescript
minusPrice(
  itemPrice({
    qty: 3,
    price: addPrices(price1, price2),
  }),
  itemPrice({
    qty: 4,
    price: price3,
  }),
)
```

### itemDiscount
```typescript
itemDiscount: <T extends Total & Qty & Price>({ total, ...item }: T) => number
```

Helper for the discount - just a composition of the above functions: `qty * price - total`

### divideTotal
```typescript
divideTotal: <T extends Total & Qty>(item: T) => T[]
```

This function "tries" to split `total` costs between each item (`qty: 1`) equally.
In case when it is not possible, takes the closest possible to equality division.
For example, in tests you can find, that splitting `total: 7.00` in `qty: 3`
will result in `2.33`, `2.34`, and `2.33`.

### enrichItem
```typescript
enrichItem: <T extends Qty
  & Price
  & {total?: number | undefined}
>(item: T) => T & Total
```

When the `total` field is optional, this function makes the `total` defined by:

- the `total` field if present
- the `itemPrice()` when missed

### Reducer
```typescript
itemsReduce: <U>(id: string, init: U) =>
  <T extends Item>(
    items: T[],
    reducer: (acc: U, item: T) => U
  ) => U
```
When we have an array of items, we can use this function to reduce the array,
based on items `id` (see `Item` interface). All other items (with different `id`) would be skipped.

### Group reducer
```typescript
itemsGroupReduce: <U, T extends Item>(init: (item: T) => U) => (
  items: T[],
  reducer: (acc: U, item: T) => U
) => U[]
```
Same as reducer calculates (reduce) result for each `id` in the items list.
So, the result is still the list, where each item represents reduced value for each separate `id`.

### Take (pick) item
```typescript
takeItem: (cheapest: boolean) =>
  <T extends Qty & Total, U extends Qty>(
    from: T[],
    item: U
  ) => (U & T)[]
```
You can take several cheapest (or most expensive) items from the list.

The result list values will have both types:
from the original items list and from the requested item(s) to take.

### Take (pick) several items
```typescript
takeItems: (cheapest: boolean) =>
  <T extends ItemQty & Total, U extends ItemQty>(
    from: T[],
    items: U[]
  ) => (U & T)[]
```
Same as `takeItem()`, but takes into account the `id` of items.
So, you can "take" the list of items with different `id`s from the list.

The result list values will have both types:
from the original items list and from the requested items to take.

### Spreading adjustments
```typescript
spreadAdjustment: <T extends Total & Qty & Price>(
  amount: number,
  items: T[]
) => {
    amount: number;
    items: T[];
    next: () => T[];
}
```
Having the (adjustment) `amount` (negative or positive) we want to spread,
we receive the "honest" spreading thought the items,
taking into account `qty`, `total`, `price` for each item.

The items in the result would never have negative or exceeding `itemPrice()` `total`s.

In case when it is not possible (adjustment `amount` exceeds the limitation),
in result you have "un-spreaded" `amount` and the function `next()`,
which allows you to force spreading even if it exceeds the above limitations.
As a result, after `next()` you may have negative or exceeding `itemPrice()` `total`s.

### Minus item
```typescript
minusItem: <
  T extends Qty & Total & Price,
  U extends Qty & Total
>(item: U) =>
  (from: T[]) => T[]
```
Subtracts given `qty` and `total` from the items list.
Result `total` and `qty` of each item will be based on `qty`, `price` and original `total` of each item in the list -
function "tries" to find the best match from the list for the subtraction.
This is the highest-order function in Basics.

### Read more
- [README home](../README.md)
- [Order model](./model.md)
- [Interfaces](./interfaces.md)
- [Business scenarios](./sales/business.md)
- [Documents](./documents.md)
- [Invariants](./invariants.md)
- [Cart](./cart.md)
- [Order](./order.md) (high-order functions)
- [Injectable API](./injectable.md)