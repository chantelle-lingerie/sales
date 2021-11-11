const { order } = require('../build/index')

const theOrder = {
    total: 16,
    shipping: 4,
    items: [{ id: 'a', price: 4, total: 16, qty: 4 }],
    invoiced: [
        { items: [{ id: 'a', price: 4, total: 5, qty: 1 }], shipping: 1, total: 3 },
        { items: [{ id: 'a', price: 4, total: 2, qty: 1 }], shipping: 1, total: 5 }],
    refunded: [{ items: [{ id: 'a', price: 4, total: 3, qty: 1 }], shipping: 1, total: 4 }],
    canceled: [{ items: [{ id: 'a', price: 4, total: 4, qty: 1 }], shipping: 1, total: 3 }] }

// Invoiced and not refunded amount, items, shipping
console.log(
    order.sales.total(theOrder).ir,
    order.sales.items(theOrder).ir,
    order.sales.shipping(theOrder).ir)
// 4 [ { id: 'a', price: 4, total: 4, qty: 1 } ] 1

// Not canceled and not invoiced amount, items, shipping
console.log(
    order.sales.total(theOrder).ci,
    order.sales.items(theOrder).ci,
    order.sales.shipping(theOrder).ci)
// 5 [ { id: 'a', price: 4, total: 5, qty: 1 } ] 1

// Not canceled and not refunded amount, items
console.log(
    order.sales.total(theOrder).cr,
    order.sales.items(theOrder).cr,
    order.sales.shipping(theOrder).cr)
// 9 [ { id: 'a', price: 4, total: 9, qty: 2 } ] 2
