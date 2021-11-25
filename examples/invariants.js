"use strict"
const { invariants } = require('../build/index')

const theOrder = {
    total: 10,
    shipping: 4,
    items: [{ id: 'a', price: 4, total: 10, qty: 4 }],
    invoiced: [{ items: [{ id: 'a', price: 4, total: 8, qty: 2 }],
        shipping: 2,
        total: 5 }],
    refunded: [{ items: [{ id: 'a', price: 4, total: 9, qty: 3 }],
        shipping: 3,
        total: 6 }],
    canceled: [{ items: [{ id: 'a', price: 4, total: 5, qty: 3 }],
        shipping: 3,
        total: 7 }] }

// Refunded amount more than invoiced
console.log(invariants.total(theOrder).ir)
// -1

// Refunded shipping amount more than invoiced
console.log(invariants.shipping(theOrder).total.ir)
// -1

// 1 more item refunded, than invoiced
console.log(invariants.items.qty(theOrder).ir[0].qty)
// -1

// Refunded amount for the item is more than invoiced amount for this item
console.log(invariants.items.total(theOrder).ir[0].total)
// -1

// Invoiced and canceled amount together more than order amount
console.log(invariants.total(theOrder).ci)
// -2

// Invoiced and canceled shipping amount together more than order amount
console.log(invariants.shipping(theOrder).total.ci)
// -1

// Invoiced and canceled quantity of the item more than quantity of this item in the order
console.log(invariants.items.qty(theOrder).ci[0].qty)
// -1

// Invoiced and canceled amount for the item together more than we paid for this item in the order
console.log(invariants.items.total(theOrder).ci[0].total)
// -3