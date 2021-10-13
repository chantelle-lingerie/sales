import { ItemRO } from './readonlyInterfaces'
import * as i from './injectable/basics'

const numberToPriceUpDown_ = {
    up: (price: number) => Number.parseFloat(price.toFixed(2)),
    down: (price: number) => Number.parseFloat((Math.ceil(price * 100 - .5) / 100).toFixed(2)) }

const numberToPrice_ = numberToPriceUpDown_.up

export const itemsReduce = <U>(id: string, init: U) =>
    <T extends ItemRO>(items: readonly T[], reducer: (acc: U, item: T) => U) => items
        .reduce((acc, item) => item.id === id ? reducer(acc, item) : acc, init)

export const addPrices = i.addPrices(numberToPrice_)
export const minusPrice = i.minusPrice(numberToPrice_)
export const itemPrice = i.itemPrice(numberToPrice_)
export const enrichItem = i.enrichItem(numberToPrice_)
export const itemDiscount = i.itemDiscount(numberToPrice_)

export const divideTotal = i.divideTotal(numberToPrice_)

export const itemsGroupReduce = i.itemsGroupReduce(itemsReduce)

export const takeItem = i.takeItem(numberToPriceUpDown_)
export const takeItems = i.takeItems({...numberToPriceUpDown_, reduce: itemsReduce})

export const spreadAdjustment = i.spreadAdjustment(numberToPrice_)

export const minusItem = i.minusItem(numberToPrice_)
