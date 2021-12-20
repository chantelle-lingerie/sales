## Interfaces

### Item
```typescript
type Item = { id: string }
```

The simplest representation of the ordered item.
Used only one string property to aggregate/distinguish order items with each other.
Potentially could be any [Setoid](https://en.wikipedia.org/wiki/Setoid).

### Price
```typescript
type Price = { price: number }
```

This interface used to work with the prices.
Use functions `addPrices()`, `minusPrice()`, etc to work with prices.
The main idea is to calculate prices (costs) without [rounding issue](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html).

### Quantity
```typescript
type Qty = { qty: number }
```

The interface supports aggregation of several order items in one item (by `id`),
accumulating the quantity of the aggregated items.

**This value considered to be integer**: no rounding treatments applied.

Usually used with the `Item` interface (see `ItemQty`), but some functions do not need `id` in context.

### Shipping
```typescript
type Shipping = { shipping: number }
```

Represents the costs of the shipping (in different contexts).
So, all calculations should be done again through the functions like `addPrices()`, `minusPrice()`, etc.

### Total
```typescript
type Total = { total: number }
```

Represents the "total costs" (in different contexts).
So, all calculations should be done again through the functions like `addPrices()`, `minusPrice()`, etc.

### Items
```typescript
type Items<T extends Item> = { items: T[] }
```

Represents the list of items.
Here the `Item` interface used to aggregate/distinguish items in the list.

### Order
```typescript
type Order<T extends Total | Shipping | Items<Item>> = T & {
    invoiced: T[],
    refunded: T[],
    canceled: T[],
}
```
This interface represents the main model of the library - the [Order model](./model.md).
The order could be defined in several scopes (or all of them at the same time):

- `Total`
- `Shipping`
- `Items` (could be also more specific, than just `Items<Item>`)

Also, there are 3 required fields with the array of elements
should have the same scope (type) as the order itself:
`invoiced`, `refunded`, and `canceled`. 

### Helper types (compositions)
Should be clear from the definition - just intersections (more specific types)
```typescript
type ItemQty = Item & Qty

type ItemTotal = Item & Total

type CartItem = ItemQty & Price & Partial<Total>

type Cart<T extends CartItem> = Items<T> & Shipping

type CartTotals<T extends CartItem & Total> = Cart<T> & Total
```

### Immutability
The library does not use the above interfaces but uses read-only (immutable) variants for each of them.

For example, instead of `type Item = { id: string }`,
library uses `type ItemRO = { readonly id: string }`.

The full list of immutable types could be found in [readonly interfaces](../src/readonlyInterfaces.ts).
This proves the immutability of types used in the library.

Tests do not use read-only types. This proves that functions could be used with mutable variables as well.
The immutability in tests is proved by `deepFreeze` (which is based on `Object.freeze`)

### Read more
- [README home](../README.md)
- [Order model](./model.md)
- [Business scenarios](./sales/business.md)
- [Basics](./basics.md) (low-order functions)
- [Documents](./documents.md)
- [Invariants](./invariants.md)
- [Cart](./cart.md)
- [Order](./order.md) (high-order functions)
- [Injectable API](./injectable.md)