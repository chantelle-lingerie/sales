import { minusPrice } from './basics'
import { documents } from './documents'
import { invariants as i } from './injectable/invariants'

export const invariants = {
    total: i.total({ mp: minusPrice, dt: documents.total }),
    shipping: i.shipping({ mp: minusPrice, ds: documents.shipping }),
    items: {
        qty: i.items.qty(documents.items.qty),
        total: i.items.total(documents.items.total) } }