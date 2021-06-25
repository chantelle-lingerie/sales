import { ItemsRO, ItemRO, TotalRO, ShippingRO, ItemTotalRO, ItemQtyRO, PriceRO } from './readonlyInterfaces'
import { addPrices, itemsGroupReduce, minusItem } from './basics'

const mergeItems_ = <U extends ItemRO, T extends ItemsRO<U>>(documents: readonly T[]) => documents
    .reduce((acc, document) => [...acc, ...document.items], [] as U[])

export const documents = {
    total: <T extends TotalRO>(documents: readonly T[]) => addPrices(...documents.map(({ total }) => total)),
    shipping: <T extends ShippingRO>(documents: readonly T[]) => addPrices(...documents.map(({ shipping }) => shipping)),
    items: {
        total: <U extends ItemTotalRO, T extends ItemsRO<U>>(documents: readonly T[]) =>
            itemsGroupReduce<U, U>(item => ({ ...item, total: 0 }))(
                mergeItems_(documents),
                (acc, item) => ({ ...acc, ...item, total: addPrices(acc.total, item.total) })),
        qty: <U extends ItemQtyRO, T extends ItemsRO<U>>(documents: readonly T[]) =>
            itemsGroupReduce<U, U>(item => ({ ...item, qty: 0 }))(
                mergeItems_(documents),
                (acc, item) => ({ ...acc, ...item, qty: acc.qty + item.qty })),
        minus: <
            I extends  ItemQtyRO & TotalRO, S extends ItemsRO<I>,
            P extends ItemQtyRO & TotalRO & PriceRO, T extends ItemsRO<P>
        >(from: readonly T[], subtrahend: readonly S[]) =>
            itemsGroupReduce<I, I>(item => ({ ...item, qty: 0, total: 0 }))(
                mergeItems_(subtrahend),
                (acc, item) => ({
                    ...acc,
                    ...item,
                    qty: acc.qty + item.qty,
                    total: addPrices(acc.total, item.total) }))
                .reduce((acc, item) => (([selected, skipped]) => [...skipped, ...minusItem<P, I>(item)(selected)])(
                    acc.reduce(
                        ([selected, skipped], item_) =>
                            item.id === item_.id
                                ? [[...selected, item_], skipped] as [P[], P[]]
                                : [selected, [...skipped, item_]] as [P[], P[]], [[], []] as [P[], P[]])),
                    mergeItems_<P, T>(from)) } }