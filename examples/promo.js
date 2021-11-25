"use strict"
const { itemPrice, addPrices, order } = require('../build/index')

const discountEvery3rdItem = cart => {
    const sorted = [...cart.items]
        .sort(({ price: a }, { price: b }) => a - b)
    const result = {
        c: Math.floor(cart.items
            .reduce((acc, { qty }) => acc + qty, 0) / 3),
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

{
    // 1 item - no promo
    console.log(discountEvery3rdItem({
        shipping: 0,
        items: [{ id: 'a', qty: 1, price: 5 }] }).total)
    // 5

    // 2 items - no promo
    console.log(discountEvery3rdItem({
        shipping: 0,
        items: [{ id: 'a', qty: 2, price: 5 }] }).total)
    // 10
    console.log(discountEvery3rdItem({ shipping: 0, items: [
        { id: 'a', qty: 1, price: 5 },
        { id: 'b', qty: 1, price: 6 }] }).total)
    // 11

    // 3 items - cheapest item discounted
    console.log(discountEvery3rdItem({
        shipping: 0,
        items: [{ id: 'a', qty: 3, price: 5 }] }).total)
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
    console.log(discountEvery3rdItem({
        shipping: 0,
        items: [{ id: 'a', qty: 6, price: 5 }] }).total)
    // 22
    console.log(discountEvery3rdItem({ shipping: 0, items: [
        { id: 'a', qty: 1, price: 5 },
        { id: 'b', qty: 2, price: 5 },
        { id: 'c', qty: 3, price: 4 }] }))
    // 21
}

{
    const theOrder = discountEvery3rdItem({ shipping: 0, items: [
        { id: 'a', qty: 1, price: 4 },
        { id: 'b', qty: 1, price: 5 },
        { id: 'c', qty: 1, price: 6 }] })
    console.log(theOrder)

    // prepare order object for sales calculations
    theOrder.invoiced = []
    theOrder.refunded = []
    theOrder.canceled = []

    const cartForCancelation = order.total(theOrder)
        .cancel({ shipping: 0,
            items: [{ id: 'b', qty: 1, price: 5 }] })
    console.log(cartForCancelation)
    // your calculations here - could be async
    const cartForCancelationWithTotals =
        discountEvery3rdItem(cartForCancelation)
    // end of your calculations, proceed with the library
    const cancelDocument = cartForCancelation
        .total(cartForCancelationWithTotals)
    console.log(cancelDocument)
    theOrder.canceled.push(cancelDocument)

    const cartForInvoice = order.total(theOrder)
        .invoice({ shipping: 0, items: [
            { id: 'a', qty: 1, price: 4 },
            { id: 'c', qty: 1, price: 6 }] })
    // your calculations here - could be async
    const cartForInvoiceWithTotals = discountEvery3rdItem(cartForInvoice)
    // end of your calculations, proceed with the library
    const invoiceDocument = cartForInvoice.total(cartForInvoiceWithTotals)
    console.log(invoiceDocument)
}