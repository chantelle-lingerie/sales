import { order as o, cart as c, Total, Items, CartItem, Cart, Order, Shipping } from '../../index'
import { deepFreeze } from '../deepFreeze'

type ResultDocument = {
    items?: (CartItem & Total)[],
    total: number,
    shipping: number
}

export const checkDocument = <T extends ResultDocument & { items: (CartItem & Total)[] }>(data: T, {items, total, shipping}: ResultDocument) => {
    expect(data.shipping).toBe(shipping)
    expect(data.total).toBe(total)
    if (items)
        expect(new Set(data.items)).toEqual(new Set(items)) }

export const scenario = <T extends (cart: C) => C & Items<U & Total> & Total, U extends CartItem, C extends Cart<U>>(totals: T) =>
    (cart: C) => {
        const order: Order<Shipping & Total & Items<U & Total>> = deepFreeze({ ...cart, ...totals(cart), canceled: [], invoiced: [], refunded: [] })
        return { result: order,
            invoice: doInvoice(order),
            refund: doRefund(order),
            cancel: doCancel(order),
            spreading: c.order<U & Total, Order<Shipping & Total & Items<U & Total>>>(order) }
    }

const doInvoice = <
    S extends U & Total,
    V extends C & Items<S> & Total,
    U extends CartItem,
    C extends Cart<U>,
    T extends Order<V>
>(order: T) => <R extends (cart: C & Items<S>) => V>(rulesCalculator: R, invoice: C) => {
    const cart_ = o.total<U, S, V, T>(order).invoice(deepFreeze(invoice))
    const invoice_ = cart_.total(rulesCalculator(cart_))
    const order_ = deepFreeze({ ...order, invoiced: [...order.invoiced, invoice_] })
    return { result: invoice_,
        order: order_,
        invoice: doInvoice<S, V, U, C, T>(order_),
        refund: doRefund<S, V, U, C, T>(order_),
        cancel: doCancel<S, V, U, C, T>(order_),
        spreading: c.order<S, T>(order_) }
}

const doRefund = <
    S extends U & Total,
    V extends C & Items<S> & Total,
    U extends CartItem,
    C extends Cart<U>,
    T extends Order<V>
>(order: T) => <R extends (cart: C & Items<S>) => V>(rulesCalculator: R, refund: C) => {
    const cart_ = o.total<U, S, V, T>(order).refund(deepFreeze(refund))
    const refund_ = cart_.total(rulesCalculator(cart_))
    const order_ = deepFreeze({ ...order, refunded: [...order.refunded, refund_] })
    return { result: refund_,
        order: order_,
        invoice: doInvoice<S, V, U, C, T>(order_),
        refund: doRefund<S, V, U, C, T>(order_),
        cancel: doCancel<S, V, U, C, T>(order_),
        spreading: c.order<S, T>(order_) }
}

const doCancel = <
    S extends U & Total,
    V extends C & Items<S> & Total,
    U extends CartItem,
    C extends Cart<U>,
    T extends Order<V>
>(order: T) => <R extends (cart: C & Items<S>) => V>(rulesCalculator: R, cancel: C) => {
    const cart_ = o.total<U, S, V, T>(order).cancel(deepFreeze(cancel))
    const cancel_ = cart_.total(rulesCalculator(cart_))
    const order_ = deepFreeze({ ...order, canceled: [...order.canceled, cancel_] })
    return { result: cancel_,
        order: order_,
        invoice: doInvoice<S, V, U, C, T>(order_),
        refund: doRefund<S, V, U, C, T>(order_),
        cancel: doCancel<S, V, U, C, T>(order_),
        spreading: c.order<S, T>(order_) }
}
