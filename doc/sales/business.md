# Business scenarios
Covered by unit-tests in [src/tests/sales](../../src/tests/sales)

### Motivation
The main idea is to describe different types of promotions,
and the way to cancel the promotion, when conditions are not met because of cancellations or refunds.

**3 different types of promotion will be described:**
- discount on shipping costs
- discount on subtotal
- discount on a specific item(s)

The library is designed to handle **combinations of different promotions** at the same time.

### Assumptions
The promotion is applicable to the whole order,
but not applicable to the subset of the order.

In all cases, we will have 3 items in order. The first operation could be cancellation or invoice.
We can refund only what was invoiced. Potentially, we can do a lot of sales operations.

**The next 3 sequences of operations should give the same _result balance_ in the order with 3 items:**
- Cancel 3rd item -> Invoice first 2 items -> Refund first item
- Invoice first 2 items -> Cancel 3rd item -> Refund first item
- Invoice first 2 items -> Refund first item -> Cancel 3rd item ([adjustment refund](../../src/tests/sales/subtotal.spec.ts#L48) may be needed)

**Note:** The first invoice will include the order shipping costs.

### Scenarios
- [Discount on shipping costs](./shipping.md)
- [Discount on subtotal](./subtotal.md)
- [Discount on a specific item](./2plus1item.md)

### Definitions
![#008118](https://via.placeholder.com/15/008118/000000?text=+) <span style="color:green">**Promotional calculation:**</span>
The cart knows how to recalculate promotion on subset of the order -
means the cart knows how to cancel promotion.

![#fba321](https://via.placeholder.com/15/fba321/000000?text=+) <span style="color:orange">**Spreading discount calculation:**</span>
The information about promotion conditions is lost after the order is placed.
The best what we can do (compromise) - spread the discount between sales documents.

For more information see the [Order model](../model.md) diagrams.

[![Order model](../order.png)](../model.md)

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