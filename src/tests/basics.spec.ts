import { Qty, Total, Price, spreadAdjustment, takeItems, itemsGroupReduce, enrichItem, addPrices, minusPrice, divideTotal, takeItem, minusItem, itemsReduce } from '../index'

describe('Basic functions', () => {
    describe('Prices', () => {
        it('Add', () => {
            expect(addPrices(.1, .2)).toBe(.3)
            expect(addPrices(1, 2, .003)).toBe(3)
        })
        it('Minus', () => {
            expect(minusPrice(.51, .04)).toBe(.47)
            expect(addPrices(.51, .004)).toBe(.51)
        })
        it('Divide Total', () => {
            expect(divideTotal({ total: .66, qty: 2, extra: 'v' }))
                .toEqual([
                    { total: .33, qty: 1, extra: 'v' },
                    { total: .33, qty: 1, extra: 'v' }])
            expect(divideTotal({ total: 7, qty: 3 }))
                .toEqual([
                    { total: 2.33, qty: 1 },
                    { total: 2.34, qty: 1 },
                    { total: 2.33, qty: 1 }])
        })
    })
    it('Enrich Item', () => {
        expect(enrichItem({ qty: 2, price: 3.01 }))
            .toEqual({ qty: 2, price: 3.01, total: 6.02 })
        expect(enrichItem({ qty: 2, price: 3.01, total: 5 }))
            .toEqual({ qty: 2, price: 3.01, total: 5 })
    })
    it('Items Reduce', () => {
        expect(itemsReduce('love', 'love')([
            { id: 'war' }, { id: 'war' }, { id: 'war' }, { id: 'love'},
                { id: 'war' }, { id: 'love' },
                { id: 'war' }, { id: 'war' }],
            (acc, { id }) => `${acc} ${id}`
        )).toBe('love love love')
    })
    it('Items Group Reduce', () => {
        expect(new Set(itemsGroupReduce<
            {id: string, extra: string, count: number},
            {id: string, extra: string}>(item => ({ ...item, count: 0 })
        )([
            { id: 'baz', extra: 'ay' }, { id: 'foo', extra: 'py' }, { id: 'bar', extra: 'ty' },
                                        { id: 'foo', extra: 'xt' },
            { id: 'baz', extra: 'xb' }, { id: 'foo', extra: 'ey' },
            { id: 'baz', extra: 'ey' },                             { id: 'bar', extra: 'wy' },
            { id: 'baz', extra: 'xu' },
                                        { id: 'foo', extra: 'xa' },
            { id: 'baz', extra: 'xz' }],
        (acc, item) => ({ ...acc, ...item, count: acc.count + 1 })))).toEqual(new Set([
            { id: 'baz', extra: 'xz', count: 5 },
            { id: 'foo', extra: 'xa', count: 4 },
            { id: 'bar', extra: 'wy', count: 2 }]))
    })
    describe('Set of items', () => {
            describe('Take item from set', () => {
                const from = [
                    { qty: 3, total: 7 },
                    { qty: 1, total: 5 },
                    { qty: 1, total: .6 },
                    { qty: 2, total: 8.07 }]
                const take = (cheapest: boolean) => (qty: number) => new Set(takeItem(cheapest)(from, { qty }))
                it('Cheapest', () => {
                    const take_ = take(true)
                    expect(take_(1)).toEqual(new Set([{ qty: 1, total: .6 }]))
                    expect(take_(2)).toEqual(new Set([
                        { qty: 1, total: .6 },
                        { qty: 1, total: 2.33 }]))
                    expect(take_(3)).toEqual(new Set([
                        { qty: 1, total: .6 },
                        { qty: 2, total: 4.67 }]))
                    expect(take_(4)).toEqual(new Set([
                        { qty: 1, total: .6 },
                        { qty: 3, total: 7 }]))
                })
                it('Most expensive', () => {
                    const take_ = take(false)
                    expect(take_(1)).toEqual(new Set([{ qty: 1, total: 5 }]))
                    expect(take_(2)).toEqual(new Set([
                        { qty: 1, total: 5 },
                        { qty: 1, total: 4.04 }]))
                    expect(take_(3)).toEqual(new Set([
                        { qty: 1, total: 5 },
                        { qty: 2, total: 8.07 }]))
                    expect(take_(4)).toEqual(new Set([
                        { qty: 1, total: 5 },
                        { qty: 2, total: 8.07 },
                        { qty: 1, total: 2.33 }]))
                })
            })
            describe('Take items from set', () => {
                const from = [
                    { id: 'a', qty: 3, total: 7 },
                    { id: 'b', qty: 1, total: 5 },
                    { id: 'b', qty: 2, total: .61 },
                    { id: 'a', qty: 2, total: 8.07 }]
                it('Cheapest', () => {
                    expect(new Set(takeItems(true)(from, [
                        { id: 'a', qty: 1}, { id: 'a', qty: 2},
                        { id: 'a', qty: 1}, { id: 'b', qty: 1 }])))
                        .toEqual(new Set([
                            { id: 'a', qty: 3, total: 7 },
                            { id: 'a', qty: 1, total: 4.03 },
                            { id: 'b', qty: 1, total: .3 }]))
                    expect(new Set(takeItems(true)(from, [
                        { id: 'b', qty: 1}, { id: 'b', qty: 2},
                        { id: 'a', qty: 1}, { id: 'a', qty: 1 }])))
                        .toEqual(new Set([
                            { id: 'a', qty: 2, total: 4.67 },
                            { id: 'b', qty: 1, total: 5 },
                            { id: 'b', qty: 2, total: .61 }]))
                })
                it('Most expensive', () => {
                    expect(new Set(takeItems(false)(from, [
                        { id: 'a', qty: 1}, { id: 'a', qty: 2},
                        { id: 'a', qty: 1}, { id: 'b', qty: 1 }])))
                        .toEqual(new Set([
                            { id: 'a', qty: 2, total: 8.07 },
                            { id: 'a', qty: 2, total: 4.67 },
                            { id: 'b', qty: 1, total: 5 }]))
                    expect(new Set(takeItems(false)(from, [
                        { id: 'b', qty: 1}, { id: 'b', qty: 2},
                        { id: 'a', qty: 1}, { id: 'a', qty: 1 }])))
                        .toEqual(new Set([
                            { id: 'a', qty: 2, total: 8.07 },
                            { id: 'b', qty: 1, total: 5 },
                            { id: 'b', qty: 2, total: .61 }]))
                })
            })
            describe('Spread adjustment', () => {
                const items = [
                    { id: 'a', qty: 2, price: 5, total: 9 },
                    { id: 'b', qty: 3, price: 7, total: 19 }]
                const check = <T extends Qty & Total & Price>(amount_: number, from: T[]) =>
                    (amount: number, items: T[], items_?: T[]) => {
                        const result = spreadAdjustment(amount_, from)
                        expect({ amount: result.amount, items: new Set(result.items) })
                            .toEqual({ amount, items: new Set(items) })
                        expect(new Set(result.next())).toEqual(new Set(items_ ? items_ : items)) }
                test('Empty', () => {
                    check(0, items)(0, items)
                    check(10, [])(10, [])
                })
                const maximumResults = {
                    positive: [
                        { id: 'a', qty: 2, price: 5, total: 10 },
                        { id: 'b', qty: 3, price: 7, total: 21 }],
                    negative: [
                        { id: 'a', qty: 2, price: 5, total: 0 },
                        { id: 'b', qty: 3, price: 7, total: 0 }]}
                test('Equals maximum', () => {
                    check(3, items)(0, maximumResults.positive)
                    check(-28, items)(0, maximumResults.negative)
                })
                test('Less than maximum', () => {
                    check(2, items)(0, [
                        { id: 'a', qty: 2, price: 5, total: 9.67 },
                        { id: 'b', qty: 3, price: 7, total: 20.33 }])
                    check(-27, items)(0, [
                        { id: 'a', qty: 2, price: 5, total: .32 },
                        { id: 'b', qty: 3, price: 7, total: .68 }])
                })
                test('More than maximum', () => {
                    check(4, items)(1, maximumResults.positive, [
                        { id: 'a', qty: 2, price: 5, total: 10.68 },
                        { id: 'b', qty: 3, price: 7, total: 21.32 }])
                    check(-29, items)(-1, maximumResults.negative, [
                        { id: 'a', qty: 2, price: 5, total: -.4 },
                        { id: 'b', qty: 3, price: 7, total: -.6 }])
                })
            })
            describe('Minus item from set', () => {
                const from = [
                    { qty: 3, total: 7, price: 3 },
                    { qty: 1, total: 5, price: 5 },
                    { qty: 1, total: .6, price: 2 },
                    { qty: 2, total: 8.07, price: 4.33 }]
                const minus = (qty: number, total: number) => new Set(minusItem({ qty, total })(from))
                it('Exact match', () => {
                    expect(minus(3, 7)).toEqual(new Set([
                        { qty: 1, total: 5, price: 5 },
                        { qty: 1, total: .6, price: 2 },
                        { qty: 2, total: 8.07, price: 4.33 }]))
                    expect(minus(1, .6)).toEqual(new Set([
                        { qty: 3, total: 7, price: 3 },
                        { qty: 1, total: 5, price: 5 },
                        { qty: 2, total: 8.07, price: 4.33 }]))
                    expect(minus(1, 4.04)).toEqual(new Set([
                        { qty: 3, total: 7, price: 3 },
                        { qty: 1, total: 5, price: 5 },
                        { qty: 1, total: .6, price: 2 },
                        { qty: 1, total: 4.03, price: 4.33 }]))
                    expect(minus(2, 4.67)).toEqual(new Set([
                        { qty: 1, total: 2.33, price: 3 },
                        { qty: 1, total: 5, price: 5 },
                        { qty: 1, total: .6, price: 2 },
                        { qty: 2, total: 8.07, price: 4.33 }]))
                    expect(minus(2, 6.36)).toEqual(new Set([
                        { qty: 2, total: 4.67, price: 3 },
                        { qty: 1, total: 5, price: 5 },
                        { qty: 1, total: .6, price: 2 },
                        { qty: 1, total: 4.04, price: 4.33 }]))
                })
                it('Less expensive than exact match', () => {
                    expect(minus(3, 13.05)).toEqual(new Set([
                        { qty: 3, total: addPrices(7, .01), price: 3 },
                        { qty: 1, total: addPrices(.6, .01), price: 2 }]))
                    expect(minus(1, .49)).toEqual(new Set([
                        { qty: 3, total: addPrices(7, .08), price: 3 },
                        { qty: 1, total: 5, price: 5 },
                        { qty: 2, total: addPrices(8.07, .03), price: 4.33 }]))
                    expect(minus(1, 3.99)).toEqual(new Set([
                        { qty: 3, total: addPrices(7, .02), price: 3 },
                        { qty: 1, total: 5, price: 5 },
                        { qty: 1, total: addPrices(.6, .02), price: 2 },
                        { qty: 1, total: 4.04, price: 4.33 }]))
                    expect(minus(3, 5.23)).toEqual(new Set([
                        { qty: 1, total: addPrices(2.34, .02), price: 3 },
                        { qty: 1, total: 5, price: 5 },
                        { qty: 2, total: addPrices(8.07, .01), price: 4.33 }]))
                    expect(minus(2, 6.11)).toEqual(new Set([
                        { qty: 2, total: addPrices(4.67, .11), price: 3 },
                        { qty: 1, total: 5, price: 5 },
                        { qty: 1, total: addPrices(.6, .12), price: 2 },
                        { qty: 1, total: addPrices(4.04, .02), price: 4.33 }]))
                })
                it('More expensive than exact match', () => {
                    expect(minus(3, 7.02)).toEqual(new Set([
                        { qty: 1, total: minusPrice(5, .01), price: 5 },
                        { qty: 1, total: .6, price: 2 },
                        { qty: 2, total: minusPrice(8.07, .01), price: 4.33 }]))
                    expect(minus(1, .9)).toEqual(new Set([
                        { qty: 3, total: minusPrice(7, .11), price: 3 },
                        { qty: 1, total: minusPrice(5, .07), price: 5 },
                        { qty: 2, total: minusPrice(8.07, .12), price: 4.33 }]))
                    expect(minus(1, 4.14)).toEqual(new Set([
                        { qty: 3, total: minusPrice(7, .04), price: 3 },
                        { qty: 1, total: minusPrice(5, .03), price: 5 },
                        { qty: 1, total: .6, price: 2 },
                        { qty: 1, total: minusPrice(4.03, .03), price: 4.33 }]))
                    expect(minus(2, 4.88)).toEqual(new Set([
                        { qty: 1, total: minusPrice(2.33, .03), price: 3 },
                        { qty: 1, total: minusPrice(5, .06), price: 5 },
                        { qty: 1, total: minusPrice(.6, .01), price: 2 },
                        { qty: 2, total: minusPrice(8.07, .11), price: 4.33 }]))
                    expect(minus(2, 6.5)).toEqual(new Set([
                        { qty: 2, total: minusPrice(4.66, .04), price: 3 },
                        { qty: 1, total: minusPrice(5, .04), price: 5 },
                        { qty: 1, total: minusPrice(.6, .01), price: 2 },
                        { qty: 1, total: minusPrice(4.03, .03), price: 4.33 }]))
                })
                it('Handles extreme cases', () => {
                    expect(minus(2, 0)).toEqual(new Set([
                        { qty: 2, total: addPrices(6, .35), price: 3 },
                        { qty: 1, total: addPrices(5, .42), price: 5 },
                        { qty: 2, total: addPrices(8.66, .24), price: 4.33 }]))
                    expect(minus(2, 11)).toEqual(new Set([
                        { qty: 3, total: minusPrice(7, 1.18), price: 3 },
                        { qty: 1, total: minusPrice(.6, .1), price: 2 },
                        { qty: 1, total: minusPrice(4.03, .68), price: 4.33 }]))
                    expect(minus(0, 7)).toEqual(new Set([
                        { qty: 3, total: minusPrice(7, 2.37), price: 3 },
                        { qty: 1, total: minusPrice(5, 1.7), price: 5 },
                        { qty: 1, total: minusPrice(.6, .2), price: 2 },
                        { qty: 2, total: minusPrice(8.07, 2.73), price: 4.33 }]))
                    expect(minus(8, .01)).toEqual(new Set([]))
                    expect(minusItem({ qty: 2, total: 14.5 })([
                        { qty: 2, price: 10, total: 18 },
                        { qty: 1, price: 10, total: 10 }]))
                        .toEqual([{ qty: 1, price: 10, total: 13.5 }])
                    expect(minusItem({ qty: 1000, total: 1000 })([{qty: 1001, total: 1001, price: 2}]))
                        .toEqual([{qty: 1, total: 1, price: 2}])
                    expect(minusItem({ qty: 1000, total: 1000 })([
                        {qty: 500, total: 500, price: 2},
                        {qty: 501, total: 501, price: 2},
                    ])).toEqual([{qty: 1, total: 1, price: 2}])
                })
            })
        })
})