import { documents as _, minusPrice, addPrices } from '../index'

describe('Documents', () => {
    it('Reduce totals', () => {
        expect(_.total([{ total: .1 }, { total: .2 }]))
        .toBe(.3)
    })
    it('Reduce shipping', () => {
        expect(_.shipping([{ shipping: .1 }, { shipping: .2 }, { shipping: .4 }]))
        .toBe(.7)
    })
    describe('Items', () => {
        it('Reduce quantity', () => {
            expect(new Set(_.items.qty([
                { items: [{ id: 'a', qty: 1 }, { id: 'b', qty: 2 }] },
                { items: [{ id: 'c', qty: 3 }, { id: 'b', qty: 1 }] },
            ]))).toEqual(new Set([
                { id: 'a', qty: 1 }, { id: 'b', qty: 3 }, { id: 'c', qty: 3 }]))
        })
        it('Reduce totals', () => {
            expect(new Set(_.items.total([
                { items: [{ id: 'a', total: .1 }, { id: 'b', total: .2 }] },
                { items: [{ id: 'c', total: .3 }, { id: 'b', total: .1 }] },
            ]))).toEqual(new Set([
                { id: 'a', total: .1 }, { id: 'b', total: .3 }, { id: 'c', total: .3 }]))
        })

        describe('Minus', () => {
            const arrayChunks = (size: number) =>
                <T>(xs: T[]) => Array.from(Array(Math.ceil(xs.length / size)).keys())
                    .reduce((chunks, c) => [
                        ...chunks,
                        xs.slice(c * size, (c + 1) * size)
                    ], [] as T[][])
            const from = (ids: string[] = ['a', 'b', 'c', 'd', 'e']) => arrayChunks(3)([
                { qty: 3, total: 7, price: 3 },
                { qty: 1, total: 5, price: 5 },
                { qty: 1, total: .6, price: 2 },
                { qty: 2, total: 8.07, price: 4.33 }]
                    .reduce((acc, item) => [...acc, ...ids.map(id => ({ ...item, id }))], [] as { id: string, qty: number, total: number, price: number }[]))
                .map(chunk => ({ items: chunk }))
            it('Exact match', () => {
                expect(new Set(_.items.minus(from(), [
                    { items: [{ id: 'a', qty: 3, total: 7 },
                              { id: 'b', qty: 1, total: .6 }] },
                    { items: [{ id: 'c', qty: 1, total: 4.04 }]},
                    { items: [{ id: 'd', qty: 2, total: 4.67 },
                              { id: 'e', qty: 2, total: 6.36 }] }
                ]))).toEqual(new Set([
                    { id: 'a', qty: 1, total: 5, price: 5 },
                    { id: 'a', qty: 1, total: .6, price: 2 },
                    { id: 'a', qty: 2, total: 8.07, price: 4.33 },
                    { id: 'b', qty: 3, total: 7, price: 3 },
                    { id: 'b', qty: 1, total: 5, price: 5 },
                    { id: 'b', qty: 2, total: 8.07, price: 4.33 },
                    { id: 'c', qty: 3, total: 7, price: 3 },
                    { id: 'c', qty: 1, total: 5, price: 5 },
                    { id: 'c', qty: 1, total: .6, price: 2 },
                    { id: 'c', qty: 1, total: 4.03, price: 4.33 },
                    { id: 'd', qty: 1, total: 2.33, price: 3 },
                    { id: 'd', qty: 1, total: 5, price: 5 },
                    { id: 'd', qty: 1, total: .6, price: 2 },
                    { id: 'd', qty: 2, total: 8.07, price: 4.33 },
                    { id: 'e', qty: 2, total: 4.67, price: 3 },
                    { id: 'e', qty: 1, total: 5, price: 5 },
                    { id: 'e', qty: 1, total: .6, price: 2 },
                    { id: 'e', qty: 1, total: 4.04, price: 4.33 }]))
            })
            it('Less expensive than exact match', () => {
                expect(new Set(_.items.minus(from(), [
                    { items: [{ id: 'a', qty: 3, total: 13.05 },
                              { id: 'b', qty: 1, total: .49 }] },
                    { items: [{ id: 'c', qty: 1, total: 3.99 }]},
                    { items: [{ id: 'd', qty: 3, total: 5.23 },
                              { id: 'e', qty: 2, total: 6.11 }] }
                ]))).toEqual(new Set([
                    { id: 'a', qty: 3, total: addPrices(7, .01), price: 3 },
                    { id: 'a', qty: 1, total: addPrices(.6, .01), price: 2 },
                    { id: 'b', qty: 3, total: addPrices(7, .08), price: 3 },
                    { id: 'b', qty: 1, total: 5, price: 5 },
                    { id: 'b', qty: 2, total: addPrices(8.07, .03), price: 4.33 },
                    { id: 'c', qty: 3, total: addPrices(7, .02), price: 3 },
                    { id: 'c', qty: 1, total: 5, price: 5 },
                    { id: 'c', qty: 1, total: addPrices(.6, .02), price: 2 },
                    { id: 'c', qty: 1, total: 4.04, price: 4.33 },
                    { id: 'd', qty: 1, total: addPrices(2.34, .02), price: 3 },
                    { id: 'd', qty: 1, total: 5, price: 5 },
                    { id: 'd', qty: 2, total: addPrices(8.07, .01), price: 4.33 },
                    { id: 'e', qty: 2, total: addPrices(4.67, .11), price: 3 },
                    { id: 'e', qty: 1, total: 5, price: 5 },
                    { id: 'e', qty: 1, total: addPrices(.6, .12), price: 2 },
                    { id: 'e', qty: 1, total: addPrices(4.04, .02), price: 4.33 }
                ]))
            })
            it('More expensive than exact match', () => {
                expect(new Set(_.items.minus(from(), [
                    { items: [{ id: 'a', qty: 3, total: 7.02 },
                              { id: 'b', qty: 1, total: .9 }] },
                    { items: [{ id: 'c', qty: 1, total: 4.14 }]},
                    { items: [{ id: 'd', qty: 2, total: 4.88 },
                              { id: 'e', qty: 2, total: 6.5 }] }
                ]))).toEqual(new Set([
                    { id: 'a', qty: 1, total: minusPrice(5, .01), price: 5 },
                    { id: 'a', qty: 1, total: .6, price: 2 },
                    { id: 'a', qty: 2, total: minusPrice(8.07, .01), price: 4.33 },
                    { id: 'b', qty: 3, total: minusPrice(7, .11), price: 3 },
                    { id: 'b', qty: 1, total: minusPrice(5, .07), price: 5 },
                    { id: 'b', qty: 2, total: minusPrice(8.07, .12), price: 4.33 },
                    { id: 'c', qty: 3, total: minusPrice(7, .04), price: 3 },
                    { id: 'c', qty: 1, total: minusPrice(5, .03), price: 5 },
                    { id: 'c', qty: 1, total: .6, price: 2 },
                    { id: 'c', qty: 1, total: minusPrice(4.03, .03), price: 4.33 },
                    { id: 'd', qty: 1, total: minusPrice(2.33, .03), price: 3 },
                    { id: 'd', qty: 1, total: minusPrice(5, .06), price: 5 },
                    { id: 'd', qty: 1, total: minusPrice(.6, .01), price: 2 },
                    { id: 'd', qty: 2, total: minusPrice(8.07, .11), price: 4.33 },
                    { id: 'e', qty: 2, total: minusPrice(4.66, .04), price: 3 },
                    { id: 'e', qty: 1, total: minusPrice(5, .04), price: 5 },
                    { id: 'e', qty: 1, total: minusPrice(.6, .01), price: 2 },
                    { id: 'e', qty: 1, total: minusPrice(4.03, .03), price: 4.33 }]))
            })
            it('Handles extreme cases', () => {
                expect(new Set(_.items.minus([
                    ...from(['a', 'b', 'c', 'd']), { items: [
                        { id: 'e', price: 10, qty: 2, total: 18 },
                        { id: 'e', price: 10, qty: 1, total: 10 }] }
                ], [
                    { items: [{ id: 'a', qty: 2, total: 0 },
                              { id: 'b', qty: 2, total: 11 }] },
                    { items: [{ id: 'c', qty: 0, total: 7 }]},
                    { items: [{ id: 'd', qty: 8, total: .01 },
                              { id: 'e', qty: 2, total: 14.5 }] }
                ]))).toEqual(new Set([
                    { id: 'a', qty: 2, total: addPrices(6, .35), price: 3 },
                    { id: 'a', qty: 1, total: addPrices(5, .42), price: 5 },
                    { id: 'a', qty: 2, total: addPrices(8.66, .24), price: 4.33 },
                    { id: 'b', qty: 3, total: minusPrice(7, 1.18), price: 3 },
                    { id: 'b', qty: 1, total: minusPrice(.6, .1), price: 2 },
                    { id: 'b', qty: 1, total: minusPrice(4.03, .68), price: 4.33 },
                    { id: 'c', qty: 3, total: minusPrice(7, 2.37), price: 3 },
                    { id: 'c', qty: 1, total: minusPrice(5, 1.7), price: 5 },
                    { id: 'c', qty: 1, total: minusPrice(.6, .2), price: 2 },
                    { id: 'c', qty: 2, total: minusPrice(8.07, 2.73), price: 4.33 },
                    { id: 'e', qty: 1, price: 10, total: 13.5 }]))
            })
        })
    })
})
