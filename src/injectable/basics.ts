import { TotalRO, QtyRO, PriceRO, ItemRO, ItemQtyRO } from '../readonlyInterfaces'

export type NumberToPrice = (input: number) => number

export const addPrices = (ntp: NumberToPrice) =>
    (...prices: number[]) => prices.reduce((result, price) => ntp(result + price), 0)

export const minusPrice = (ntp: NumberToPrice) => (a: number, b: number) => ntp(a - b)

export const itemPrice = (ntp: NumberToPrice) => <T extends QtyRO & PriceRO>({ price, qty }: T) => ntp(qty * price)

export const enrichItem = (ntp: NumberToPrice) =>
    <T extends QtyRO & PriceRO & { total?: number }>(item: T) => {
        const total = typeof item.total === 'number'
            ? item.total
            : itemPrice(ntp)(item)
        return { ...item, total }
    }

export const itemDiscount = (ntp: NumberToPrice) => {
    const minusPrice_ = minusPrice(ntp)
    const itemPrice_ = itemPrice(ntp)
    return <T extends TotalRO & QtyRO & PriceRO>({ total, ...item }: T) => minusPrice_(itemPrice_(item), total)
}

export const divideTotal = (ntp: NumberToPrice) => {
    const minusPrice_ = minusPrice(ntp)
    return <T extends TotalRO & QtyRO>(item: T) => {
        const result = { items: [] as T[], sum: 0 }
        for (let n = 0; n < item.qty; n++) {
            const total = ntp(item.total * (n + 1) / item.qty)
            result.items.push({ ...item,
                total: minusPrice_(total, result.sum),
                qty: 1 })
            result.sum = total
        }
        return result.items
    }
}

type R<T> = readonly T[]
export type ItemReduce = <U>(id: string, init: U) => <T extends ItemRO>(items: R<T>, reducer: (acc: U, item: T) => U) => U

export const itemsGroupReduce = (itemsReduce: ItemReduce) =>
    <U, T extends ItemRO>(init: (item: T) => U) =>
        (items: R<T>, reducer: (acc: U, item: T) => U) => {
            const itemsInit: { [id: string]: U } = {}
            for (const item of items) {
                itemsInit[item.id] = init(item)
            }
            const result: U[] = []
            for (const id in itemsInit) {
                result.push(itemsReduce(id, itemsInit[id])(items, reducer))
            }
            return result
        }

export const takeItem = (ntp: {up: NumberToPrice, down: NumberToPrice}) =>
    (cheapest: boolean) => {
        const numberToPrice = cheapest ? ntp.down : ntp.up
        return <T extends QtyRO & TotalRO, U extends QtyRO>(from: R<T>, item: U) => {
            const sorted = [...from]
                .sort((a, b) => cheapest
                    ? a.total / a.qty - b.total / b.qty
                    : b.total / b.qty - a.total / a.qty)
            const result: { qty: number, selected: (U & T)[] } = { qty: item.qty, selected: [] }
            for (const item_ of sorted) {
                if (result.qty === 0) continue
                if (result.qty >= item_.qty) {
                    result.qty -= item_.qty
                    result.selected.push({ ...item, ...item_ })
                } else {
                    result.selected.push({
                        ...item,
                        ...item_,
                        qty: result.qty,
                        total: numberToPrice(result.qty * item_.total / item_.qty) })
                    result.qty = 0
                }
            }
            return result.selected
        }
    }

export const takeItems = ({up, down, reduce}: {up: NumberToPrice, down: NumberToPrice, reduce: ItemReduce}) =>
    (cheapest: boolean) =>
        <T extends ItemQtyRO & TotalRO, U extends ItemQtyRO>(from: R<T>, items: R<U>) => {
            const groupedQty = itemsGroupReduce(reduce)<U, U>(item => ({ ...item, qty: 0 }))
                (items, (acc, item) => ({ ...acc, ...item, qty: acc.qty + item.qty }))

            const result: (U & T)[] = []
            for (const item of groupedQty) {
                const filtered = from.filter(({ id }) => id === item.id)
                result.push(...takeItem({up, down})(cheapest)<T, U>(filtered, item))
            }
            return result
        }

export const spreadAdjustment = (ntp: NumberToPrice) =>
    <T extends TotalRO & QtyRO & PriceRO>(
        amount: number,
        items: R<T>
    ) => {
        if (amount == 0 || items.length === 0) return { amount, items, next: () => items }

        const addPrices_ = addPrices(ntp)
        const minusPrice_ = minusPrice(ntp)
        const sortTotals_ = <T extends TotalRO>(items: R<T>) => [...items]
            .sort(({ total: a }, { total: b }) => minusPrice_(b, a))
        const itemDiscount_ = itemDiscount(ntp)

        const totalItems = amount < 0 ? items : items.map(item => ({ ...item, total: itemDiscount_(item) }))
        const total = addPrices_(...totalItems.map(({ total }) => total))

        if (amount < 0) {
            const rest = addPrices_(total, amount)
            if (rest < 0) {
                const next = () => {
                    const qty = items.reduce((acc, { qty }) => acc + qty, 0)
                    const sorted = [...items]
                        .sort(({ qty: a }, { qty: b }) => b - a)

                    const result: { qty: number, acc: number, items: T[] } = { qty: 0, acc: 0, items: [] }
                    for (const item of sorted) {
                        const acc_ = ntp(rest * (result.qty + item.qty) / qty)
                        result.items.push({ ...item, total: minusPrice_(acc_, result.acc) })
                        result.acc = acc_
                        result.qty += item.qty
                    }
                    return result.items
                }
                return { amount: rest, items: items.map(item => ({ ...item, total: 0 })), next }
            }

            const sorted = sortTotals_(totalItems)
            const result: { total: number, acc: number, items: T[] } = { total: 0, acc: 0, items: [] }
            for (const item of sorted) {
                const acc_ = ntp(amount * addPrices_(result.total, item.total) / total)
                result.items.push({ ...item, total: minusPrice_(addPrices_(item.total, acc_), result.acc) })
                result.acc = acc_
                result.total = addPrices_(result.total, item.total)
            }
            return { amount: 0, items: result.items, next: () => result.items }
        }

        const rest = minusPrice_(amount, total)
        if (rest > 0) {
            const itemPrice_ = itemPrice(ntp)
            const next = () => {
                const invSum = items.reduce((acc, item) => acc + 1 / itemPrice_(item), 0)
                const sorted = [...items]
                    .sort((a, b) => itemPrice_(a) - itemPrice_(b))
                const result: { invTotal: number, acc: number, items: T[] } = { invTotal: 0, acc: 0, items: [] }
                for (const item of sorted) {
                    const acc_ = ntp(rest * (result.invTotal + 1 / itemPrice_(item)) / invSum)
                    result.items.push({ ...item, total: minusPrice_(addPrices_(itemPrice_(item), acc_), result.acc) })
                    result.acc = acc_
                    result.invTotal += 1 / itemPrice_(item)
                }
                return result.items
            }
            return { amount: rest, items: items.map(item => ({ ...item, total: itemPrice_(item) })), next }
        }
        
        const sorted = sortTotals_(totalItems)
        const result: { total: number, acc: number, items: T[] } = { total: 0, acc: 0, items: [] }
        for (const item of sorted) {
            const acc_ = ntp(amount * addPrices_(result.total, item.total) / total)
            result.items.push({ ...item, total: minusPrice_(addPrices_(item.total, result.acc), acc_) })
            result.acc = acc_
            result.total = addPrices_(result.total, item.total)
        }
        const items_ = result.items.map(item => ({ ...item, total: itemDiscount_(item) }))
        return { amount: 0, items: items_, next: () => items_ }
    }

const splitItem_ = (ntp: NumberToPrice) => {
    const minusPrice_ = minusPrice(ntp)
    const sortTotals_ = <T extends TotalRO>(items: R<T>) => [...items]
        .sort(({ total: a }, { total: b }) => minusPrice_(a, b))
    return <T extends QtyRO & TotalRO, U extends QtyRO & TotalRO>(item: U) =>
        (from: R<R<T>>, selected: R<T> = [], skipped: R<T> = []): { item: U, selected: T[], skipped: T[] } => {
            const splitted: [T[], T[]] = [[], []]
            for (const items of from) {
                for (const item_ of items) {
                    splitted[item_.total <= item.total ? 0 : 1].push(item_)
                }
            }

            const skipped_ = [...skipped]
            if (splitted[1].length !== 0) {
                const [head, ...tail] = sortTotals_(splitted[1])
                splitted[0].push(head)
                skipped_.push(...tail)
            }

            if (splitted[0].length === 0) {
                const selectedPrices = selected
                    .slice(Math.min(item.qty, selected.length))
                    .map(({ total }) => total)
                const skippedPrices = skipped
                    .slice(0, Math.max(0, item.qty - selected.length))
                    .map(({ total }) => total)
                const addPrices_ = addPrices(ntp)
                return {
                    item: { ...item, total: minusPrice_(addPrices_(item.total, ...selectedPrices), addPrices_(...skippedPrices)) },
                    selected: [
                        ...selected.slice(0, Math.min(item.qty, selected.length)),
                        ...skipped.slice(0, Math.max(0, item.qty - selected.length))],
                    skipped: [
                        ...selected.slice(Math.min(item.qty, selected.length)),
                        ...skipped.slice(Math.max(0, item.qty - selected.length))] }
            }

            const [head, ...tail] = sortTotals_(splitted[0])
            const include = splitItem_(ntp)<T, U>({ ...item, total: minusPrice_(item.total, head.total) })([tail], [...selected, head], skipped_)
            if (include.item.total === 0) return include

            const exclude = splitItem_(ntp)<T, U>(item)([tail], selected, [...skipped_, head])
            return Math.abs(include.item.total) > Math.abs(exclude.item.total) ? exclude : include
        }
}

export const minusItem = (ntp: NumberToPrice) => {
    return <T extends QtyRO & TotalRO & PriceRO, U extends QtyRO & TotalRO>(item: U) =>
        (from: R<T>) => {
            if (from.length === 1) {
                const qty = from[0].qty - item.qty
                return qty > 0
                    ? [{...from[0], qty, total: minusPrice(ntp)(from[0].total, item.total)}]
                    : []
            }

            const splitted = from.map(item => divideTotal(ntp)(item))
            const { skipped, item: item_ } = splitItem_(ntp)(item)(splitted)
            const items: T[] = []
            for (const items_ of splitted) {
                let total = 0
                let qty = 0
                for (const item_ of items_) {
                    if (skipped.indexOf(item_) !== -1) {
                        total = addPrices(ntp)(total, item_.total)
                        qty += 1
                    }
                }
                items.push({ ...items_[0], total, qty })
            }
            return spreadAdjustment(ntp)(-item_.total, items.filter(({ qty }) => qty > 0))
                .next()
                .filter(({ qty }) => qty > 0)
        }
}