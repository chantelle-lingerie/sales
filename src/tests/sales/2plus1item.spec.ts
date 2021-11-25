import { Total, Cart, CartItem, addPrices, itemPrice, invariants } from '../../index'
import { scenario, checkDocument } from './sales'

describe('2 + 1: every 3rd cheapest product discounted', () => {
    describe('Reduced to 1 euro', () => {
        const promotionTotals = <U extends CartItem, C extends Cart<U>>(cart: C) => {
            const sorted = [...cart.items].sort(({ price: a }, { price: b }) => a - b)
            const result: { c: number, items: (U & Total)[] } = {
                c: Math.floor(cart.items.reduce((acc, { qty }) => acc + qty, 0) / 3),
                items: [] }
            for (const item of sorted) {
                if (result.c <= 0) {
                    result.items.push({ ...item, total: itemPrice(item) })
                } else if (result.c >= item.qty) {
                    result.items.push({ ...item, total: item.qty })
                } else {
                    result.items.push({ ...item, total: addPrices(result.c, itemPrice({ ...item, qty: item.qty - result.c })) })
                }
                result.c -= item.qty
            }
            return { ...cart, items: result.items, total: addPrices(cart.shipping, ...result.items.map(({ total }) => total)) }
        }

        const oneEuroRule = scenario(promotionTotals)

        describe('Has different items', () => {
            const items = [
                { id: 'a', price: 10, qty: 1 },
                { id: 'b', price: 5, qty: 1 },
                { id: 'c', price: 10, qty: 1 }]
            const { result: order, invoice: firstInvoiceCallback, cancel: firstCancelCallback, spreading: initialSpreading } = oneEuroRule({ shipping: 2.71, items })
            const orderItems = [...order.items].sort(({ id: a }, {id: b }) => a === b ? 0 : a === 'c' || b === 'a' ? 1 : -1)
            it('Correct order', () => {
                checkDocument(order, { shipping: 2.71, total: 23.71 })
            })

            const firstInvoiceData = { shipping: 2.71, items: [items[0], items[1]] }
            const firstInvoiceExpectations = { shipping: 2.71, total: 13.71, items: [
                { id: 'a', price: 10, qty: 1, total: 10 },
                { id: 'b', price: 5, qty: 1, total: 1 }] }
            const secondInvoiceData = { shipping: 2.71, items: [items[2]] }
            const cancelData = { shipping: 0, items: [items[2]] }
            const refundData = { shipping: 0, items: [items[0]] }

            it('Promotional calculations', () => {
                const cancelExpectations = { shipping: 0, total: 6, items: [orderItems[2]] }

                const firstCancelation = firstCancelCallback(promotionTotals, cancelData)
                checkDocument(firstCancelation.result, cancelExpectations)
                // invoice the rest: promotion was canceled
                checkDocument(firstCancelation.invoice(promotionTotals, firstInvoiceData).result, { ...firstInvoiceExpectations, total: 17.71 })

                const firstInvoice = firstInvoiceCallback(promotionTotals, firstInvoiceData)
                checkDocument(firstInvoice.result, firstInvoiceExpectations)
                const cancelAfterInvoice = firstInvoice.cancel(promotionTotals, cancelData)
                checkDocument(cancelAfterInvoice.result, cancelExpectations)
                // Can invoice for promotion cancelation fee!
                const restInvoiced = cancelAfterInvoice.invoice(promotionTotals, { shipping: 0, items: [] })
                checkDocument(restInvoiced.result, { shipping: 0, items: [], total: 4 })
                expect(invariants.total(restInvoiced.order).ir).toBe(17.71)
                expect(invariants.total(restInvoiced.order).ci).toBe(0)

                const firstRefund = firstInvoice.refund(promotionTotals, refundData)
                checkDocument(firstRefund.result, { shipping: 0, total: 6, items: [orderItems[0]] })
                // cancel the rest: discount fee deducted from the refund
                checkDocument(firstRefund.cancel(promotionTotals, cancelData).result, { ...cancelExpectations, total: 10 })

                const secondInvoice = firstInvoice.invoice(promotionTotals, secondInvoiceData)
                checkDocument(secondInvoice.result, { shipping: 0, total: 10, items: [orderItems[2]] })

                const thirdInvoice = firstRefund.invoice(promotionTotals, secondInvoiceData)
                checkDocument(thirdInvoice.result, { shipping: 0, total: 10, items: [orderItems[2]] })

                const secondRefund = secondInvoice.refund(promotionTotals, refundData)
                checkDocument(secondRefund.result, { shipping: 0, total: 6, items: [orderItems[0]] })

                const thirdRefund = secondRefund.refund(promotionTotals, { shipping: 0, items: [items[1]]})
                checkDocument(thirdRefund.result, { shipping: 0, total: 5, items: [orderItems[1]] })
            })
            it('Spreading calculations', () => {
                const cancelExpectations = { shipping: 0, total: 10, items: [orderItems[2]] }

                const firstCancelation = firstCancelCallback(initialSpreading, cancelData)
                checkDocument(firstCancelation.result, cancelExpectations)
                checkDocument(firstCancelation.invoice(firstCancelation.spreading, firstInvoiceData).result, firstInvoiceExpectations)

                const firstInvoice = firstInvoiceCallback(initialSpreading, firstInvoiceData)
                checkDocument(firstInvoice.result, firstInvoiceExpectations)
                checkDocument(firstInvoice.cancel(firstInvoice.spreading, cancelData).result, cancelExpectations)

                const firstRefund = firstInvoice.refund(firstInvoice.spreading, refundData)
                checkDocument(firstRefund.result, { shipping: 0, total: 10, items: [orderItems[0]] })
                checkDocument(firstRefund.cancel(firstRefund.spreading, cancelData).result, cancelExpectations)

                const secondInvoice = firstInvoice.invoice(firstInvoice.spreading, secondInvoiceData)
                checkDocument(secondInvoice.result, { shipping: 0, total: 10, items: [orderItems[2]] })

                const thirdInvoice = firstRefund.invoice(firstRefund.spreading, secondInvoiceData)
                checkDocument(thirdInvoice.result, { shipping: 0, total: 10, items: [orderItems[2]] })

                const secondRefund = secondInvoice.refund(secondInvoice.spreading, refundData)
                checkDocument(secondRefund.result, { shipping: 0, total: 10, items: [orderItems[0]] })

                const thirdRefund = secondRefund.refund(secondRefund.spreading, { shipping: 0, items: [items[1]]})
                checkDocument(thirdRefund.result, { shipping: 0, total: 1, items: [orderItems[1]] })
            })
        })
        describe('Has same item', () => {
            const { result: order, invoice: firstInvoiceCallback, cancel: firstCancelCallback, spreading: initialSpreading } = oneEuroRule({ shipping: 2.71, items: [{ id: 'a', price: 10, qty: 3 }] })
            it('Correct order', () => {
                checkDocument(order, { shipping: 2.71, total: 23.71 })
            })

            const firstInvoiceData = { shipping: 2.71, items: [{ id: 'a', qty: 2, price: 10 }] }
            const secondInvoiceData = { shipping: 2.71, items: [{ id: 'a', qty: 1, price: 10 }] }
            const cancelData = { shipping: 0, items: [{ id: 'a', qty: 1, price: 10 }] }
            const refundData = { shipping: 0, items: [{ id: 'a', qty: 1, price: 10 }] }

            it('Promotional calculations', () => {
                // same item: can have the first invoice higher as it is without promotion
                const firstInvoiceExpectations = { shipping: 2.71, total: 22.71, items: [
                    { id: 'a', price: 10, qty: 2, total: 20 }] }
                const secondInvoiceExpectations = { shipping: 0, total: 1, items: [
                    { id: 'a', qty: 1, price: 10, total: 1 }] }
                const cancelExpectations = { shipping: 0, total: 1, items: [{ id: 'a', qty: 1, price: 10, total: 1 }] }

                const firstCancelation = firstCancelCallback(promotionTotals, cancelData)
                checkDocument(firstCancelation.result, cancelExpectations)
                checkDocument(firstCancelation.invoice(promotionTotals, firstInvoiceData).result, firstInvoiceExpectations)

                const firstInvoice = firstInvoiceCallback(promotionTotals, firstInvoiceData)
                checkDocument(firstInvoice.result, firstInvoiceExpectations)
                checkDocument(firstInvoice.cancel(promotionTotals, cancelData).result, cancelExpectations)

                const firstRefund = firstInvoice.refund(promotionTotals, refundData)
                checkDocument(firstRefund.result, { shipping: 0, total: 1, items: [{ id: 'a', qty: 1, price: 10, total: 1 }] })
                const secondCancelation = firstRefund.cancel(promotionTotals, cancelData)
                checkDocument(secondCancelation.result, { ...cancelExpectations, total: 1 })
                // refund the rest: adjustment to the fist refund after cancelation
                const refundFee = secondCancelation.refund(promotionTotals, { shipping: 0, items: [] })
                checkDocument(refundFee.result, { shipping: 0, items: [], total: 9 })
                expect(invariants.total(refundFee.order).ir).toBe(12.71)
                expect(invariants.total(refundFee.order).ci).toBe(0)

                const secondInvoice = firstInvoice.invoice(promotionTotals, secondInvoiceData)
                checkDocument(secondInvoice.result, secondInvoiceExpectations)

                const thirdInvoice = firstRefund.invoice(promotionTotals, secondInvoiceData)
                checkDocument(thirdInvoice.result, secondInvoiceExpectations)

                const secondRefund = secondInvoice.refund(promotionTotals, refundData)
                checkDocument(secondRefund.result, { shipping: 0, total: 1, items: [{ id: 'a', qty: 1, price: 10, total: 1 }] })

                const thirdRefund = secondRefund.refund(promotionTotals, refundData)
                checkDocument(thirdRefund.result, { shipping: 0, total: 10, items: [{ id: 'a', qty: 1, price: 10, total: 10 }] })
            })
            it('Spreading calculations', () => {
                const firstInvoiceExpectations = { shipping: 2.71, total: 16.71, items: [
                    { id: 'a', price: 10, qty: 2, total: 14 }] }
                const secondInvoiceExpectations = { shipping: 0, total: 7, items: [
                    { id: 'a', qty: 1, price: 10, total: 7 }] }
                const cancelExpectations = { shipping: 0, total: 7, items: [{ id: 'a', qty: 1, price: 10, total: 7 }] }

                const firstCancelation = firstCancelCallback(initialSpreading, cancelData)
                checkDocument(firstCancelation.result, cancelExpectations)
                checkDocument(firstCancelation.invoice(firstCancelation.spreading, firstInvoiceData).result, firstInvoiceExpectations)

                const firstInvoice = firstInvoiceCallback(initialSpreading, firstInvoiceData)
                checkDocument(firstInvoice.result, firstInvoiceExpectations)
                checkDocument(firstInvoice.cancel(firstInvoice.spreading, cancelData).result, cancelExpectations)

                const firstRefund = firstInvoice.refund(firstInvoice.spreading, refundData)
                checkDocument(firstRefund.result, { shipping: 0, total: 7, items: [{ id: 'a', qty: 1, price: 10, total: 7 }] })
                checkDocument(firstRefund.cancel(firstRefund.spreading, cancelData).result, cancelExpectations)

                const secondInvoice = firstInvoice.invoice(firstInvoice.spreading, secondInvoiceData)
                checkDocument(secondInvoice.result, secondInvoiceExpectations)

                const thirdInvoice = firstRefund.invoice(firstRefund.spreading, secondInvoiceData)
                checkDocument(thirdInvoice.result, secondInvoiceExpectations)

                const secondRefund = secondInvoice.refund(secondInvoice.spreading, refundData)
                checkDocument(secondRefund.result, { shipping: 0, total: 7, items: [{ id: 'a', qty: 1, price: 10, total: 7 }] })

                const thirdRefund = secondRefund.refund(secondRefund.spreading, refundData)
                checkDocument(thirdRefund.result, { shipping: 0, total: 7, items: [{ id: 'a', qty: 1, price: 10, total: 7 }] })
            })
        })
    })
})