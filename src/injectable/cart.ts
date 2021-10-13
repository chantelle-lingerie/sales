import { CartItemRO, CartRO, TotalRO, OrderRO, CartTotalsRO, ItemsRO, ShippingRO } from '../readonlyInterfaces'
import { addPrices, enrichItem, minusPrice } from './basics'
import { documents } from './documents'
import { order } from './order'

export const cart = {
    basic: (injectable: {
        ap: ReturnType<typeof addPrices>,
        dt: ReturnType<typeof documents.total>,
        ei: ReturnType<typeof enrichItem>,
    }) => <U extends CartItemRO, T extends CartRO<U>>(request: T) => {
        const items = request.items.map(item => injectable.ei(item))
        const total = injectable.ap(request.shipping, injectable.dt(items))
        return { ...request, items, total }
    },
    order: (injectable: {
        ap: ReturnType<typeof addPrices>,
        ost: ReturnType<typeof order.sales.total>,
        mp: ReturnType<typeof minusPrice>,
        oss: ReturnType<typeof order.sales.shipping>,
        dt: ReturnType<typeof documents.total>,
        osi: ReturnType<typeof order.sales.items>,
    }) => <
        V extends CartItemRO & TotalRO,
        T extends OrderRO<CartTotalsRO<V>>
    >(order: T) =>
        <S extends CartRO<V>>(request: S) => {
            const shipping = Math.min(request.shipping, injectable.oss(order).cr)
            const subtotal = injectable.dt(request.items)
            const total = Math.min(
                injectable.ap(subtotal, shipping),
                injectable.ap(injectable.ost(order).cr),
                injectable.ap(shipping,  injectable.mp(
                    injectable.ost(order).cr,
                    injectable.oss(order).cr)
                        * subtotal
                        / injectable.dt(injectable.osi(order).cr)))
            return { ...request, shipping, items: request.items, total }
        } }

export const orderCart = (injectable: {
    ap: ReturnType<typeof addPrices>,
    ost: ReturnType<typeof order.sales.total>,
    mp: ReturnType<typeof minusPrice>,
    oss: ReturnType<typeof order.sales.shipping>,
    dt: ReturnType<typeof documents.total>,
    osi: ReturnType<typeof order.sales.items>,
    ot: ReturnType<typeof order.total>,
}) => <
    S extends CartItemRO,
    I extends S & TotalRO,
    R extends ItemsRO<I>,
    T extends OrderRO<R & ShippingRO & TotalRO>
>(order: T) => ({
    invoice: <D extends CartRO<S>>(invoice: D) => {
        const request = injectable.ot<S, I, R, T>(order).invoice(invoice)
        return request.total<
            I, D & CartTotalsRO<I>>(cart.order(injectable)<
                I, T>(order)(request))
    },
    refund: <D extends CartRO<S>>(refund: D) => {
        const request = injectable.ot<S, I, R, T>(order).refund(refund)
        return request.total<
            I, D & CartTotalsRO<I>>(cart.order(injectable)<
                I, T>(order)(request))
    },
    cancel: <D extends CartRO<S>>(cancel: D) => {
        const request = injectable.ot<S, I, R, T>(order).cancel(cancel)
        return request.total<
            I, D & CartTotalsRO<I>>(cart.order(injectable)<
                I, T>(order)(request))
    } })