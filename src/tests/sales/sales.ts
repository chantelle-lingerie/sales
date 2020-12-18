import { order as o, cart as c, Total, Items, CartItem, Cart, Order, Shipping } from '../../index'

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
    (cart: C) => (order => ({
        result: order,
        invoice: doInvoice(order),
        refund: doRefund(order),
        cancel: doCancel(order),
        spreading: c.order(order),
    }))({ ...cart, ...totals(cart), canceled: [], invoiced: [], refunded: [] } as Order<Shipping & Total & Items<U & Total>>)

const doInvoice = <
    S extends U & Total,
    V extends C & Items<S> & Total,
    U extends CartItem,
    C extends Cart<U>,
    T extends Order<V>
>(order: T) => <R extends (cart: C & Items<S>) => V>(rulesCalculator: R, invoice: C) => (invoice =>
(order => ({
    result: invoice,
    order,
    invoice: doInvoice<S, V, U, C, T>(order),
    refund: doRefund<S, V, U, C, T>(order),
    cancel: doCancel<S, V, U, C, T>(order),
    spreading: c.order<S, T, Cart<S>>(order),
}))({ ...order, invoiced: [...order.invoiced, invoice] })
)((cart => cart.total(rulesCalculator(cart)))(o.total<U, C, S, V, T>(order).invoice(invoice)))

const doRefund = <
    S extends U & Total,
    V extends C & Items<S> & Total,
    U extends CartItem,
    C extends Cart<U>,
    T extends Order<V>
>(order: T) => <R extends (cart: C & Items<S>) => V>(rulesCalculator: R, refund: C) => (refund =>
(order => ({
    result: refund,
    order,
    invoice: doInvoice<S, V, U, C, T>(order),
    refund: doRefund<S, V, U, C, T>(order),
    cancel: doCancel<S, V, U, C, T>(order),
    spreading: c.order<S, T, Cart<S>>(order),
}))({ ...order, refunded: [...order.refunded, refund] })
)((cart => cart.total(rulesCalculator(cart)))(o.total<U, C, S, V, T>(order).refund(refund)))

const doCancel = <
    S extends U & Total,
    V extends C & Items<S> & Total,
    U extends CartItem,
    C extends Cart<U>,
    T extends Order<V>
>(order: T) => <R extends (cart: C & Items<S>) => V>(rulesCalculator: R, cancel: C) => (cancel =>
(order => ({
    result: cancel,
    order,
    invoice: doInvoice<S, V, U, C, T>(order),
    refund: doRefund<S, V, U, C, T>(order),
    cancel: doCancel<S, V, U, C, T>(order),
    spreading: c.order<S, T, Cart<S>>(order),
}))({ ...order, canceled: [...order.canceled, cancel] })
)((cart => cart.total(rulesCalculator(cart)))(o.total<U, C, S, V, T>(order).cancel(cancel)))
