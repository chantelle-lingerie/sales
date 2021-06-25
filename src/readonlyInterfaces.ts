export type ItemRO = { readonly id: string }
export type PriceRO = { readonly price: number }
export type QtyRO = { readonly qty: number }
export type ShippingRO = { readonly shipping: number }

export type TotalRO = { readonly total: number }

export type ItemsRO<T extends ItemRO> = { items: readonly T[] }

export type OrderRO<T extends TotalRO | ShippingRO | ItemsRO<ItemRO>> = T & {
    invoiced: readonly T[],
    refunded: readonly T[],
    canceled: readonly T[],
}

export type ItemQtyRO = ItemRO & QtyRO
export type ItemTotalRO = ItemRO & TotalRO
export type CartItemRO = ItemQtyRO & PriceRO & Partial<TotalRO>
export type CartRO<T extends CartItemRO> = ItemsRO<T> & ShippingRO
export type CartTotalsRO<T extends CartItemRO & TotalRO> = CartRO<T> & TotalRO
