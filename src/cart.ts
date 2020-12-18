import { Order, Items, Cart, CartItem, Shipping, Total, CartTotals } from './interfaces'
import { addPrices, enrichItem, minusPrice } from './basics'
import { documents as d } from './documents'
import { order as o } from './order'

export const cart = {
    basic: <U extends CartItem, T extends Cart<U>>(request: T): T & CartTotals<U & Total> =>
        (items => ({
            ...request,
            items,
            total: addPrices(request.shipping, d.total(items)),
        }))(request.items.map(item => enrichItem(item))),
    order: <
        V extends CartItem & Total,
        T extends Order<CartTotals<V>>,
        S extends Cart<V>
    >(order: T) =>
        (request: S): S & Total =>
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
    S extends CartItem,
    I extends S & Total,
    R extends Items<I>,
    D extends Cart<S>,
    T extends Order<R & Shipping & Total>
>(order: T) => ({
    invoice: (invoice: D): D & CartTotals<I> => (request => request.total<
        I, D & CartTotals<I>>(cart.order<
            I, T, D & Cart<I>>(order)(request)))(o.total<
                S, D, I, R, T>(order).invoice(invoice)),
    refund: (refund: D): D & CartTotals<I> => (request => request.total<
        I, D & CartTotals<I>>(cart.order<
            I, T, D & Cart<I>>(order)(request)))(o.total<
                S, D, I, R, T>(order).refund(refund)),
    cancel: (cancel: D): D & CartTotals<I> => (request => request.total<
        I, D & CartTotals<I>>(cart.order<
            I, T, D & Cart<I>>(order)(request)))(o.total<
                S, D, I, R, T>(order).cancel(cancel)) })