import { takeItems, addPrices, minusPrice } from './basics'
import { Cart, Total, Order, Shipping, Items, Qty, ItemQty, Price, CartItem, CartTotals } from './interfaces'
import { invariants as i } from './invariants'
import { documents as _ } from './documents'

const sales_ = {
    shipping: (map => <T extends Order<Shipping>>({ shipping, invoiced, refunded, canceled }: T) => ({
        ci: minusPrice(shipping, addPrices(map(canceled), map(invoiced))),
        cr: minusPrice(shipping, addPrices(map(canceled), map(refunded))),
        ir: minusPrice(map(invoiced), map(refunded)),
    }))((documents: Shipping[]) => addPrices(...documents.map(({ shipping }) => shipping))),
    total: (map => <T extends Order<Total>>({ total, invoiced, refunded, canceled }: T) => ({
        ci: minusPrice(total, addPrices(map(canceled), map(invoiced))),
        cr: minusPrice(total, addPrices(map(canceled), map(refunded))),
        ir: minusPrice(map(invoiced), map(refunded)),
    }))((documents: Total[]) => addPrices(...documents.map(({ total }) => total))),
    items: <V extends ItemQty & Total & Price, U extends Items<V>, T extends Order<U>>(order: T) => ({
        ci: _.items.minus<V, U, V, U>([order], [...order.canceled, ...order.invoiced]),
        cr: _.items.minus<V, U, V, U>([order], [...order.canceled, ...order.refunded]),
        ir: _.items.minus<V, U, V, U>(order.invoiced, order.refunded) }) }

type ItemQT_ = ItemQty & Total;

export const order = {
    shipping: <U extends Shipping, T extends Order<U>>(order: T) => ({
        invoice: (invoice: U): Qty & Total => (({ total, qty }) => ({ qty, total: total.ci }))(i.shipping({ ...order, invoiced: [...order.invoiced, invoice] })),
        cancel: (cancelation: U): Qty & Total => (({ total, qty }) => ({ qty, total: total.ci }))(i.shipping({ ...order, canceled: [...order.canceled, cancelation] })),
        refund: (refund: U): Qty & Total => (({ total, qty }) => ({ qty, total: total.ir }))(i.shipping({ ...order, refunded: [...order.refunded, refund] })) }),
    itemsQty: <V extends ItemQty, U extends Items<V>, T extends Order<U>>(order: T) => ({
        invoice: (invoice: U) => i.items.qty<V, U, T>({ ...order, invoiced: [...order.invoiced, invoice] }).ci,
        cancel: (cancelation: U) => i.items.qty<V, U, T>({ ...order, canceled: [...order.canceled, cancelation] }).ci,
        refund: (refund: U) => i.items.qty<V, U, T>({ ...order, refunded: [...order.refunded, refund ]}).ir }),
    sales: sales_,
    total: <S extends CartItem,
        D extends Cart<S>,
        I extends S & Total,
        R extends Items<I>,
        T extends Order<R & Shipping & Total>
    >(order: T) => ({
        invoice: (invoice: D) => ({
            ...invoice,
            shipping: addPrices(sales_.shipping(order).ir, Math.min(invoice.shipping, sales_.shipping(order).ci)),
            items: [...sales_.items<I, R, T>(order).ir, ...takeItems(false)(sales_.items<I, R, T>(order).ci, invoice.items)],
            total: <U extends S & Total, V extends D & CartTotals<U>>(cart: V): D & Total & Items<U> =>
                ((shipping, items, total) =>
                    ((shipping_, totals) =>
                        (total_ => (invoice => (order => ({
                            ...invoice,
                            total: i.items.qty(order).ci.filter(({ qty }) => qty !== 0).length > 0
                                ? total_
                                : addPrices(total_, i.total(order).ci)
                        }))({ ...order, invoiced: [...order.invoiced, invoice] }))({
                            ...invoice,
                            shipping: shipping_,
                            items: _.items.minus<ItemQT_, Items<ItemQT_>, U, Items<U>>([{ items }], [{ items: totals }]),
                            total: total_,
                        }))(Math.max(0, Math.min(
                            sales_.total(order).ci, minusPrice(
                                addPrices(total, shipping_),
                                addPrices(shipping, _.total(totals))))))
                    )(Math.max(0, Math.min(sales_.shipping(order).ci, shipping)),
                        _.items.total([
                            { items: sales_.items<I, R, T>(order).ci
                                .map(item => ({ ...item, total: -item.total })) },
                            { items }])
                                .filter(({ total }) => total > 0)
                                .map(item => ({ ...item, qty: 0 })))
                )(minusPrice(cart.shipping, sales_.shipping(order).ir),
                    _.items.minus<U, V, U, V>([cart], [{ ...cart, items: sales_.items(order).ir }]),
                    minusPrice(cart.total, sales_.total(order).ir)) }),
        cancel: (cancel: D) => ({
            ...cancel,
            shipping: minusPrice(sales_.shipping(order).cr, Math.min(sales_.shipping(order).ci, cancel.shipping)),
            items: _.items.minus<I, Items<I>, I, T>(
                [{ ...order, items: sales_.items(order).cr }],
                [{ items: takeItems(true)(sales_.items<I, R, T>(order).ci, cancel.items) }]),
            total: <U extends S & Total, V extends D & CartTotals<U>>(cart: V): D & Total & Items<U> =>
                ((shipping, items, total) =>
                    ((shipping_, totals) => ({
                        ...cancel,
                        shipping: shipping_,
                        items: _.items.minus<ItemQT_, Items<ItemQT_>, U, Items<U>>([{ items }], [{ items: totals }]),
                        total: Math.max(0, Math.min(sales_.total(order).ci, minusPrice(addPrices(total, shipping_), addPrices(shipping, _.total(totals))))),
                    }))(Math.max(0, Math.min(sales_.shipping(order).ci, shipping)),
                        _.items.total([
                            { items: sales_.items(order).ci.map(item => ({ ...item, total: -item.total })) },
                            { items }])
                                .filter(({ total }) => total > 0)
                                .map(item => ({ ...item, qty: 0 })))
                )(minusPrice(sales_.shipping(order).cr, cart.shipping),
                    _.items.minus<U, V, U, V>([{ ...cart, items: sales_.items(order).cr }], [cart]),
                    minusPrice(sales_.total(order).cr, cart.total)) }),
        refund: (refund: D) => ({
            ...refund,
            shipping: minusPrice(sales_.shipping(order).cr, Math.min(sales_.shipping(order).ir, refund.shipping)),
            items: _.items.minus<I, Items<I>, I, T>(
                [{ ...order, items: sales_.items(order).cr }],
                [{ items: takeItems(true)(sales_.items<I, R, T>(order).ir, refund.items) }]),
            total: <U extends S & Total, V extends D & CartTotals<U>>(cart: V): D & Total & Items<U> =>
                ((shipping, items, total) =>
                    (shipping_ => ({
                        ...refund,
                        shipping: shipping_,
                        items, // TODO: Prove, that we don't need to check "extra refund" per items, like in cancelation/invoice case
                        total: Math.max(0, Math.min(sales_.total(order).ir, minusPrice(addPrices(total, shipping_), shipping))),
                    }))(Math.max(0, Math.min(sales_.shipping(order).ir, shipping)))
                )(minusPrice(sales_.shipping(order).cr, cart.shipping),
                    _.items.minus<U, V, U, V>([{ ...cart, items: sales_.items(order).cr }], [cart]),
                    minusPrice(sales_.total(order).cr, cart.total)) }) }) }
