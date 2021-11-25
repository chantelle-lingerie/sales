import { enrichItem, documents as d, Cart, CartItem, addPrices, cart as c, minusPrice, invariants } from '../../index'
import { scenario, checkDocument } from './sales'

describe('Discount on subtotal amount', () => {
    describe('2 euro on subtotal over 20 euro', () => {
        const promotionTotals = (params: { limit?: number, discount?: number } = {}) =>
            <U extends CartItem, C extends Cart<U>>(cart: C) => {
                const subtotal = addPrices(d.total(cart.items.map(enrichItem)))
                const cart_ = c.basic(cart)
                const total = subtotal >= 20 ? minusPrice(cart_.total, 2) : cart_.total
                return { ...cart_, total }
            }
        const discountRule = scenario(promotionTotals())

        const items = [
            { id: 'a', price: 9, qty: 1 },
            { id: 'b', price: 9, qty: 2 }]
        const { result: order, invoice: firstInvoiceCallback, cancel: firstCancelCallback, spreading: initialSpreading } = discountRule({ shipping: 2.71, items })
        it('Correct order', () => {
            checkDocument(order, { shipping: 2.71, total: 27.71 })
        })

        const orderItems = [...order.items].sort(({ id: a }, {id: b }) => a === b ? 0 : a === 'b' ? 1 : -1)
        const firstInvoiceData = { shipping: 2.71, items: [items[0], { ...items[1], qty: 1 }] }
        const secondInvoiceData = { shipping: 2.71, items: [{ ...items[1], qty: 1 }] }
        const cancelData = { shipping: 0, items: [{ ...items[1], qty: 1 }] }
        const refundData = { shipping: 0, items: [{ ...items[1], qty: 1 }] }

        it('Promotional calculations', () => {
            const cancelExpectations = { shipping: 0, total: 7, items: [{ ...orderItems[1], qty: 1, total: 9 }] }
            const firstInvoiceExpectations = { shipping: 2.71, total: 20.71, items: [orderItems[0], { ...orderItems[1], qty: 1, total: 9 }] }

            const firstCancelation = firstCancelCallback(promotionTotals(), cancelData)
            checkDocument(firstCancelation.result, cancelExpectations)
            checkDocument(firstCancelation.invoice(promotionTotals(), firstInvoiceData).result, firstInvoiceExpectations)

            const firstInvoice = firstInvoiceCallback(promotionTotals(), firstInvoiceData)
            checkDocument(firstInvoice.result, firstInvoiceExpectations)
            checkDocument(firstInvoice.cancel(promotionTotals(), cancelData).result, cancelExpectations)

            const firstRefund = firstInvoice.refund(promotionTotals(), refundData)
            checkDocument(firstRefund.result, { shipping: 0, total: 7, items: [{ ...orderItems[1], qty: 1, total: 9 }] })
            // Can't cancel invoiced!
            const cancelAfterRefund = firstRefund.cancel(promotionTotals(), cancelData)
            checkDocument(cancelAfterRefund.result, cancelExpectations)
            // Need to refund promotion adjustment
            const refundedOrder = { ...cancelAfterRefund.order,
                refunded: [...cancelAfterRefund.order.refunded, { total: 2, shipping: 0, items: [] }] }
            expect(invariants.total(refundedOrder).ir).toBe(11.71)
            expect(invariants.total(refundedOrder).ci).toBe(0)

            const secondInvoice = firstInvoice.invoice(promotionTotals(), secondInvoiceData)
            checkDocument(secondInvoice.result, { shipping: 0, total: 7, items: [{ ...orderItems[1], qty: 1, total: 9 }] })

            const thirdInvoice = firstRefund.invoice(promotionTotals(), secondInvoiceData)
            checkDocument(thirdInvoice.result, { shipping: 0, total: 7, items: [{ ...orderItems[1], qty: 1, total: 9 }] })

            const secondRefund = secondInvoice.refund(promotionTotals(), refundData)
            checkDocument(secondRefund.result, { shipping: 0, total: 7, items: [{ ...orderItems[1], qty: 1, total: 9 }] })

            const thirdRefund = secondRefund.refund(promotionTotals(), { shipping: 0, items: [items[0]]})
            checkDocument(thirdRefund.result, { shipping: 0, total: 9, items: [orderItems[0]] })
        })
        it('Spreading calculations', () => {
            const spreadingItemExpectations = { shipping: 0, total: 8.33, items: [{ ...orderItems[1], qty: 1, total: 9 }] }
            const spreadingInvoiceExpectation = { shipping: 2.71, total: 19.38, items: [orderItems[0], { ...orderItems[1], qty: 1, total: 9 }] }

            const firstCancelation = firstCancelCallback(initialSpreading, cancelData)
            checkDocument(firstCancelation.result, spreadingItemExpectations)
            checkDocument(firstCancelation.invoice(firstCancelation.spreading, firstInvoiceData).result, spreadingInvoiceExpectation)

            const firstInvoice = firstInvoiceCallback(initialSpreading, firstInvoiceData)
            checkDocument(firstInvoice.result, spreadingInvoiceExpectation)
            checkDocument(firstInvoice.cancel(firstInvoice.spreading, cancelData).result, spreadingItemExpectations)

            const firstRefund = firstInvoice.refund(firstInvoice.spreading, refundData)
            checkDocument(firstRefund.result, spreadingItemExpectations)
            checkDocument(firstRefund.cancel(firstRefund.spreading, cancelData).result, spreadingItemExpectations)

            const secondInvoice = firstInvoice.invoice(firstInvoice.spreading, secondInvoiceData)
            checkDocument(secondInvoice.result, spreadingItemExpectations)

            const thirdInvoice = firstRefund.invoice(firstRefund.spreading, secondInvoiceData)
            checkDocument(thirdInvoice.result, spreadingItemExpectations)

            const secondRefund = secondInvoice.refund(secondInvoice.spreading, refundData)
            checkDocument(secondRefund.result, spreadingItemExpectations)

            const thirdRefund = secondRefund.refund(secondRefund.spreading, { shipping: 0, items: [items[0]]})
            checkDocument(thirdRefund.result, { shipping: 0, total: 8.33, items: [orderItems[0]] })
        })
    })
})