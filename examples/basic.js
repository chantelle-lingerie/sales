const { divideTotal, orderCart } = require('../build/index')

const theOrder = {
    total: 10,
    shipping: 0,
    items: [{ id: 'a', price: 4, total: 10, qty: 3 }],
    invoiced: [],
    refunded: [],
    canceled: [] }

console.log(divideTotal(theOrder.items[0]).map(({total}) => total))
// [ 3.33, 3.34, 3.33 ]

// Invoice 2 items
const invoice = orderCart(theOrder).invoice({ items: [{ id: 'a', price: 4, qty: 2 }], shipping: 0 })
console.log(invoice.total, invoice.items[0].total)
// 6.67 6.67
theOrder.invoiced.push(invoice)

// Refund one item
const refund = orderCart(theOrder).refund({ items: [{ id: 'a', price: 4, qty: 1 }], shipping: 0 })
console.log(refund.total, refund.items[0].total)
// 3.33 3.33
theOrder.refunded.push(refund)

// Refund second item
const refund2 = orderCart(theOrder).refund({ items: [{ id: 'a', price: 4, qty: 1 }], shipping: 0 })
console.log(refund2.total, refund2.items[0].total)
// 3.34 3.34
