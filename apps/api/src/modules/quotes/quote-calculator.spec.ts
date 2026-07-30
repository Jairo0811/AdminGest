import { calculateQuote } from './quote-calculator';

describe('calculateQuote', () => {
  it('calculates subtotal, proportional tax and total', () => {
    const result = calculateQuote(
      [
        { quantity: 2, unitPrice: 100, taxRate: 18 },
        { quantity: 1, unitPrice: 50, taxRate: 0 },
      ],
      25,
    );

    expect(result.subtotal).toBe(250);
    expect(result.discount).toBe(25);
    expect(result.tax).toBe(32.4);
    expect(result.total).toBe(257.4);
  });

  it('never applies a discount above the subtotal', () => {
    const result = calculateQuote([{ quantity: 1, unitPrice: 10 }], 100);

    expect(result.discount).toBe(10);
    expect(result.tax).toBe(0);
    expect(result.total).toBe(0);
  });
});

