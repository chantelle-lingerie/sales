import { addPrices, enrichItem, minusPrice } from './basics'
import { documents } from './documents'
import { order } from './order'
import { cart as c, orderCart as oc } from './injectable/cart'

const iCartOrder = { ap: addPrices,
    ost: order.sales.total,
    mp: minusPrice,
    oss: order.sales.shipping,
    dt: documents.total,
    osi: order.sales.items }

export const cart = {
    basic: c.basic({ ap: addPrices, dt: documents.total, ei: enrichItem }),
    order: c.order(iCartOrder) }

export const orderCart = oc({ ...iCartOrder, ot: order.total })