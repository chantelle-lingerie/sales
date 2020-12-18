import { cart as _,Items, ItemTotal, ItemQty, Shipping, Total, Order, Price } from '../index'

export const order: Order<Total & Shipping & Items<ItemTotal & ItemQty & Price>> = {
    shipping: 2.71,
    invoiced: [{ shipping: 0, total: 6, items: [{ id: 'a', qty: 2, price: 5, total: 8 }] },
               { shipping: 2.71, total: 10.71, items: [{ id: 'b', qty: 1, price: 4, total: 4 },
                                                    { id: 'c', qty: 1, price: 10, total: 7 }] },
               { shipping: 0, total: 5, items: [{ id: 'd', qty: 2, price: 3, total: 5 }] }],
    canceled: [{ shipping: 0, total: 3, items: [{ id: 'a', qty: 1, price: 5, total: 4 }] },
               { shipping: 0, total: 5, items: [{ id: 'd', qty: 2, price: 3, total: 5 }] }],
    refunded: [{ shipping: 2.12, total: 7, items: [{ id: 'd', qty: 1, price: 3, total: 4 },
                                                    { id: 'a', qty: 1, price: 5, total: 4 }] },
               { shipping: 0, total: 7, items: [{ id: 'd', qty: 1, price: 3, total: 1 }] }],
    total: 35.71,
    items: [
        { id: 'a', qty: 3, price: 5, total: 12 },
        { id: 'b', qty: 2, price: 4, total: 5 },
        { id: 'c', qty: 1, price: 10, total: 8 },
        { id: 'd', qty: 5, price: 3, total: 12 }] }
