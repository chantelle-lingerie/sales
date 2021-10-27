import { TotalRO, OrderRO, ShippingRO, ItemQtyRO, ItemsRO, ItemTotalRO } from '../readonlyInterfaces'
import { minusPrice } from './basics'
import { documents } from './documents'

export const invariants = {
    total: (injectable: {
        mp: ReturnType<typeof minusPrice>,
        dt: ReturnType<typeof documents.total>,
    }) => <T extends OrderRO<TotalRO>>({ total, invoiced, canceled, refunded }: T) => ({
        ci: injectable.mp(total, injectable.dt([...canceled, ...invoiced])),
        ir: injectable.mp(injectable.dt(invoiced), injectable.dt(refunded)) }),
    shipping: (injectable: {
        mp: ReturnType<typeof minusPrice>,
        ds: ReturnType<typeof documents.shipping>,
    }) => <T extends OrderRO<ShippingRO>>({ shipping, invoiced, refunded, canceled }: T) => {
        const total = {
            ci: injectable.mp(shipping, injectable.ds([...canceled, ...invoiced])),
            ir: injectable.mp(injectable.ds(invoiced), injectable.ds(refunded)) }
        const [invoiced_, refunded_, canceled_] = [invoiced, refunded, canceled]
            .map(documents => documents.filter(({ shipping }) => shipping !== 0))
        const wrong = [invoiced_, refunded_, canceled_].filter(documents => documents.length > 1)
        const qty = wrong.length !== 0
            ? 1 - wrong[0].length
            : canceled_.length === 0 || invoiced_.length === 0
                ? invoiced_.length - refunded_.length
                : -canceled_.length
        return { total, qty }
    },
    items: {
        qty: (diq: ReturnType<typeof documents.items.qty>) => <V extends ItemQtyRO, U extends ItemsRO<V>, T extends OrderRO<U>>(order: T) => {
            const invertQty = (document: U) => ({
                ...document,
                items: document.items.map(({ qty, ...item }) => ({ ...item, qty: -qty })) })
            const reducer = (from: readonly U[], subtrahend: readonly U[]) => diq<V, U>([
                ...from,
                ...subtrahend.map(invertQty)])
            return {
                ci: reducer([order], [...order.canceled, ...order.invoiced]),
                ir: reducer(order.invoiced, order.refunded) }
        },
        total: (dit: ReturnType<typeof documents.items.total>) => <V extends ItemTotalRO, U extends ItemsRO<V>, T extends OrderRO<U>>(order: T) => {
            const invertTotal = (document: U) => ({
                ...document,
                items: document.items.map(({ total, ...item }) => ({ ...item, total: -total })) })
            const reducer = (from: readonly U[], subtrahend: readonly U[]) => dit<V, U>([
                ...from,
                ...subtrahend.map(invertTotal)])
            return {
                ci: reducer([order], [...order.canceled, ...order.invoiced]),
                ir: reducer(order.invoiced, order.refunded) }
        } } }