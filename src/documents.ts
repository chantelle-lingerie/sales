import { addPrices, itemsGroupReduce, minusItem } from './basics'
import { documents as d } from './injectable/documents'

export const documents = {
    total: d.total(addPrices),
    shipping: d.shipping(addPrices),
    items: {
        total: d.items.total({ ap: addPrices, igr: itemsGroupReduce }),
        qty: d.items.qty(itemsGroupReduce),
        minus: d.items.minus({ ap: addPrices, igr: itemsGroupReduce, mi: minusItem }) } }