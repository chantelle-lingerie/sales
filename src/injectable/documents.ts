import { ItemRO, TotalRO, ShippingRO, ItemTotalRO, ItemsRO, ItemQtyRO, PriceRO } from '../readonlyInterfaces'
import { addPrices, itemsGroupReduce, minusItem } from './basics'

const mergeItems_ = <U extends ItemRO, T extends ItemsRO<U>>(documents: readonly T[]) => {
    const result: U[] = []
    for (const document of documents) {
        result.push(...document.items)
    }
    return result
}

export const documents = {
    total: (ap: ReturnType<typeof addPrices>) => <T extends TotalRO>(documents: readonly T[]) => ap(...documents.map(({ total }) => total)),
    shipping: (ap: ReturnType<typeof addPrices>) => <T extends ShippingRO>(documents: readonly T[]) => ap(...documents.map(({ shipping }) => shipping)),
    items: {
        total: (injectable: {
            ap: ReturnType<typeof addPrices>,
            igr: ReturnType<typeof itemsGroupReduce>,
        }) => <U extends ItemTotalRO, T extends ItemsRO<U>>(documents: readonly T[]) =>
            injectable.igr<U, U>(item => ({ ...item, total: 0 }))(
                mergeItems_(documents),
                (acc, item) => ({ ...acc, ...item, total: injectable.ap(acc.total, item.total) })),
        qty: (igr: ReturnType<typeof itemsGroupReduce>) => <U extends ItemQtyRO, T extends ItemsRO<U>>(documents: readonly T[]) =>
            igr<U, U>(item => ({ ...item, qty: 0 }))(
                mergeItems_(documents),
                (acc, item) => ({ ...acc, ...item, qty: acc.qty + item.qty })),
        minus: (injectable: {
            ap: ReturnType<typeof addPrices>,
            igr: ReturnType<typeof itemsGroupReduce>,
            mi: ReturnType<typeof minusItem>,
        }) => <
            I extends  ItemQtyRO & TotalRO, S extends ItemsRO<I>,
            P extends ItemQtyRO & TotalRO & PriceRO, T extends ItemsRO<P>
        >(from: readonly T[], subtrahend: readonly S[]) => {
            const grouped = injectable.igr<I, I>(item => ({ ...item, qty: 0, total: 0 }))(
                mergeItems_(subtrahend),
                (acc, item) => ({
                    ...acc,
                    ...item,
                    qty: acc.qty + item.qty,
                    total: injectable.ap(acc.total, item.total) }))
            let result = mergeItems_<P, T>(from)
            for (const item of grouped) {
                const selected: P[] = []
                const skipped: P[] = []
                for (const item_ of result) {
                    item.id === item_.id ? selected.push(item_) : skipped.push(item_)
                }
                skipped.push(...injectable.mi<P, I>(item)(selected))
                result = skipped
            }
            return result
        } } }