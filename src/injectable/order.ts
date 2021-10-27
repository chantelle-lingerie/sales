import { OrderRO, ShippingRO, TotalRO, ItemQtyRO, PriceRO, ItemsRO, CartItemRO, CartRO, CartTotalsRO } from '../readonlyInterfaces'
import { addPrices, minusPrice, takeItems } from './basics'
import { documents } from './documents'
import { invariants } from './invariants'

const sales_ = {
    shipping: (injectable: { mp: ReturnType<typeof minusPrice>, ap: ReturnType<typeof addPrices> }) => {
        const map = (documents: readonly ShippingRO[]) => injectable.ap(...documents.map(({ shipping }) => shipping))
        return <T extends OrderRO<ShippingRO>>({ shipping, invoiced, refunded, canceled }: T) => ({
            ci: injectable.mp(shipping, injectable.ap(map(canceled), map(invoiced))),
            cr: injectable.mp(shipping, injectable.ap(map(canceled), map(refunded))),
            ir: injectable.mp(map(invoiced), map(refunded)) })
    },
    total: (injectable: { mp: ReturnType<typeof minusPrice>, ap: ReturnType<typeof addPrices> }) => {
        const map = (documents: readonly TotalRO[]) => injectable.ap(...documents.map(({ total }) => total))
        return <T extends OrderRO<TotalRO>>({ total, invoiced, refunded, canceled }: T) => ({
            ci: injectable.mp(total, injectable.ap(map(canceled), map(invoiced))),
            cr: injectable.mp(total, injectable.ap(map(canceled), map(refunded))),
            ir: injectable.mp(map(invoiced), map(refunded)) })
    },
    items: (dim: ReturnType<typeof documents.items.minus>) =>
        <V extends ItemQtyRO & TotalRO & PriceRO, U extends ItemsRO<V>, T extends OrderRO<U>>(order: T) => ({
            ci: dim<V, U, V, U>([order], [...order.canceled, ...order.invoiced]),
            cr: dim<V, U, V, U>([order], [...order.canceled, ...order.refunded]),
            ir: dim<V, U, V, U>(order.invoiced, order.refunded) }) }

type ItemQT_ = ItemQtyRO & TotalRO

export const order = {
    shipping: (is: ReturnType<typeof invariants.shipping>) =>
        <U extends ShippingRO, T extends OrderRO<U>>(order: T) => ({
            invoice: (invoice: U) => {
                const { total, qty } = is({ ...order, invoiced: [...order.invoiced, invoice] })
                return { qty, total: total.ci }
            },
            cancel: (cancelation: U) => {
                const { total, qty } = is({ ...order, canceled: [...order.canceled, cancelation] })
                return { qty, total: total.ci }
            },
            refund: (refund: U) => {
                const { total, qty } = is({ ...order, refunded: [...order.refunded, refund] })
                return { qty, total: total.ir }
            } }),
    itemsQty: (iiq: ReturnType<typeof invariants.items.qty>) => <V extends ItemQtyRO, U extends ItemsRO<V>, T extends OrderRO<U>>(order: T) => ({
        invoice: (invoice: U) => iiq<V, U, T>({ ...order, invoiced: [...order.invoiced, invoice] }).ci,
        cancel: (cancelation: U) => iiq<V, U, T>({ ...order, canceled: [...order.canceled, cancelation] }).ci,
        refund: (refund: U) => iiq<V, U, T>({ ...order, refunded: [...order.refunded, refund ]}).ir }),
    sales: sales_,
    total: (injectable: {
        mp: ReturnType<typeof minusPrice>,
        ap: ReturnType<typeof addPrices>,
        ti: ReturnType<typeof takeItems>,
        dim: ReturnType<typeof documents.items.minus>,
        iiq: ReturnType<typeof invariants.items.qty>,
        it: ReturnType<typeof invariants.total>,
        dt: ReturnType<typeof documents.total>,
        dit: ReturnType<typeof documents.items.total>,
    }) => <S extends CartItemRO,
        I extends S & TotalRO,
        R extends ItemsRO<I>,
        T extends OrderRO<R & ShippingRO & TotalRO>
    >(order: T) => {
        const invoice = <D extends CartRO<S>>(invoice: D) => {
            const shipping = injectable.ap(sales_.shipping(injectable)(order).ir, Math.min(invoice.shipping, sales_.shipping(injectable)(order).ci))
            const items = [...sales_.items(injectable.dim)<I, R, T>(order).ir, ...injectable.ti(false)(sales_.items(injectable.dim)<I, R, T>(order).ci, invoice.items)]
            const total = <U extends S & TotalRO, V extends D & CartTotalsRO<U>>(cart: V) => {
                const shipping = injectable.mp(cart.shipping, sales_.shipping(injectable)(order).ir)
                const items = injectable.dim<U, V, U, V>([cart], [{ ...cart, items: sales_.items(injectable.dim)(order).ir }])
                const total = injectable.mp(cart.total, sales_.total(injectable)(order).ir)
                const shipping_ = Math.max(0, Math.min(sales_.shipping(injectable)(order).ci, shipping))
                const totals = injectable.dit([
                    { items: sales_.items(injectable.dim)<I, R, T>(order).ci.map(item => ({ ...item, total: -item.total })) },
                    { items }])
                        .filter(({ total }) => total > 0)
                        .map(item => ({ ...item, qty: 0 }))
                const total_ = Math.max(0, Math.min(
                    sales_.total(injectable)(order).ci, injectable.mp(
                        injectable.ap(total, shipping_),
                        injectable.ap(shipping, injectable.dt(totals)))))
                const invoice_ = {
                    ...invoice,
                    shipping: shipping_,
                    items: injectable.dim<ItemQT_, ItemsRO<ItemQT_>, U, ItemsRO<U>>([{ items }], [{ items: totals }]),
                    total: total_ }
                const order_ = { ...order, invoiced: [...order.invoiced, invoice_] }
                const invoiceTotal = injectable.iiq(order_).ci
                    .filter(({ qty }) => qty !== 0)
                    .length > 0
                        ? total_
                        : injectable.ap(total_, injectable.it(order_).ci)
                return { ...invoice_, total: invoiceTotal }
            }
            return { ...invoice, shipping, items, total }
        }
        const cancel = <D extends CartRO<S>>(cancel: D) => {
            const shipping = injectable.mp(sales_.shipping(injectable)(order).cr, Math.min(sales_.shipping(injectable)(order).ci, cancel.shipping))
            const items = injectable.dim<I, ItemsRO<I>, I, T>(
                [{ ...order, items: sales_.items(injectable.dim)(order).cr }],
                [{ items: injectable.ti(true)(sales_.items(injectable.dim)<I, R, T>(order).ci, cancel.items) }])
            const total = <U extends S & TotalRO, V extends D & CartTotalsRO<U>>(cart: V) => {
                const shipping = injectable.mp(sales_.shipping(injectable)(order).cr, cart.shipping)
                const items = injectable.dim<U, V, U, V>([{ ...cart, items: sales_.items(injectable.dim)(order).cr }], [cart])
                const total = injectable.mp(sales_.total(injectable)(order).cr, cart.total)
                const shipping_ = Math.max(0, Math.min(sales_.shipping(injectable)(order).ci, shipping))
                const totals = injectable.dit([
                    { items: sales_.items(injectable.dim)(order).ci.map(item => ({ ...item, total: -item.total })) },
                    { items }])
                        .filter(({ total }) => total > 0)
                        .map(item => ({ ...item, qty: 0 }))
                const items_ = injectable.dim<ItemQT_, ItemsRO<ItemQT_>, U, ItemsRO<U>>([{ items }], [{ items: totals }])
                const total_ = Math.max(0, Math.min(sales_.total(injectable)(order).ci, injectable.mp(injectable.ap(total, shipping_), injectable.ap(shipping, injectable.dt(totals)))))
                return { ...cancel, shipping: shipping_, items: items_, total: total_ }
            }
            return { ...cancel, shipping, items, total }
        }
        const refund = <D extends CartRO<S>>(refund: D) => {
            const shipping = injectable.mp(sales_.shipping(injectable)(order).cr, Math.min(sales_.shipping(injectable)(order).ir, refund.shipping))
            const items = injectable.dim<I, ItemsRO<I>, I, T>(
                [{ ...order, items: sales_.items(injectable.dim)(order).cr }],
                [{ items: injectable.ti(true)(sales_.items(injectable.dim)<I, R, T>(order).ir, refund.items) }])
            const total = <U extends S & TotalRO, V extends D & CartTotalsRO<U>>(cart: V) => {
                const shipping = injectable.mp(sales_.shipping(injectable)(order).cr, cart.shipping)
                // TODO: Prove, that we don't need to check "extra refund" per items, like in cancelation/invoice case
                const items = injectable.dim<U, V, U, V>([{ ...cart, items: sales_.items(injectable.dim)(order).cr }], [cart])
                const total = injectable.mp(sales_.total(injectable)(order).cr, cart.total)
                const shipping_ = Math.max(0, Math.min(sales_.shipping(injectable)(order).ir, shipping))
                const total_ = Math.max(0, Math.min(sales_.total(injectable)(order).ir, injectable.mp(injectable.ap(total, shipping_), shipping)))
                return { ...refund, shipping: shipping_, items, total: total_ }
            }
            return { ...refund, shipping, items, total }
        }
        return { invoice, cancel, refund }
    }
}