import { Items, Shipping, orderCart as orderCart_, cart as __, order as o, CartItem, Cart, Total, Order, CartTotals } from '../index'
import { invariants as i } from './freezedInvariants'
import { order } from './order'
import { deepFreeze } from './deepFreeze'

describe('Carts', () => {
    const _ = {
        basic: <U extends CartItem, T extends Cart<U>>(request: T) => __.basic(deepFreeze(request)),
        order: <
            V extends CartItem & Total,
            T extends Order<CartTotals<V>>
        >(order: T) => <S extends Cart<V>>(request: S) => __.order(deepFreeze(order))(deepFreeze(request)) }
    const orderCart = <
        S extends CartItem,
        I extends S & Total,
        R extends Items<I>,
        T extends Order<R & Shipping & Total>
    >(order: T) => ({
        invoice: <D extends Cart<S>>(invoice: D) => orderCart_(deepFreeze(order)).invoice(deepFreeze(invoice)),
        refund: <D extends Cart<S>>(refund: D) => orderCart_(deepFreeze(order)).refund(deepFreeze(refund)),
        cancel: <D extends Cart<S>>(cancel: D) => orderCart_(deepFreeze(order)).cancel(deepFreeze(cancel)) })

    it('Implement basic', () => {
        const results = [
            _.basic({ shipping: 2.71, items: [{ id: 'a', price: 12, qty: 5 }, { id: 'b', price: 10, qty: 3 }] }),
            _.basic({ shipping: 2.71, items: [{ id: 'a', price: 12, qty: 5 }, { id: 'b', price: 10, qty: 3, total: 20 }] })]
        results.map(({ shipping }) => expect(shipping).toBe(2.71))
        expect(results.map(({ total }) => total)).toEqual([92.71, 82.71])
    })
    describe('Can use order', () => {
        it('Cart totals for subsets of items', () => {
            const cart = _.order(order)
            const { ir: irItems, ci: ciItems } = o.sales.items(order)
            const results = [
                // Cancel item 'b'
                cart({ shipping: .01, items: [...irItems, ...ciItems.filter(({ id }) => id !== 'b')] }),
                // Cancel item 'd'
                cart({ shipping: .6, items: [...irItems, ...ciItems.filter(({ id }) => id !== 'd')] }),
                // Cancel all the rest
                cart({ shipping: .6, items: [...irItems, ...ciItems] })]
            results.map(({ shipping }, i) => expect(shipping).toBe(i === 0 ? .01 : .59))
            expect(results[0].total).toBe(11.75)
            expect(new Set(results[0].items)).toEqual(new Set([...irItems,
                { id: 'd', qty: 1, price: 3, total: 2 }]))
            expect(results[1].total).toBe(11.64)
            expect(new Set(results[1].items)).toEqual(new Set([...irItems,
                { id: 'b', qty: 1, price: 4, total: 1 }]))
            expect(results[2].total).toBe(13.02)
            expect(new Set(results[2].items)).toEqual(new Set([...irItems,
                { id: 'b', qty: 1, price: 4, total: 1 },
                { id: 'd', qty: 1, price: 3, total: 2 }]))
        })
        it('Sales', () => {
            const cart = orderCart(order)

            const checkInvariants = (order: Order<CartTotals<CartItem & Total>>, shippingQty = true) => {
                expect(i.total(order).ir).toBeGreaterThanOrEqual(0)
                expect(i.total(order).ci).toBeGreaterThanOrEqual(0)
                shippingQty
                    ? expect(i.shipping(order).qty).toBeGreaterThanOrEqual(0)
                    : expect(i.shipping(order).qty).toBeLessThan(0)
                const { ci, ir } = i.shipping(order).total
                ;[ci, ir]
                    .map(total => expect(total).toBeGreaterThanOrEqual(0))
                {
                    const { ci, ir } = i.items.qty(order)
                    ;[ci, ir]
                        .map(items => items
                            .map(({ qty }) => expect(qty).toBeGreaterThanOrEqual(0))) }
                {
                    const { ci, ir } = i.items.total(order)
                    ;[ci, ir]
                        .map(items => items
                            .map(({ total }) => expect(total).toBeGreaterThanOrEqual(0))) } }
            checkInvariants(order)

            checkInvariants({ ...order, invoiced: [
                ...order.invoiced,
                cart.invoice({ shipping: 0, items: [{ id: 'd', price: 3, qty: 1 }] })]})


            checkInvariants({ ...order, refunded: [
                ...order.refunded,
                cart.refund({ shipping: .59, items: [{ id: 'b', price: 4, qty: 1 }] })]}, false)

            checkInvariants({ ...order, canceled: [
                ...order.canceled,
                cart.cancel({ shipping: 0, items: [{ id: 'd', price: 3, qty: 1 }] })]})
        })
    })
})