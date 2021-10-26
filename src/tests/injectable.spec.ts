import { injectable, Order, Shipping } from '../index'
import { order } from './order'
import { deepFreeze } from './deepFreeze'

describe('Basic order functionality', () => {
    const numberToPrice = (price: number) => Number.parseFloat(price.toFixed(3))
    const minusPrice = injectable.minusPrice(numberToPrice)
    const addPrices = injectable.addPrices(numberToPrice)
    const documentsShipping = injectable.documents.shipping(addPrices)
    const invariantsShipping = injectable.invariants.shipping({ ds: documentsShipping, mp: minusPrice })
    const shipping = injectable.order.shipping(invariantsShipping)
    const _ = <U extends Shipping, T extends Order<U>>(order: T) => ({
            invoice: (invoice: U) => shipping(deepFreeze(order)).invoice(deepFreeze(invoice)),
            cancel: (cancelation: U) => shipping(deepFreeze(order)).cancel(deepFreeze(cancelation)),
            refund: (refund: U) => shipping(deepFreeze(order)).refund(deepFreeze(refund)) })

    const updateDocuments = (documents: {shipping: number}[]) => documents
        .map(({ shipping, ...rest }) => ({ ...rest, shipping: numberToPrice(shipping / 10) }))
    const sutOrder = { ...order,
        shipping: numberToPrice(order.shipping / 10),
        invoiced: updateDocuments(order.invoiced),
        canceled: updateDocuments(order.canceled),
        refunded: updateDocuments(order.refunded) }
    it('Check order shipping calculations (with 3 digits', () => {
        const shipping = _(sutOrder)
        expect(shipping.invoice({ shipping: .001 })).toEqual({ qty: -1, total: -.001 })
        expect(shipping.invoice({ shipping: 0 })).toEqual({ qty: 0, total: 0 })
        expect(shipping.refund({ shipping: .058 })).toEqual({ qty: -1, total: .001 })
        expect(shipping.refund({ shipping: .06 })).toEqual({ qty: -1, total: -.001 })
        expect(shipping.cancel({ shipping: .001 })).toEqual({ qty: -1, total: -.001 })
        expect(shipping.cancel({ shipping: 0 })).toEqual({ qty: 0, total: 0 })
    })
})