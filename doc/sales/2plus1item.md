# :gift: Discount on a specific item
Covered by unit-tests in [src/tests/sales/2plus1item.spec.ts](../../src/tests/sales/2plus1item.spec.ts)

### Promotion
Every 3rd **cheapest** item discounted - reduce product price to 1€

### The order #1
- **Items:**
    - Item A:
      - price: 5€
      - quantity: 1
      - row total: 1€ ("2 + 1" promotion applied)
    - Item B:
      - price: 10€
      - quantity: 1
      - row total: 10€
    - Item C:
      - price: 10€
      - quantity: 1
      - row total: 10€
- **Subtotal:** 21€ = 1€ + 10€ + 10€
- **Shipping:** 2.71€
- **Total:** 23.71€ = 21€ + 2.71€

### ![#d70308](https://via.placeholder.com/15/d70308/000000.png?text=+) <span style="color:red">Bad calculation</span>
- **Cancel item C:** cancellation amount is <span style="color:red">**10€**</span>
- **Invoice item A and item B:**
  - Not possible to invoice **17.71€** (5€ + 10€ + 2.71€) after the previous cancellation
  - The invoice max amount is <span style="color:red">**13.71€**</span> (23.71€ - 10€) after the previous cancellation
- **Refund invoiced item A:** refunded amount is <span style="color:red">**5€**</span>

**Result:** User gets one item with the <span style="color:red">**discounted**</span> price

**Balance:** <span style="color:red">**8.71€**</span> = 23.71€ - 10€ - 5€ = 10€ + 2.71€ - 4€ (discount)

**Note:** Spreading calculation will do <span style="color:red">**bad calculations**</span>,
because we can't spread one item discount with different items.

### ![#008118](https://via.placeholder.com/15/008118/000000.png?text=+) <span style="color:green">**Promotional calculation**</span>
- **Cancel item C:** cancellation amount is <span style="color:green">**6€**</span> = 10€ - 4€ (cancelled promotion)
- **Invoice item A and item B:** invoice amount is <span style="color:green">**17.71€**</span> = 5€ + 10€ + 2.71€
- **Refund invoiced item A:** refunded amount is <span style="color:green">**5€**</span> (as promotion was cancelled on first step)

**Result:** User gets item B <span style="color:green">**without**</span> discount

**Balance:** <span style="color:green">**12.71€**</span> = 23.71€ - 6€ - 5€ = 10€ + 2.71€ (no discount)

**Note:** If we don't do the first cancellation,
the refund amount should be <span style="color:green">**6€**</span>
(promotion cancellation on refund) to be able to invoice the rest.

### The order #2
- **Items:**
  - Item A:
    - price: 10€
    - quantity: 3
    - row total: 21€ ("2 + 1" promotion applied)
- **Subtotal:** 21€ (2 * 10€ + 1€)
- **Shipping:** 2.71€
- **Total:** 23.71€ = 21€ + 2.71€

### ![#d70308](https://via.placeholder.com/15/d70308/000000.png?text=+) <span style="color:red">Bad calculation</span>
- **Cancel one item A:** cancellation amount is <span style="color:red">**10€**</span>
- **Invoice two items A:**
  - Not possible to invoice **22.71€** (2 * 10€ + 2.71€) after the previous cancellation
  - The invoice max amount is <span style="color:red">**13.71€**</span> (23.71€ - 10€) after the previous cancellation
- **Refund one of invoiced items A:** refunded amount is <span style="color:red">**10€**</span>

**Result:** User gets one item A with the <span style="color:red">**discounted**</span> price

**Balance:** <span style="color:red">**3.71€**</span> = 23.71€ - 10€ - 10€ = 1€ + 2.71€ (reduced item price)

### ![#fba321](https://via.placeholder.com/15/fba321/000000.png?text=+) <span style="color:orange">**Spreading discount calculation**</span>
As we have the same item, one third of the item discount (9€ / 3) connected to each item unit.
As a result each item considered as discounted: 10€ - 9/3€ = **7€**
- **Cancel one item A:** cancellation amount is <span style="color:orange">**7€**</span>
- **Invoice two items A:**
  - Not possible to invoice **22.71€** (2 * 10€ + 2.71€) after the previous cancellation
  - The invoice max amount is <span style="color:orange">**16.71€**</span>
    (23.71€ - 7€ = 2 * 7€ + 2.71€) after the previous cancellation.
- **Refund one of invoiced items A:** refunded amount is <span style="color:orange">**7€**</span>

**Result:** User gets one item A item with the <span style="color:orange">**reduced**</span> discount

**Balance:** <span style="color:orange">**9.71€**</span> = 23.71€ - 7€ - 7€ = 7€ + 2.71€ (equally reduced item price)


### ![#008118](https://via.placeholder.com/15/008118/000000.png?text=+) <span style="color:green">**Promotional calculation**</span>
- **Cancel one item A:** cancellation amount is <span style="color:green">**1€**</span> (cancelled promotion)
- **Invoice two items A:** invoice amount is <span style="color:green">**22.71€**</span> = 2 * 10€ + 2.71€
- **Refund invoiced item A:** refunded amount is <span style="color:green">**10€**</span> (as promotion was cancelled on first step)

**Result:** User gets one item A <span style="color:green">**without**</span> discount

**Balance:** <span style="color:green">**12.71€**</span> = 23.71€ - 1€ - 10€ = 10€ + 2.71€ (no discount)

**Note:** If we don't do the first cancellation,
the refund amount should be <span style="color:green">**1€**</span>
(promotion cancellation on refund) to be able to invoice the rest.

- [**Back to business scenarios**](./business.md)
- [Discount on shipping costs](./shipping.md)
- [Discount on subtotal](./subtotal.md)

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