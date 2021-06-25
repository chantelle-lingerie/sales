import { invariants as i_, Order, Shipping, Total, Items, ItemQty, ItemTotal } from '../index'
import { deepFreeze } from './deepFreeze'

export const invariants = {
    total: <T extends Order<Total>>(order: T) => i_.total(deepFreeze(order)),
    shipping: <T extends Order<Shipping>>(order: T) => i_.shipping(deepFreeze(order)),
    items: {
        qty: <V extends ItemQty, U extends Items<V>, T extends Order<U>>(order: T) => i_.items.qty(deepFreeze(order)),
        total: <V extends ItemTotal, U extends Items<V>, T extends Order<U>>(order: T) => i_.items.total(deepFreeze(order)) } }