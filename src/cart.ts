import { OrderRO, ItemsRO, CartRO, CartItemRO, ShippingRO, TotalRO, CartTotalsRO } from './readonlyInterfaces'
import { addPrices, enrichItem, minusPrice } from './basics'
import { documents as d } from './documents'
import { order as o } from './order'

export const cart = {
    basic: <U extends CartItemRO, T extends CartRO<U>>(request: T) =>
        (items => ({
            ...request,
            items,
            total: addPrices(request.shipping, d.total(items)),
        }))(request.items.map(item => enrichItem(item))),
    order: <
        V extends CartItemRO & TotalRO,
        T extends OrderRO<CartTotalsRO<V>>,
        S extends CartRO<V>
    >(order: T) =>
        (request: S) =>
            ((shipping, subtotal) => ({
                ...request,
                shipping,
                items: request.items,
                total: Math.min(
                    addPrices(subtotal, shipping),
                    addPrices(o.sales.total(order).cr),
                    addPrices(shipping,  minusPrice(
                        o.sales.total(order).cr,
                        o.sales.shipping(order).cr)
                            * subtotal
                            / d.total(o.sales.items(order).cr)))
            }))(
                Math.min(request.shipping, o.sales.shipping(order).cr),
                d.total(request.items)) }

export const orderCart = <
    S extends CartItemRO,
    I extends S & TotalRO,
    R extends ItemsRO<I>,
    D extends CartRO<S>,
    T extends OrderRO<R & ShippingRO & TotalRO>
>(order: T) => ({
    invoice: (invoice: D) => (request => request.total<
        I, D & CartTotalsRO<I>>(cart.order<
            I, T, D & CartRO<I>>(order)(request)))(o.total<
                S, I, R, T>(order).invoice<D>(invoice)),
    refund: (refund: D) => (request => request.total<
        I, D & CartTotalsRO<I>>(cart.order<
            I, T, D & CartRO<I>>(order)(request)))(o.total<
                S, I, R, T>(order).refund<D>(refund)),
    cancel: (cancel: D) => (request => request.total<
        I, D & CartTotalsRO<I>>(cart.order<
            I, T, D & CartRO<I>>(order)(request)))(o.total<
                S, I, R, T>(order).cancel<D>(cancel)) })