import { Items, Item, Total, Shipping, ItemTotal, ItemQty, Price } from './interfaces'
import { addPrices, itemsGroupReduce, minusItem } from './basics'

const mergeItems_ = <U extends Item, T extends Items<U>>(documents: T[]) => documents
    .reduce((acc, document) => [...acc, ...document.items], [] as U[])

export const documents = {
    total: <T extends Total>(documents: T[]) => addPrices(...documents.map(({ total }) => total)),
    shipping: <T extends Shipping>(documents: T[]) => addPrices(...documents.map(({ shipping }) => shipping)),
    items: {
        total: <U extends ItemTotal, T extends Items<U>>(documents: T[]) =>
            itemsGroupReduce<U, U>(item => ({ ...item, total: 0 }))(
                mergeItems_(documents),
                (acc, item) => ({ ...acc, ...item, total: addPrices(acc.total, item.total) })),
        qty: <U extends ItemQty, T extends Items<U>>(documents: T[]) =>
            itemsGroupReduce<U, U>(item => ({ ...item, qty: 0 }))(
                mergeItems_(documents),
                (acc, item) => ({ ...acc, ...item, qty: acc.qty + item.qty })),
        minus: <
            I extends  ItemQty & Total, S extends Items<I>,
            P extends ItemQty & Total & Price, T extends Items<P>
        >(from: T[], subtrahend: S[]) =>
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