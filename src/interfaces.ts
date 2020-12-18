export type Item = { id: string }
export type Price = { price: number }
export type Qty = { qty: number }
export type Shipping = { shipping: number }

export type Total = { total: number }

export type Items<T extends Item> = { items: T[] }

export type Order<T extends Total | Shipping | Items<Item>> = T & {
    invoiced: T[],
    refunded: T[],
    canceled: T[],
}

export type ItemQty = Item & Qty
export type ItemTotal = Item & Total
export type CartItem = ItemQty & Price & Partial<Total>
export type Cart<T extends CartItem> = Items<T> & Shipping
export type CartTotals<T extends CartItem & Total> = Cart<T> & Total
