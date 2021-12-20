# :dollar: Discount on subtotal
Covered by unit-tests in [src/tests/sales/subtotal.spec.ts](../../src/tests/sales/subtotal.spec.ts)

### Promotion
Starting from **20€** subtotal give the **2€** cart discount.

### The order
- **Items:**
  - Item A:
    - price: 9€
    - quantity: 1
    - row total: 9€
  - Item B:
    - price: 9€
    - quantity: 2
    - row total: 18€
- **Subtotal:** 27€ = 9€ + 18€
- **Discount:** 2€ (promotion applied on subtotal amount)
- **Shipping:** 2.71€
- **Total:** 27€ = 27€ + 2.71€ - 2€

### ![#d70308](https://via.placeholder.com/15/d70308/000000?text=+) <span style="color:red">Bad calculation</span>
- **Cancel one item B:** cancellation amount is <span style="color:red">**9€**</span>
- **Invoice one item B and item A:**
  - Not possible to invoice **20.71€** (9€ + 9€ + 2.71€) after the previous cancellation
  - The invoice max amount is <span style="color:red">**18.71€**</span> (27.71€ - 9€) after the previous cancellation
- **Refund invoiced item A:** refunded amount is <span style="color:red">**9€**</span>

**Result:** User gets one item with the <span style="color:red">**discounted**</span> price

**Balance:** <span style="color:red">**9.71€**</span> = 27.71€ - 9€ - 9€ = 9€ + 2.71€ - 2€ (discount)

### ![#fba321](https://via.placeholder.com/15/fba321/000000?text=+) <span style="color:orange">**Spreading discount calculation**</span>
One third of the cart discount (2€ / 3) connected to each item.
As a result each item considered as discounted: 9€ - 2/3€ ~ **8.33€** (but one item should be 8.34€)
- **Cancel one item B:** cancellation amount is <span style="color:orange">**8.33€**</span>
- **Invoice one item B and item A:**
  - Not possible to invoice **20.71€** (9€ + 9€ + 2.71€) after the previous cancellation
  - The invoice max amount is <span style="color:orange">**19.38€**</span>
    (27.71€ - 8.33€ = 8.33€ + 8.34€ + 2.71€) after the previous cancellation.
- **Refund invoiced item A:** refunded amount is <span style="color:orange">**8.33€**</span>

**Result:** User gets one item with the <span style="color:orange">**reduced**</span> discount

**Balance:** <span style="color:orange">**11.05€**</span> = 27.71€ - 8.33€ - 8.33€ = 9€ + 2.71€ - 2/3€ (discount)

### ![#008118](https://via.placeholder.com/15/008118/000000?text=+) <span style="color:green">**Promotional calculation**</span>
- **Cancel one item B:** cancellation amount is <span style="color:green">**7€**</span> = 9€ - 2€ (cancelled promotion)
- **Invoice one item B and item A:** invoice amount is <span style="color:green">**20.71€**</span> = 9€ + 9€ + 2.71€
- **Refund invoiced item A:** refunded amount is <span style="color:green">**9€**</span> (as promotion was cancelled on first step)

**Result:** User gets one item <span style="color:green">**without**</span> discount

**Balance:** <span style="color:green">**11.71€**</span> = 27.71€ - 7€ - 9€ = 9€ + 2.71€ (no discount)

**Note:** If we don't do the first cancellation,
the refund amount should be <span style="color:green">**7€**</span>
(promotion cancellation on refund) to be able to invoice the rest.

- [**Back to business scenarios**](./business.md)
- [Discount on shipping costs](./shipping.md)
- [Discount on a specific item](./2plus1item.md)

### Read more
- [README home](../../README.md)
- [Order model](../model.md)
- [Interfaces](../interfaces.md)
- [Basics](../basics.md) (low-order functions)
- [Documents](../documents.md)
- [Invariants](../invariants.md)
- [Cart](../cart.md)
- [Order](../order.md) (high-order functions)
- [Injectable API](../injectable.md)