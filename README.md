# Sales calculations
Manage order calculations based on invoices, refunds, cancellations

See full documentation [on GitHub](https://github.com/chantelle-lingerie/sales)

* zero production dependencies (only dev dependencies)
* [fully immutable calculations](./doc/interfaces.md#Immutability) (pure functions)
* 100% unit-tests coverage

[![~Build Status](https://travis-ci.com/chantelle-lingerie/sales.svg?branch=master)](https://travis-ci.com/chantelle-lingerie/sales)

## Motivation

Many e-commerce platforms need to deal with order management: creating invoices, cancellations, refunds.
In every sales document we need the right amounts: shipping, total, price for each item.

In case of refunds and cancellations, this library is able to cancel (re-calculate) the promotion, based on subset of finally acquired items.

Many implementations [have](https://community.shopify.com/c/Shopify-Design/Problem-with-rounding-prices/td-p/416162) [rounding](https://magento.stackexchange.com/questions/225168/magento1-9-paypal-rounding-amount-issue) [issues](https://github.com/woocommerce/woocommerce/issues/14458) on calculations and do not give flexibility to cancel promotions.

By introducing the [Order model](./doc/sales.pdf) this library covers [business scenarios](./doc/sales/business.md) with promotions cancellation in sales documents.

Enjoy using it without having any number rounding issues :tada:

## Installation

npm: `npm i @chantelle/sales`

yarn: `yarn add @chantelle/sales`

## Usage
Disclaimer: Examples below are written without TypeScript for wide auditory.

### Three same items cost 10€ in total
[Source](./examples/basic.js)

Let's create this order and see how the library split 10€ into 3 same items:
```javascript
const theOrder = {
    total: 10,
    shipping: 0,
    items: [{ id: 'a', price: 4, total: 10, qty: 3 }],
    invoiced: [],
    refunded: [],
    canceled: [] }

console.log(divideTotal(theOrder.items[0]).map(({total}) => total))
// [ 3.33, 3.34, 3.33 ]
```

When we take 2 of 3 items, we should receive 6.67€. Let's create the invoice with quantity 2:
```javascript
const invoice = orderCart(theOrder)
    .invoice({ items: [{ id: 'a', price: 4, qty: 2 }], shipping: 0 })
console.log(invoice.total, invoice.items[0].total)
// 6.67 6.67
theOrder.invoiced.push(invoice)
```

When we take just one item, we should receive either 3.33€ or 3.34€ - depending on already invoiced, refunded and canceled.
The first refunded item in our invoiced order would be 3.33€ and then the second refunded item should be 3.34€. Let's check:
```javascript
const refund = orderCart(theOrder)
    .refund({ items: [{ id: 'a', price: 4, qty: 1 }], shipping: 0 })
console.log(refund.total, refund.items[0].total)
// 3.33 3.33
theOrder.refunded.push(refund)
const refund2 = orderCart(theOrder)
    .refund({ items: [{ id: 'a', price: 4, qty: 1 }], shipping: 0 })
console.log(refund2.total, refund2.items[0].total)
// 3.34 3.34
```

### Order scopes
[Source](./examples/scopes.js)

Based on invoiced, refunded and canceled data, you can calculate different parts of the order:
- invoiced and not refunded (current income)
- not canceled and not invoiced (potential for invoices and cancellations)
- not canceled and not refunded (potential income)

You can calculate these values for the total amount, for items and for shipping.
Let's take the order of 4 items with 2 items invoiced, 1 canceled and 1 refunded (from the invoiced). The shipping amount would be also partially invoiced, refunded and canceled.
- Order total amount: 16€
- Order shipping amount: 4€
- Order items:
  - item `a`: quantity 4, total price 16€ (item price 4€)
- Order has 2 invoices:
  - First invoice total 3€, shipping in this invoice 1€, items in this invoice:
    - item `a`: quantity 1, total price 5€ (item price 4€)
  - Second invoice total 5€, shipping in this invoice 1€, items in this invoice:
    - item `a`: quantity 1, total price 2€ (item price 4€)
- Order has 1 refund:
  - Refund total amount 4€, shipping refund amount 1€, items refunded:
    - item `a`: quantity 1, total price 3€ (item price 4€)
- Order has 1 cancellation:
  - Canceled total amount 3€, canceled shipping amount 1€, items canceled:
    - item `a`: quantity 1, total price 4€ (item price 4€)
```javascript
const theOrder = {
    total: 16,
    shipping: 4,
    items: [{ id: 'a', price: 4, total: 16, qty: 4 }],
    invoiced: [
        { items: [{ id: 'a', price: 4, total: 5, qty: 1 }], shipping: 1, total: 3 },
        { items: [{ id: 'a', price: 4, total: 2, qty: 1 }], shipping: 1, total: 5 }],
    refunded: [{ items: [{ id: 'a', price: 4, total: 3, qty: 1 }], shipping: 1, total: 4 }],
    canceled: [{ items: [{ id: 'a', price: 4, total: 4, qty: 1 }], shipping: 1, total: 3 }] }
```

The current income for this order is 4€. In the scope of this income 1 item with 4€ total. Shipping costs income is 1€:
```javascript
// Invoiced and not refunded amount, items, shipping
console.log(
    order.sales.total(theOrder).ir,
    order.sales.items(theOrder).ir,
    order.sales.shipping(theOrder).ir)
// 4 [ { id: 'a', price: 4, total: 4, qty: 1 } ] 1
```

Potentially we can invoice or cancel 5€. In scope of this part of the order, we have 1 item with 5€ total. Potentially invoiced or canceled shipping costs is 1€:
```javascript
// Not canceled and not invoiced amount, items, shipping
console.log(
    order.sales.total(theOrder).ci,
    order.sales.items(theOrder).ci,
    order.sales.shipping(theOrder).ci)
// 5 [ { id: 'a', price: 4, total: 5, qty: 1 } ] 1
```

Potential income (in case if we invoice the rest) would be 9€. In scope of this part of the order, we have 2 items with 9€ total. Potential shipping costs income is 2€:
```javascript
// Not canceled and not refunded amount, items
console.log(
    order.sales.total(theOrder).cr,
    order.sales.items(theOrder).cr,
    order.sales.shipping(theOrder).cr)
// 9 [ { id: 'a', price: 4, total: 9, qty: 2 } ] 2
```

### Invariants
[Source](./examples/invariants.js)

Imagine, we have the order:
- Order total amount: 10€
- Order shipping amount: 4€
- Order items:
  - item `a`: quantity 4, total price 10€ (item price 4€)
- Order has 1 invoice:
  - Invoice total amount 5€, shipping in this invoice 2€, items in this invoice:
    - item `a`: quantity 2, total price 8€ (item price 4€)
- Order has 1 refund:
  - Refund total amount 6€, shipping refund amount 3€, items refunded:
    - item `a`: quantity 3, total price 9€ (item price 4€)
- Order has 1 cancellation:
  - Canceled total amount 7€, canceled shipping amount 3€, items canceled:
    - item `a`: quantity 3, total price 7€ (item price 4€)

What is wrong with this order? The library has functions to check invariants:
- You can't refund more than invoiced (items, shipping, amount)
- Invoiced and canceled together shouldn't be more than we have in the order

Let's see the invoiced and not refunded scope - for order amount, shipping amount, items quantity and items amount:
```javascript
console.log(invariants.total(theOrder).ir)
// -1

console.log(invariants.shipping(theOrder).total.ir)
// -1

console.log(invariants.items.qty(theOrder).ir[0].qty)
// -1

console.log(invariants.items.total(theOrder).ir[0].total)
// -1
```
Here we can see, that we refunded 1€ more than we have invoiced. We refunded 1€ more of shipping costs than we have invoiced for shipping. We refunded 1 more item than invoiced. Finally, we refunded 1€ more for this item, than invoiced.

Let's see the not canceled and not invoiced scope - for order amount, shipping amount, items quantity and items amount:
```javascript
console.log(invariants.total(theOrder).ci)
// -2

console.log(invariants.shipping(theOrder).total.ci)
// -1

console.log(invariants.items.qty(theOrder).ci[0].qty)
// -1

console.log(invariants.items.total(theOrder).ci[0].total)
// -3
```
Here we can see, that we canceled and invoiced 2€ more than the order total amount. We canceled and invoiced 1€ more of shipping costs than the shipping costs of the order. We canceled and invoiced 1 more item than we have in the order. Finally, we canceled and invoiced 3€ more for this item, than we paid for this item in the order.

For correct order data, all above values should be non-negative. Functions in this library follow these invariants.

### Promotions cancellation
[Source](./examples/promo.js)

Assume we have the promotion: every 3rd **cheapest** item discounted - reduce product price to 1€. The next function implements this promo calculation:
```javascript
const discountEvery3rdItem = cart => {
    const sorted = [...cart.items].sort(({ price: a }, { price: b }) => a - b)
    const result = {
        c: Math.floor(cart.items.reduce((acc, { qty }) => acc + qty, 0) / 3),
        items: [] }
    for (const item of sorted) {
        if (result.c <= 0) {
            result.items.push({ ...item, total: itemPrice(item) })
        } else if (result.c >= item.qty) {
            result.items.push({ ...item, total: item.qty })
        } else {
            result.items.push({ ...item,
                total: addPrices(result.c,
                    itemPrice({ ...item,
                        qty: item.qty - result.c })) })
        }
        result.c -= item.qty
    }
    return { ...cart,
        items: result.items,
        total: addPrices(cart.shipping,
            ...result.items.map(({ total }) => total)) }
}
```

Let's have some simple checks:
- We order one item - no promo, the total amount is just item price
- We order 2 items - no promo, the total amount is the sum of items prices
- We order 3 items - cheapest item discounted. For example, items prices are 5€, 5€ and 6€ - we have total amount 12€ (5€ + 1€ + 6€)
- We order 6 items - 2 cheapest items discounted. For example, items prices are 5€, 5€, 5€, 4€, 4€ and 4€ - we have total amount 21€ (5€ + 5€ + 5€ + 4€ + 1€ + 1€)
```javascript
// 1 item - no promo
console.log(discountEvery3rdItem({ shipping: 0, items: [{ id: 'a', qty: 1, price: 5 }] }).total)
// 5

// 2 items - no promo
console.log(discountEvery3rdItem({ shipping: 0, items: [{ id: 'a', qty: 2, price: 5 }] }).total)
// 10
console.log(discountEvery3rdItem({ shipping: 0, items: [
    { id: 'a', qty: 1, price: 5 },
    { id: 'b', qty: 1, price: 6 }] }).total)
// 11

// 3 items - cheapest item discounted
console.log(discountEvery3rdItem({ shipping: 0, items: [{ id: 'a', qty: 3, price: 5 }] }).total)
// 11
console.log(discountEvery3rdItem({ shipping: 0, items: [
    { id: 'a', qty: 1, price: 5 },
    { id: 'b', qty: 1, price: 5 },
    { id: 'c', qty: 1, price: 6 }] }).total)
// 12
console.log(discountEvery3rdItem({ shipping: 0, items: [
    { id: 'a', qty: 2, price: 5 },
    { id: 'c', qty: 1, price: 6 }] }).total)
// 12

// 6 items - 2 cheapest items discounted
console.log(discountEvery3rdItem({ shipping: 0, items: [{ id: 'a', qty: 6, price: 5 }] }).total)
// 22
console.log(discountEvery3rdItem({ shipping: 0, items: [
    { id: 'a', qty: 1, price: 5 },
    { id: 'b', qty: 2, price: 5 },
    { id: 'c', qty: 3, price: 4 }] }))
// 21
```

Potentially, your promo calculations could be based on your own systems, even use the database or call 3rd-party API to know applied promotions and total costs. Simply write cart calculation adapter to the library interfaces (similar to `discountEvery3rdItem`) - after this you will be able to calculate costs for invoices, refunds and cancellations.

Let's create an order with promotion applied, cheapest item discounted and we have 1€ total costs for that item:
```javascript
const theOrder = discountEvery3rdItem({ shipping: 0, items: [
    { id: 'a', qty: 1, price: 4 },
    { id: 'b', qty: 1, price: 5 },
    { id: 'c', qty: 1, price: 6 }] })
console.log(theOrder)

// prepare order object for sales calculations
theOrder.invoiced = []
theOrder.refunded = []
theOrder.canceled = []
```

We have 3€ discount on item `a` in this order. We can see how totals are calculated for this order and for each item separately:
- Order items:
  - item `a`: quantity 1, total price 1€ (item price 4€)
  - item `b`: quantity 1, total price 5€ (item price 5€)
  - item `c`: quantity 1, total price 6€ (item price 6€)
- Order shipping amount: 0€
- Order total amount: 12€

How should we calculate if we cancel item `b`? In this case, promotion would not be applicable anymore. So, we can keep the fee for promotion cancellation and cancel only 2€ (5€ - 3€). First, we request the "cancellation cart" from the library:
```javascript
const cartForCancelation = order.total(theOrder)
    .cancel({ shipping: 0, items: [{ id: 'b', qty: 1, price: 5 }] })
console.log(cartForCancelation)
```

Here library gives you cart items (and shipping) for your cart calculations. As mentioned above, you can use the database or call 3rd-party API, async functions, etc. When you calculate all totals for the given cart - proceed by calling `total`, pass the totals you have calculated. Let's see, if we use our `discountEvery3rdItem` here:
```javascript
// your calculations here - could be async
const cartForCancelationWithTotals = discountEvery3rdItem(cartForCancelation)
// end of your calculations, proceed with the library
const cancelDocument = cartForCancelation.total(cartForCancelationWithTotals)
console.log(cancelDocument)
theOrder.canceled.push(cancelDocument)
```

Here we have our cancel document calculated:
- Cancellation total amount: **2€**
- Canceled shipping amount: 0€
- Canceled items:
  - item `b`: quantity 1, total price **5€** (item price 5€)

Here we can see the difference. Even the cancellation amount for the item is 5€, the cancel document has total amount 2€. You can inform the customer, that this happened because of the fee for promotion cancellation.

Now the same way let's invoice items `a` and `c` - request "invoice cart" from the library, use `discountEvery3rdItem` to calculate totals for the "invoice cart" and then proceed by calling `total` to receive the invoice document:
```javascript
const cartForInvoice = order.total(theOrder).invoice({ shipping: 0, items: [
    { id: 'a', qty: 1, price: 4 },
    { id: 'c', qty: 1, price: 6 }] })
// your calculations here - could be async
const cartForInvoiceWithTotals = discountEvery3rdItem(cartForInvoice)
// end of your calculations, proceed with the library
const invoiceDocument = cartForInvoice.total(cartForInvoiceWithTotals)
console.log(invoiceDocument)
```

Here we have our invoice document calculated:
- Invoice total amount: **10€**
- Invoiced shipping amount: 0€
- Invoiced items:
  - item `a`: quantity 1, total price **1€** (item price 4€)
  - item `c`: quantity 1, total price 6€ (item price 6€)

Again, we can see this difference here. Even we invoiced only 1€ for item `a`, we have invoice total amount of 10€, because it includes the fee. You can inform customer, that this happened because of promotion cancellation.

The same will happen when you refund invoiced items. For more use-cases you can read at [business scenarios](./doc/sales/business.md). For more details read other parts of the documentation. For visual diagrams and calculation formulas you can check [Order model](./doc/sales.pdf)
[![Order model](./doc/order.png)](./doc/sales.pdf)

## Sales API
For all documented functions you can also check the unit-tests to see the usage examples (100% coverage).
All interfaces are extendable in functions, so you can use more specific types in your applications.

- [Order model](./doc/sales.pdf)
- [Interfaces](./doc/interfaces.md)
- [Business scenarios](./doc/sales/business.md)
- [Basics](./doc/basics.md) (low-order functions)
- [Documents](./doc/documents.md)
- [Invariants](./doc/invariants.md)
- [Cart](./doc/cart.md)
- [Order](./doc/order.md) (high-order functions)
- [Injectable API](./doc/injectable.md)