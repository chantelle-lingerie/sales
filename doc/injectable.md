## Injectable
All functions of this library are designed to have all dependencies injected.
For example, `addPrices()` uses internally the function to round prices to 2 digits.
If you want to work with 3-digit prices, you can create your own set of functions,
based on your own rounding function.
Just import `injectable`, where you have the same set of all functions
(starting from addPrices till the order functions and cart functions)

Simpliest example is:
`const minusPrice = (ntp: NumberToPrice) => (a: number, b: number) => ntp(a - b)`.
Here you can see the contract of rounding:
`type NumberToPrice = (input: number) => number`.

In [src/tests/injectable.spec.ts](../src/tests/injectable.spec.ts) you can find
a more complicated example, where the `order.shipping` function is constructed.
To build this function:
- we need to construct `documents.shipping` and `invariants.shipping`
- to construct the above functions we need to have `addPrices` and `minusPrice`
- finally, having our own 3-digits rounding function - we can inject it into `addPrices` and `minusPrice`, and build `order.shipping` having all the dependencies from bottom to top

Same steps you can do for all other functions in the library.
When you pass all dependencies into the injectable function,
you simply receive an analog of the same function as in the built-in (2-digits rounding) one.
In above example with `order.shipping` - you receive function with the contract (types) of [`order.shipping`](./order.md#ordershipping) from the build-in function.

There are 2 basic types for low-level (basics) functions:
- `type NumberToPrice = (input: number) => number`
- `type ItemReduce = <U>(id: string, init: U) => <T extends ItemRO>(items: R<T>, reducer: (acc: U, item: T) => U) => U`

Below are listed all the dependencies of injectable functions.

Note: Here removed all `ReturnType<typeof ...>` for readability.
If you see, for example, `ap: addPrices` - this means the real type is `ap: ReturnType<typeof addPrices>` (where `addPrices` is injectable, not built-in). So, `ap` dependency is the constructed `addPrices` with the `NumberToPrice` already injected.

### Basics
- `addPrices: (ntp: NumberToPrice)`
- `minusPrice: (ntp: NumberToPrice)`
- `itemPrice: (ntp: NumberToPrice)`
- `enrichItem: (ntp: NumberToPrice)`
- `itemDiscount: (ntp: NumberToPrice)`
- `divideTotal: (ntp: NumberToPrice)`
- `itemsGroupReduce: (itemsReduce: ItemReduce)`
- `takeItem: (ntp: {up: NumberToPrice, down: NumberToPrice})`
- `takeItems: (injectable: {up: NumberToPrice, down: NumberToPrice, reduce: ItemReduce})`
- `spreadAdjustment: (ntp: NumberToPrice)`
- `minusItem: (ntp: NumberToPrice)`

### Documents
- `documents.total: (ap: addPrices)`
- `documents.shipping: (ap: addPrices)`
- `documents.items.total: (injectable: {ap: addPrices, igr: itemsGroupReduce})`
- `documents.items.qty: (igr: itemsGroupReduce)`
- `documents.items.minus:`
```
(injectable: {
    ap: addPrices,
    igr: itemsGroupReduce,
    mi: minusItem,
})
```

### Invariants
- `invariants.total: (injectable: {mp: minusPrice, dt: documents.total})`
- `invariants.shipping: (injectable: {mp: minusPrice, ds: documents.shipping})`
- `invariants.items.qty: (diq: documents.items.qty)`
- `invariants.items.total: (dit: documents.items.total)`

### Order
- `order.shipping: (is: invariants.shipping)`
- `order.itemsQty: (iiq: invariants.items.qty)`
- `order.sales.shipping: (injectable: {mp: minusPrice, ap: addPrices})`
- `order.sales.total: (injectable: {mp: minusPrice, ap: addPrices})`
- `order.sales.items: (dim: documents.items.minus)`
- `order.total:`
```
(injectable: {
    mp: minusPrice,
    ap: addPrices,
    ti: takeItems,
    dim: documents.items.minus,
    iiq: invariants.items.qty,
    it: invariants.total,
    dt: documents.total,
    dit: documents.items.total,
})
```

### Cart
- `cart.basic:`
```
(injectable: {
    ap: addPrices,
    dt: documents.total,
    ei: enrichItem,
})
```
- `cart.order:`
```
(injectable: {
    ap: addPrices,
    ost: order.sales.total,
    mp: minusPrice,
    oss: order.sales.shipping,
    dt: documents.total,
    osi: order.sales.items,
})
```
- `orderCart:`
```
(injectable: {
    ap: addPrices,
    ost: order.sales.total,
    mp: minusPrice,
    oss: order.sales.shipping,
    dt: documents.total,
    osi: order.sales.items,
    ot: order.total,
})
```

### Read more
- [README home](../readme.md)
- [Order model](./sales.pdf)
- [Business scenarios](./sales/business.md)
- [Basics](./basics.md) (low-order functions)
- [Documents](./documents.md)
- [Invariants](./invariants.md)
- [Cart](./cart.md)
- [Order](./order.md) (high-order functions)
