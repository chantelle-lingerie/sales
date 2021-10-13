import { takeItems, addPrices, minusPrice } from './basics'
import { invariants } from './invariants'
import { documents } from './documents'
import { order as o } from './injectable/order'

const sales_ = {
    shipping: o.sales.shipping({ mp: minusPrice, ap: addPrices }),
    total: o.sales.total({ mp: minusPrice, ap: addPrices }),
    items: o.sales.items(documents.items.minus) }

export const order = {
    shipping: o.shipping(invariants.shipping),
    itemsQty: o.itemsQty(invariants.items.qty),
    sales: sales_,
    total: o.total({
        mp: minusPrice,
        ap: addPrices,
        ti: takeItems,
        dim: documents.items.minus,
        iiq: invariants.items.qty,
        it: invariants.total,
        dt: documents.total,
        dit: documents.items.total }) }
