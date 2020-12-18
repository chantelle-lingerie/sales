import { minusPrice } from './basics'
import { Total, Order, Shipping, Items, ItemTotal, ItemQty } from './interfaces'
import { documents as _ } from './documents'

export const invariants = {
    total: <T extends Order<Total>>({ total, invoiced, canceled, refunded }: T) => ({
        ci: minusPrice(total, _.total([...canceled, ...invoiced])),
        ir: minusPrice(_.total(invoiced), _.total(refunded)) }),
    shipping: <T extends Order<Shipping>>({ shipping, invoiced, refunded, canceled }: T) => ({
        total: ({
            ci: minusPrice(shipping, _.shipping([...canceled, ...invoiced])),
            ir: minusPrice(_.shipping(invoiced), _.shipping(refunded)) }),
        qty: (([invoiced, refunded, canceled]) => (wrong => wrong.length !== 0
                ? 1 - wrong[0].length
                : canceled.length === 0 || invoiced.length === 0
                    ? invoiced.length - refunded.length
                    : -canceled.length
            )([invoiced, refunded, canceled].filter(documents => documents.length > 1))
        )([invoiced, refunded, canceled]
            .map(documents => documents.filter(({ shipping }) => shipping !== 0))) }),
    items: {
        qty: <V extends ItemQty, U extends Items<V>, T extends Order<U>>(order: T) => (reducer => ({
            ci: reducer([order], [...order.canceled, ...order.invoiced]),
            ir: reducer(order.invoiced, order.refunded)
        }))((from: U[], subtrahend: U[]) => _.items.qty<V, U>([
            ...from,
            ...subtrahend.map(document => ({
                ...document,
                items: document.items.map(({ qty, ...item }) => ({ ...item, qty: -qty })) }))])),
       total: <V extends ItemTotal, U extends Items<V>, T extends Order<U>>(order: T) => (reducer => ({
            ci: reducer([order], [...order.canceled, ...order.invoiced]),
            ir: reducer(order.invoiced, order.refunded)
        }))((from: U[], subtrahend: U[]) => _.items.total<V, U>([
            ...from,
            ...subtrahend.map(document => ({
                ...document,
                items: document.items.map(({ total, ...item }) => ({ ...item, total: -total })) }))]))
    }
}