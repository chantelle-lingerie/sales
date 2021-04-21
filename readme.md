# Sales calculations
Manage order calculations based on invoices, refunds, cancellations

See full documentation [on GitHub](https://github.com/chantelle-lingerie/sales)

Tests: 100% coverage

[![~Build Status](https://travis-ci.com/chantelle-lingerie/sales.svg?branch=master)](https://travis-ci.com/chantelle-lingerie/sales)

## Installation

npm: `npm i @chantelle/sales`

yarn: `yarn add @chantelle/sales`

## Motivation

Most of e-commerce platforms need to deal with the order management: creating invoices, cancelations, refunds.
In every sales document we need the right amounts: shipping, total, price for each item.

Many implementations [have](https://community.shopify.com/c/Shopify-Design/Problem-with-rounding-prices/td-p/416162) [rounding](https://magento.stackexchange.com/questions/225168/magento1-9-paypal-rounding-amount-issue) [issues](https://github.com/woocommerce/woocommerce/issues/14458) on calculations and do not give flexibility to cancel promotions.

By introducing the [Order model](./doc/sales.pdf) this library covers [business cases](./doc/sales/business.md) with promotions cancelation in sales documents.

Enjoy using it without having any number rounding issues :tada:

## Interfaces

### Item
`type Item = { id: string }`

The simplest representation of the ordered item.
Used only one string property to aggregate/distinguish order items with each other.
Potentially could be any [Setoid](https://en.wikipedia.org/wiki/Setoid).

### Price
`type Price = { price: number }`

This interface used to work with the prices.
Use functions `addPrices()`, `minusPrice()`, etc to work with prices.
The main idea is to calculate prices (costs) without [rounding issue](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html).

### Quantity
`type Qty = { qty: number }`

The interface supports aggregation of several order items in one item (by `id`),
accumulating the quantity of the aggregated items.

**This value considered to be integer**: no rounding treatments applied.

Usually used with the `Item` interface (see `ItemQty`), but some functions do not need `id` in context.

### Shipping
`type Shipping = { shipping: number }`

Represents the costs of the shipping (in different contexts).
So, all calculations should be done again through the functions like `addPrices()`, `minusPrice()`, etc.

### Total
`type Total = { total: number }`

Represents the "total costs" (in different contexts).
So, all calculations should be done again through the functions like `addPrices()`, `minusPrice()`, etc.

### Items
`type Items<T extends Item> = { items: T[] }`

Represents the list of items.
Here the `Item` interface used to aggregate/distinguish items in the list.

### Order
```
type Order<T extends Total | Shipping | Items<Item>> = T & {
    invoiced: T[],
    refunded: T[],
    canceled: T[],
}
```
This interface represents the main model of the library - the [Order model](./doc/sales.pdf).
The order could be defined in several scopes (or all of them at the same time):

- `Total`
- `Shipping`
- `Items` (could be also more specific, than just `Items<Item>`)

Also, there are 3 required fields with the array of elements
should have the same scope (type) as the order itself:
`invoiced`, `refunded`, and `canceled`. 

### Helper types (compositions)
Should be clear from the definition - just intersections (more specific types)

`type ItemQty = Item & Qty`

`type ItemTotal = Item & Total`

`type CartItem = ItemQty & Price & Partial<Total>`

`type Cart<T extends CartItem> = Items<T> & Shipping`

`type CartTotals<T extends CartItem & Total> = Cart<T> & Total`

## Sales API
For all documented functions you can also check the unit-tests to see the usage examples (100% coverage).
All interfaces are extendable in functions, so you can use more specific types in your applications.

- [Order model](./doc/sales.pdf)
- [Business scenarios](./doc/sales/business.md)
- [Basics](./doc/basics.md) (low-order functions)
- [Documents](./doc/documents.md)
- [Invariants](./doc/invariants.md)
- [Cart](./doc/cart.md)
- [Order](./doc/order.md) (high-order functions)
