import { Order, Shipping, Total, Items, ItemQty, ItemTotal } from '../index'
import { invariants } from './freezedInvariants'

describe('Order Invariants', () => {
    const { total, shipping, items } = invariants

    describe('Shipping', () => {
        const shipping_ = (order: Partial<Order<Shipping>>) => shipping({ shipping: 0, invoiced: [], refunded: [], canceled: [], ...order })
        describe('Quantity', () => {
            const _ = (order: Partial<Order<Shipping>>) => shipping_(order).qty
            it('No more than one time', () => {
                expect(_({ invoiced: [{ shipping: 1 }, { shipping: 1 }] }))
                .toBeLessThan(0)
                expect(_({ canceled: [{ shipping: 1 }, { shipping: 1 }, { shipping: 1 }] }))
                .toBeLessThan(0)
                expect(_({ refunded: [{ shipping: 1 }, { shipping: 2 }, { shipping: 0 }] }))
                .toBeLessThan(0)
            })
            it('Combinations', () => {
                // one of them
                expect(_({ canceled: [{ shipping: 1 }, { shipping: 0 }] }))
                .toBeGreaterThanOrEqual(0)
                expect(_({ invoiced: [{ shipping: 1 }, { shipping: 0 }] }))
                .toBeGreaterThanOrEqual(0)
                expect(_({ refunded: [{ shipping: 1 }] }))
                .toBeLessThan(0)
                // two of them
                expect(_({
                    invoiced: [{ shipping: 2 }],
                    canceled: [{ shipping: 1 }] }))
                .toBeLessThan(0)
                expect(_({
                    canceled: [{ shipping: 1 }],
                    refunded: [{ shipping: 2 }] }))
                .toBeLessThan(0)
                expect(_({
                    invoiced: [{ shipping: 2 }, { shipping: 0 }],
                    refunded: [{ shipping: 1 }, { shipping: 0 }] }))
                .toBeGreaterThanOrEqual(0)
                // all of them
                expect(_({
                    invoiced: [{ shipping: 2 }],
                    canceled: [{ shipping: 1 }],
                    refunded: [{ shipping: 1 }] }))
                .toBeLessThan(0)
            })
        })
        describe('Total', () => {
            const _ = (order: Partial<Order<Shipping>>) => shipping_(order).total
            it('Invoiced and canceled versus order', () => {
                expect(_({ shipping: 1,
                    invoiced: [{ shipping: .3 }, { shipping: .4 }],
                    canceled: [{ shipping: .3 }] }).ci)
                .toBeGreaterThanOrEqual(0)
                expect(_({ shipping: 1,
                    invoiced: [{ shipping: .3 }, { shipping: .4 }],
                    canceled: [{ shipping: .5 }] }).ci)
                .toBeLessThan(0)
            })
            it('Invoiced versus refunded', () => {
                expect(_({ shipping: 1,
                    invoiced: [{ shipping: .3 }, { shipping: .4 }],
                    refunded: [{ shipping: .2 }, { shipping: .2 }, { shipping: .3 }] }).ir)
                .toBeGreaterThanOrEqual(0)
                expect(_({ shipping: 1,
                    invoiced: [{ shipping: .3 }, { shipping: .2 }],
                    refunded: [{ shipping: .1 }, { shipping: .2 }, { shipping: .3 }] }).ir)
                .toBeLessThan(0)
            })
        })
    })
    describe('Total', () => {
        const _ = (order: Partial<Order<Total>>) => total({ total: 0, invoiced: [], refunded: [], canceled: [], ...order })
        it('Invoiced and canceled versus order', () => {
            expect(_({ total: 1,
                invoiced: [{ total: .3 }, { total: .4 }],
                canceled: [{ total: .3 }] }).ci)
            .toBeGreaterThanOrEqual(0)
            expect(_({ total: 1,
                invoiced: [{ total: .3 }, { total: .4 }],
                canceled: [{ total: .5 }] }).ci)
            .toBeLessThan(0)
        })
        it('Invoiced versus refunded', () => {
            expect(_({ total: 1,
                invoiced: [{ total: .3 }, { total: .4 }],
                refunded: [{ total: .2 }, { total: .2 }, { total: .3 }] }).ir)
            .toBeGreaterThanOrEqual(0)
            expect(_({ total: 1,
                invoiced: [{ total: .3 }, { total: .2 }],
                refunded: [{ total: .1 }, { total: .2 }, { total: .3 }] }).ir)
            .toBeLessThan(0)
        })
    })
    describe('Items', () => {
        describe('Quantity', () => {
            const _ = (order: Partial<Order<Items<ItemQty>>>) => items.qty({
                items: [
                    { id: 'a', qty: 3 }, { id: 'a', qty: 1 }, { id: 'a', qty: 1 },
                    { id: 'b', qty: 2 },
                    { id: 'c', qty: 4 }, { id: 'c', qty: 3 }, { id: 'c', qty: 2 },
                    { id: 'd', qty: 1 }],
                invoiced: [
                    { items: [{ id: 'a', qty: 2 }, { id: 'b', qty: 2 }]},
                    { items: [{ id: 'c', qty: 5 }, { id: 'a', qty: 1 }, { id: 'c', qty: 2 }]}
                ], refunded: [], canceled: [], ...order })
            it('Invoiced and canceled versus order', () => {
                expect(new Set(_({
                    canceled: [
                        { items: [{ id: 'a', qty: 1 }]},
                        { items: [{ id: 'b', qty: 1 }, { id: 'a', qty: 1 }]}],
                }).ci)).toEqual(new Set([
                    { id: 'a', qty: 0 }, { id: 'b', qty: -1 }, { id: 'c', qty: 2 }, { id: 'd', qty: 1 }]))
            })
            it('Invoiced versus refunded', () => {
                expect(new Set(_({
                    refunded: [
                        { items: [{ id: 'a', qty: 1 }, { id: 'd', qty: 2 }]},
                        { items: [{ id: 'b', qty: 1 }, { id: 'a', qty: 2 }]},
                        { items: [{ id: 'c', qty: 3 }, { id: 'c', qty: 2 }]}],
                }).ir)).toEqual(new Set([
                    { id: 'a', qty: 0 }, { id: 'b', qty: 1 }, { id: 'c', qty: 2 }, { id: 'd', qty: -2 }]))
            })
        })
        describe('Total', () => {
            const _ = (order: Partial<Order<Items<ItemTotal>>>) => items.total({
                items: [
                    { id: 'a', total: .3 }, { id: 'a', total: .1 }, { id: 'a', total: .1 },
                    { id: 'b', total: .2 },
                    { id: 'c', total: .4 }, { id: 'c', total: .3 }, { id: 'c', total: .2 },
                    { id: 'd', total: .1 }],
                invoiced: [
                    { items: [{ id: 'a', total: .2 }, { id: 'b', total: .2 }]},
                    { items: [{ id: 'c', total: .5 }, { id: 'a', total: .1 }, { id: 'c', total: .2 }]}
                ], refunded: [], canceled: [], ...order })
            it('Invoiced and canceled versus order', () => {
                expect(new Set(_({
                    canceled: [
                        { items: [{ id: 'a', total: .1 }]},
                        { items: [{ id: 'b', total: .1 }, { id: 'a', total: .1 }]}],
                }).ci)).toEqual(new Set([
                    { id: 'a', total: 0 }, { id: 'b', total: -.1 }, { id: 'c', total: .2 }, { id: 'd', total: .1 }]))
            })
            it('Invoiced versus refunded', () => {
                expect(new Set(_({
                    refunded: [
                        { items: [{ id: 'a', total: .1 }, { id: 'd', total: .2 }]},
                        { items: [{ id: 'b', total: .1 }, { id: 'a', total: .2 }]},
                        { items: [{ id: 'c', total: .3 }, { id: 'c', total: .2 }]}],
                }).ir)).toEqual(new Set([
                    { id: 'a', total: 0 }, { id: 'b', total: .1 }, { id: 'c', total: .2 }, { id: 'd', total: -.2 }]))
            })
        })
    })
})
