import { Total, Qty, Items, Price, Item, ItemQty } from './interfaces'
import { documents } from './documents'

export const addPrices = (...prices: number[]) => prices.reduce((result, price) => numberToPrice_(result + price), 0)
export const minusPrice = (a: number, b: number) => Number.parseFloat((a - b).toFixed(2))
export const itemPrice = <T extends Qty & Price>({ price, qty }: T) => numberToPrice_(qty * price)
export const itemDiscount = <T extends Total & Qty & Price>({ total, ...item }: T) => minusPrice(itemPrice(item), total)
export const divideTotal = <T extends Total & Qty>(item: T) => Array.from(Array(item.qty).keys())
    .reduce(({ items, sum }, n) => (
        total_ => ({ items: [...items, { ...item, total: minusPrice(total_, sum), qty: 1 }], sum: total_ })
    )(numberToPrice_(item.total * (n + 1) / item.qty)), { items: [] as T[], sum: 0 }).items

export const itemsReduce = <U>(id: string, init: U) =>
    <T extends Item>(items: T[], reducer: (acc: U, item: T) => U) => items
        .reduce((acc, item) => item.id === id ? reducer(acc, item) : acc, init)
export const itemsGroupReduce = <U, T extends Item>(init: (item: T) => U) =>
    (items: T[], reducer: (acc: U, item: T) => U) => Object.entries(items
        .reduce((acc, item) => acc[item.id] ? acc : { ...acc, [item.id]: init(item) }, {} as { [id: string]: U }))
        .reduce((acc, [id, init]) => [...acc, itemsReduce(id, init)(items, reducer)], [] as U[])
export const takeItems = (cheapest: boolean) =>
    <T extends ItemQty & Total, U extends ItemQty>(from: T[], items: U[]) => documents.items
        .qty<U, Items<U>>([{ items }])
        .reduce((acc, item) => [...acc, ...takeItem(cheapest)<T, U>(from.filter(({ id }) => id === item.id), item)], [] as (U & T)[])

export const enrichItem = <T extends Qty & Price & { total?: number }>(item: T): T & Total =>
    ({ ...item,
        total: typeof item.total === 'number'
            ? item.total
            : itemPrice(item) })

export const minusItem = <T extends Qty & Total & Price, U extends Qty & Total>(item: U) =>
    (from: T[]) => from.length === 1
        ? [{...from[0], qty: from[0].qty - item.qty, total: minusPrice(from[0].total, item.total)}]
            .filter(({qty}) => qty > 0)
        : (splitted => (({ skipped, item }) =>
            spreadAdjustment(-item.total, splitted
                .reduce((acc, items) => [...acc, items
                    .reduce(
                        (item_, splitted_) => skipped.indexOf(splitted_) === -1
                            ? item_
                            : {
                                ...item_,
                                total: addPrices(item_.total, splitted_.total),
                                qty: item_.qty + 1 },
                        { ...items[0], total: 0, qty: 0 } as T)], [])
                .filter(({ qty }) => qty > 0)).next()
            )(splitItem_(item)(splitted))
                .filter(({ qty }) => qty > 0)
        )(from.map(item => divideTotal(item)))

export const takeItem = (cheapest: boolean) =>
    <T extends Qty & Total, U extends Qty>(from: T[], item: U) => [...from]
        .sort((a, b) => cheapest
            ? a.total / a.qty - b.total / b.qty
            : b.total / b.qty - a.total / a.qty)
        .reduce(
            ({ qty, selected }, item_) => qty === 0
                ? { qty, selected }
                : qty >= item_.qty
                    ? { qty: qty - item_.qty, selected: [...selected, { ...item, ...item_ }] }
                    : { qty: 0, selected: [...selected, {
                        ...item,
                        ...item_,
                        qty,
                        total: numberToPrice_(qty * item_.total / item_.qty, !cheapest) }] },
            { qty: item.qty, selected: [] } as { qty: number, selected: (U & T)[] }).selected

export const spreadAdjustment = <T extends Total & Qty & Price>(
    amount: number,
    items: T[]
) => amount == 0 || items.length === 0
    ? { amount, items, next: () => items }
    : amount < 0
        ? (total => (rest => rest < 0
            ? { amount: rest,
                items: items.map(item => ({ ...item, total: 0 })),
                next: () => (qty => [...items]
                    .sort(({ qty: a }, { qty: b }) => b - a)
                    .reduce(({ qty: qty_, acc, items }, item) => (acc_ => ({
                        qty: qty_ + item.qty, acc: acc_,
                        items: [...items, { ...item, total: minusPrice(acc_, acc) }],
                    }))(numberToPrice_(rest * (qty_ + item.qty) / qty)), {
                        qty: 0, acc: 0, items: [] as T[] }
                    ).items)(items.reduce((acc, { qty }) => acc + qty, 0)),
            } : (items => ({ amount: 0, items, next: () => items }))(sortTotals_(items, false)
                .reduce(({ total: total_, acc, items }, item) => (acc_ => ({
                    total: addPrices(total_, item.total), acc: acc_,
                    items: [...items, { ...item, total: minusPrice(addPrices(item.total, acc_), acc) }],
                }))(numberToPrice_(amount * addPrices(total_, item.total) / total)), {
                    total: 0, acc: 0, items: [] as T[] }
                ).items))(addPrices(total, amount)))(documents.total(items))
        : (discounts => (total =>
            (rest => rest > 0
                ? { amount: rest,
                    items: items.map(item => ({ ...item, total: itemPrice(item) })),
                    next: () => (invSum => [...items]
                        .sort((a, b) => itemPrice(a) - itemPrice(b))
                        .reduce(({ invTotal, acc, items }, item) => (acc_ => ({
                            invTotal: invTotal + 1 / itemPrice(item), acc: acc_,
                            items: [...items, { ...item, total: minusPrice(addPrices(itemPrice(item), acc_), acc) }],
                        }))(numberToPrice_(rest * (invTotal + 1 / itemPrice(item)) / invSum)), {
                            invTotal: 0, acc: 0, items: [] as T[] }
                        ).items)(items.reduce((acc, item) => acc + 1 / itemPrice(item), 0))
                } : (items => ({ amount: 0, items, next: () => items }))(sortTotals_(discounts, false)
                    .reduce(({ total: total_, acc, items }, item) => (acc_ => ({
                        total: addPrices(total_, item.total), acc: acc_,
                        items: [...items, { ...item, total: minusPrice(addPrices(item.total, acc), acc_) }],
                    }))(numberToPrice_(amount * addPrices(total_, item.total) / total)), {
                        total: 0, acc: 0, items: [] as T[] }
                    ).items.map(item => ({ ...item, total: itemDiscount(item) })))
            )(minusPrice(amount, total))
        )(documents.total(discounts)))(items.map(item => ({ ...item, total: itemDiscount(item) })))


const numberToPrice_ = (a: number, up = true) => up
    ? Number.parseFloat(a.toFixed(2))
    : Number.parseFloat((Math.ceil(a * 100 - .5) / 100).toFixed(2))
const sortTotals_ = <T extends Total>(items: T[], asc = true) => [...items]
    .sort(({ total: a }, { total: b }) => asc ? minusPrice(a, b) : minusPrice(b, a))
type Split_<T> = [T[], T[]]
const splitItem_ = <T extends Qty & Total, U extends Qty & Total>(item: U) =>
    (from: T[][], selected: T[] = [], skipped: T[] = []): { item: U, selected: T[], skipped: T[] } =>
        (([selected_, skipped_]) => selected_.length === 0
            ? {
                item: { ...item, total: minusPrice(
                    addPrices(item.total, ...selected
                        .slice(Math.min(item.qty, selected.length))
                        .map(({ total }) => total)),
                    addPrices(...skipped
                        .slice(0, Math.max(0, item.qty - selected.length))
                        .map(({ total }) => total)))},
                selected: [
                    ...selected.slice(0, Math.min(item.qty, selected.length)),
                    ...skipped.slice(0, Math.max(0, item.qty - selected.length))],
                skipped: [
                    ...selected.slice(Math.min(item.qty, selected.length)),
                    ...skipped.slice(Math.max(0, item.qty - selected.length))] }
            : (([head, ...tail]) => (include => include.item.total === 0
                ? include
                : (exclude => Math.abs(include.item.total) > Math.abs(exclude.item.total) ? exclude : include)(
                    splitItem_<T, U>(item)([tail], selected, [...skipped_, head])
                ))(splitItem_<T, U>({ ...item, total: minusPrice(item.total, head.total) })([tail], [...selected, head], skipped_))
            )(sortTotals_(selected_))
        )(
            (([selected_, skipped_]) => skipped_.length === 0
                ? [selected_, skipped]
                : (([head, ...tail]) => [[...selected_, head], [...skipped, ...tail]])(sortTotals_(skipped_))
            )(from
                .reduce((acc, items) => items
                    .reduce(([ selected_, skipped_ ], item_) => item_.total <= item.total
                        ? [[...selected_, item_], skipped_] as Split_<T>
                        : [selected_, [...skipped_, item_]] as Split_<T>, acc), [[], []] as Split_<T>)))
