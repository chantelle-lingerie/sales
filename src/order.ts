import { CartRO, TotalRO, OrderRO, ShippingRO, ItemsRO, ItemQtyRO, PriceRO, CartItemRO, CartTotalsRO } from './readonlyInterfaces'
import { takeItems, addPrices, minusPrice } from './basics'
import { invariants as i } from './invariants'
import { documents as _ } from './documents'

const sales_ = {
    shipping: (map => <T extends OrderRO<ShippingRO>>({ shipping, invoiced, refunded, canceled }: T) => ({
        ci: minusPrice(shipping, addPrices(map(canceled), map(invoiced))),
        cr: minusPrice(shipping, addPrices(map(canceled), map(refunded))),
        ir: minusPrice(map(invoiced), map(refunded)),
    }))((documents: readonly ShippingRO[]) => addPrices(...documents.map(({ shipping }) => shipping))),
    total: (map => <T extends OrderRO<TotalRO>>({ total, invoiced, refunded, canceled }: T) => ({
        ci: minusPrice(total, addPrices(map(canceled), map(invoiced))),
        cr: minusPrice(total, addPrices(map(canceled), map(refunded))),
        ir: minusPrice(map(invoiced), map(refunded)),
    }))((documents: readonly TotalRO[]) => addPrices(...documents.map(({ total }) => total))),
    items: <V extends ItemQtyRO & TotalRO & PriceRO, U extends ItemsRO<V>, T extends OrderRO<U>>(order: T) => ({
        ci: _.items.minus<V, U, V, U>([order], [...order.canceled, ...order.invoiced]),
        cr: _.items.minus<V, U, V, U>([order], [...order.canceled, ...order.refunded]),
        ir: _.items.minus<V, U, V, U>(order.invoiced, order.refunded) }) }

type ItemQT_ = ItemQtyRO & TotalRO;

export const order = {
    shipping: <U extends ShippingRO, T extends OrderRO<U>>(order: T) => ({
        invoice: (invoice: U) => (({ total, qty }) => ({ qty, total: total.ci }))(i.shipping({ ...order, invoiced: [...order.invoiced, invoice] })),
        cancel: (cancelation: U) => (({ total, qty }) => ({ qty, total: total.ci }))(i.shipping({ ...order, canceled: [...order.canceled, cancelation] })),
        refund: (refund: U) => (({ total, qty }) => ({ qty, total: total.ir }))(i.shipping({ ...order, refunded: [...order.refunded, refund] })) }),
    itemsQty: <V extends ItemQtyRO, U extends ItemsRO<V>, T extends OrderRO<U>>(order: T) => ({
        invoice: (invoice: U) => i.items.qty<V, U, T>({ ...order, invoiced: [...order.invoiced, invoice] }).ci,
        cancel: (cancelation: U) => i.items.qty<V, U, T>({ ...order, canceled: [...order.canceled, cancelation] }).ci,
        refund: (refund: U) => i.items.qty<V, U, T>({ ...order, refunded: [...order.refunded, refund ]}).ir }),
    sales: sales_,
    total: <S extends CartItemRO,
        D extends CartRO<S>,
        I extends S & TotalRO,
        R extends ItemsRO<I>,
        T extends OrderRO<R & ShippingRO & TotalRO>
    >(order: T) => ({
        invoice: (invoice: D) => ({
            ...invoice,
            shipping: addPrices(sales_.shipping(order).ir, Math.min(invoice.shipping, sales_.shipping(order).ci)),
            items: [...sales_.items<I, R, T>(order).ir, ...takeItems(false)(sales_.items<I, R, T>(order).ci, invoice.items)],
            total: <U extends S & TotalRO, V extends D & CartTotalsRO<U>>(cart: V) =>
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
                            items: _.items.minus<ItemQT_, ItemsRO<ItemQT_>, U, ItemsRO<U>>([{ items }], [{ items: totals }]),
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
            items: _.items.minus<I, ItemsRO<I>, I, T>(
                [{ ...order, items: sales_.items(order).cr }],
                [{ items: takeItems(true)(sales_.items<I, R, T>(order).ci, cancel.items) }]),
            total: <U extends S & TotalRO, V extends D & CartTotalsRO<U>>(cart: V) =>
                ((shipping, items, total) =>
                    ((shipping_, totals) => ({
                        ...cancel,
                        shipping: shipping_,
                        items: _.items.minus<ItemQT_, ItemsRO<ItemQT_>, U, ItemsRO<U>>([{ items }], [{ items: totals }]),
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
            items: _.items.minus<I, ItemsRO<I>, I, T>(
                [{ ...order, items: sales_.items(order).cr }],
                [{ items: takeItems(true)(sales_.items<I, R, T>(order).ir, refund.items) }]),
            total: <U extends S & TotalRO, V extends D & CartTotalsRO<U>>(cart: V) =>
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
