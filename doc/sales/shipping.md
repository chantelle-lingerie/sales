# :ship: Discount on shipping costs
Covered by unit-tests in [src/tests/sales/shipping.spec.ts](../../src/tests/sales/shipping.spec.ts)

### Promotion
Free delivery if order has 3 or more items

:heavy_exclamation_mark:
Business rule says, that we can't get more shipping costs,
than it was in the order.

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
- **Shipping:** 0€ ("free delivery" promotion applied)
- **Total:** 27€

**Cancel one item B:**
- ![#d70308](https://via.placeholder.com/15/d70308/000000?text=+) **Bad calculation:** <span style="color:red">**nonzero**</span> shipping amount
- ![#008118](https://via.placeholder.com/15/008118/000000?text=+) **Good calculation:** shipping amount <span style="color:green">**forced to be zero**</span>

**Invoice one item B and item A:**
- ![#d70308](https://via.placeholder.com/15/d70308/000000?text=+) **Bad calculation:** <span style="color:red">**nonzero**</span> shipping amount
- ![#008118](https://via.placeholder.com/15/008118/000000?text=+) **Good calculation:** shipping amount <span style="color:green">**forced to be zero**</span>

**Refund invoiced item A:**
- ![#d70308](https://via.placeholder.com/15/d70308/000000?text=+) **Bad calculation:** <span style="color:red">**nonzero**</span> shipping amount
- ![#008118](https://via.placeholder.com/15/008118/000000?text=+) **Good calculation:** shipping amount <span style="color:green">**forced to be zero**</span>

**Note:** Both spreading and promotional calculation following this business rule.

- [**Back to business scenarios**](./business.md)
- [Discount on subtotal](./subtotal.md)
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