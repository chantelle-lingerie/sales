import { order as __, ItemQty, Order, Shipping, Total, Price, Items } from '../index'
import { order } from './order'
import { deepFreeze } from './deepFreeze'

describe('Basic order functionality', () => {
    const _ = {
        shipping: <U extends Shipping, T extends Order<U>>(order: T) => ({
            invoice: (invoice: U) => __.shipping(deepFreeze(order)).invoice(deepFreeze(invoice)),
            cancel: (cancelation: U) => __.shipping(deepFreeze(order)).cancel(deepFreeze(cancelation)),
            refund: (refund: U) => __.shipping(deepFreeze(order)).refund(deepFreeze(refund)) }),
        itemsQty: <V extends ItemQty, U extends Items<V>, T extends Order<U>>(order: T) => ({
            invoice: (invoice: U) => __.itemsQty(deepFreeze(order)).invoice(deepFreeze(invoice)),
            cancel: (cancelation: U) => __.itemsQty(deepFreeze(order)).cancel(deepFreeze(cancelation)),
            refund: (refund: U) => __.itemsQty(deepFreeze(order)).refund(deepFreeze(refund)) }),
        sales: {
            shipping: <T extends Order<Shipping>>(order: T) => __.sales.shipping(deepFreeze(order)),
            total: <T extends Order<Total>>(order: T) => __.sales.total(deepFreeze(order)),
            items: <V extends ItemQty & Total & Price, U extends Items<V>, T extends Order<U>>(order: T) => __.sales.items(deepFreeze(order)) } }

    describe('Sales: CI/CR/IR (canceled/invoiced/refunded)', () => {
        it('Calculate shipping and total', () => {
            expect(_.sales.shipping(order)).toEqual({ ci: 0, cr: 0.59, ir: 0.59 })
            expect(_.sales.total(order)).toEqual({ ci: 6, cr: 13.71, ir: 7.71 })
        })
        it('Calculate items', () => {
            expect(new Set(_.sales.items(order).ci)).toEqual(new Set([
                { id: 'd', qty: 1, price: 3, total: 2 },
                { id: 'b', qty: 1, price: 4, total: 1 }]))
            expect(new Set(_.sales.items(order).cr)).toEqual(new Set([
                { id: 'b', qty: 2, price: 4, total: 5 },
                { id: 'c', qty: 1, price: 10, total: 8 },
                { id: 'a', qty: 1, price: 5, total: 4 },
                { id: 'd', qty: 1, price: 3, total: 2 }]))
            expect(new Set(_.sales.items(order).ir)).toEqual(new Set([
                { id: 'b', qty: 1, price: 4, total: 4 },
                { id: 'c', qty: 1, price: 10, total: 7 },
                { id: 'a', qty: 1, price: 5, total: 4 }]))
        })
    })
    describe('Operations', () => {
        it('Check shipping', () => {
            const shipping = _.shipping(order)
            expect(shipping.invoice({ shipping: .01 })).toEqual({ qty: -1, total: -.01 })
            expect(shipping.invoice({ shipping: 0 })).toEqual({ qty: 0, total: 0 })
            expect(shipping.refund({ shipping: .58 })).toEqual({ qty: -1, total: .01 })
            expect(shipping.refund({ shipping: .6 })).toEqual({ qty: -1, total: -.01 })
            expect(shipping.cancel({ shipping: .01 })).toEqual({ qty: -1, total: -.01 })
            expect(shipping.cancel({ shipping: 0 })).toEqual({ qty: 0, total: 0 })
        })
        it('Check items quantity', () => {
            const items = _.itemsQty(order)
            const builder = (qty: number) => [({ id: 'b', qty })]
            const filterMap = <T extends ItemQty>(items: T[]) => items
                .filter(({ id }) => id === 'b')
                .map(({ id, qty }) => ({ id, qty }))
            expect(filterMap(items.invoice({ items: builder(1) }))).toEqual(builder(0))
            expect(filterMap(items.invoice({ items: builder(2) }))).toEqual(builder(-1))
            expect(filterMap(items.cancel({ items: builder(1) }))).toEqual(builder(0))
            expect(filterMap(items.cancel({ items: builder(2) }))).toEqual(builder(-1))
            expect(filterMap(items.refund({ items: builder(1) }))).toEqual(builder(0))
            expect(filterMap(items.refund({ items: builder(2) }))).toEqual(builder(-1))
        })
        // TODO: Add total tests (they're covered only in sales tests)
    })
})