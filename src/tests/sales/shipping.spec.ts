import { Cart, CartItem, cart as c, minusPrice } from '../../index'
import { scenario, checkDocument } from './sales'

describe('Shipping discount', () => {
    describe('Free shipping on 3 (or more) items', () => {
        const promotionTotals = <U extends CartItem, C extends Cart<U>>(cart: C) => {
            const cart_ = c.basic(cart)
            const discount = cart.items.reduce((acc, { qty }) => acc + qty, 0) >= 3
            const shipping = discount ? 0 : cart_.shipping
            const total = discount ? minusPrice(cart_.total, cart_.shipping) : cart_.total
            return { ...cart_, shipping, total }
        }

        const disountRule = scenario(promotionTotals)

        const items = [
            { id: 'a', price: 9, qty: 1 },
            { id: 'b', price: 9, qty: 2 }]
        const { result: order, invoice: firstInvoiceCallback, cancel: firstCancelCallback, spreading: initialSpreading } = disountRule({ shipping: 2.71, items })
        it('Correct order', () => {
            checkDocument(order, { shipping: 0, total: 27 })
        })

        const orderItems = [...order.items].sort(({ id: a }, {id: b }) => a === b ? 0 : a === 'b' ? 1 : -1)
        // Shipping should be always reset to zero in all documents
        const firstInvoiceData = { shipping: 2.71, items: [items[0], { ...items[1], qty: 1 }] }
        const secondItemData = { shipping: 1, items: [{ ...items[1], qty: 1 }] }
        const secondItemExpectations = { shipping: 0, total: 9, items: [{ ...orderItems[1], qty: 1, total: 9 }] }
        const firstInvoiceExpectations = { shipping: 0, total: 18, items: [orderItems[0], { ...orderItems[1], qty: 1, total: 9 }] }

        it('Shipping calculations', () => {
            // assignments in "let"s are used only to infer TS type
            let firstCancelation = firstCancelCallback(initialSpreading, secondItemData)
            ;[promotionTotals, initialSpreading]
                .map(cart => {
                    firstCancelation = firstCancelCallback(cart, secondItemData)
                    checkDocument(firstCancelation.result, secondItemExpectations)
                    checkDocument(firstCancelation.invoice(cart, firstInvoiceData).result, firstInvoiceExpectations) })

            let firstInvoice = firstInvoiceCallback(initialSpreading, firstInvoiceData)
            ;[promotionTotals, initialSpreading]
                .map(cart => {
                    firstInvoice = firstInvoiceCallback(cart, firstInvoiceData)
                    checkDocument(firstInvoice.result, firstInvoiceExpectations)
                    checkDocument(firstInvoice.cancel(cart, secondItemData).result, secondItemExpectations) })

            let firstRefund = firstInvoice.refund(firstInvoice.spreading, secondItemData)
            ;[promotionTotals, firstInvoice.spreading]
                .map(cart => {
                    firstRefund = firstInvoice.refund(cart, secondItemData)
                    checkDocument(firstRefund.result, secondItemExpectations)
                    ;[promotionTotals, firstRefund.spreading]
                        .map(cart => {
                            checkDocument(firstRefund.cancel(cart, secondItemData).result, secondItemExpectations) }) })

            let secondInvoice = firstInvoice.invoice(firstInvoice.spreading, secondItemData)
            ;[promotionTotals, firstInvoice.spreading]
                .map(cart => {
                    secondInvoice = firstInvoice.invoice(cart, secondItemData)
                    checkDocument(secondInvoice.result, secondItemExpectations) })

            let thirdInvoice = firstRefund.invoice(firstRefund.spreading, secondItemData)
            ;[promotionTotals, firstRefund.spreading]
                .map(cart => {
                    thirdInvoice = firstRefund.invoice(cart, secondItemData)
                    checkDocument(thirdInvoice.result, secondItemExpectations) })

            let secondRefund = secondInvoice.refund(secondInvoice.spreading, secondItemData)
            ;[promotionTotals, secondInvoice.spreading]
                .map(cart => {
                    secondRefund = secondInvoice.refund(cart, secondItemData)
                    checkDocument(secondRefund.result, secondItemExpectations) })

            let thirdRefund = secondRefund.refund(secondRefund.spreading, { shipping: 1, items: [items[0]]})
            ;[promotionTotals, secondRefund.spreading]
                .map(cart => {
                    thirdRefund = secondRefund.refund(cart, { shipping: 1, items: [items[0]]})
                    checkDocument(thirdRefund.result, { shipping: 0, total: 9, items: [orderItems[0]] }) })
        })
    })
})