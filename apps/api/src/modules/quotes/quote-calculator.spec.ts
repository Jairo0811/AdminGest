import { BadRequestException } from '@nestjs/common';
import { calculateQuote } from './quote-calculator';

const sum = (values: number[]) => Math.round(values.reduce((a, b) => a + b, 0) * 100) / 100;

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
    expect(result.lines).toEqual([
      { lineTotal: 200, discount: 20, tax: 32.4, taxRate: 18 },
      { lineTotal: 50, discount: 5, tax: 0, taxRate: 0 },
    ]);
  });

  it('rejects a discount above the subtotal instead of silently changing it', () => {
    expect(() => calculateQuote([{ quantity: 1, unitPrice: 10 }], 100)).toThrow(
      BadRequestException,
    );
  });

  it('accepts a discount equal to the subtotal (total 0, no ITBIS)', () => {
    const result = calculateQuote([{ quantity: 1, unitPrice: 10 }], 10);

    expect(result.discount).toBe(10);
    expect(result.tax).toBe(0);
    expect(result.total).toBe(0);
  });

  it('applies ITBIS 18 % by default to a taxed line', () => {
    const result = calculateQuote([{ quantity: 3, unitPrice: 1250.5 }]);

    expect(result.subtotal).toBe(3751.5);
    expect(result.tax).toBe(675.27); // 3751.50 × 0.18 = 675.27
    expect(result.total).toBe(4426.77);
  });

  it('keeps exempt lines without ITBIS', () => {
    const result = calculateQuote([
      { quantity: 1, unitPrice: 1000, taxRate: 0 },
      { quantity: 2, unitPrice: 0.5, taxRate: 0 },
    ]);

    expect(result.tax).toBe(0);
    expect(result.total).toBe(1001);
  });

  it('distributes an uneven discount so line discounts add up exactly', () => {
    const result = calculateQuote(
      [
        { quantity: 1, unitPrice: 33.33, taxRate: 18 },
        { quantity: 1, unitPrice: 33.33, taxRate: 18 },
        { quantity: 1, unitPrice: 33.34, taxRate: 0 },
      ],
      10,
    );

    expect(sum(result.lines.map((line) => line.discount))).toBe(10);
    expect(sum(result.lines.map((line) => line.tax))).toBe(result.tax);
    expect(result.total).toBe(
      Math.round((result.subtotal - result.discount + result.tax) * 100) / 100,
    );
  });

  it('avoids binary floating point drift with cents', () => {
    const result = calculateQuote([{ quantity: 3, unitPrice: 0.1, taxRate: 18 }]);

    expect(result.subtotal).toBe(0.3);
    expect(result.tax).toBe(0.05); // 0.054 → 0.05
    expect(result.total).toBe(0.35);
  });

  it('rounds half up per line', () => {
    // 0.25 × 18 % = 0.045 → 0.05
    const result = calculateQuote([{ quantity: 1, unitPrice: 0.25, taxRate: 18 }]);
    expect(result.tax).toBe(0.05);
  });

  it('handles fractional quantities and a zero subtotal', () => {
    expect(calculateQuote([{ quantity: 1.5, unitPrice: 99.99 }]).subtotal).toBe(149.99);
    const zero = calculateQuote([{ quantity: 1, unitPrice: 0 }], 0);
    expect(zero).toMatchObject({ subtotal: 0, discount: 0, tax: 0, total: 0 });
  });

  it('rejects negative discounts', () => {
    expect(() => calculateQuote([{ quantity: 1, unitPrice: 100 }], -50)).toThrow(
      BadRequestException,
    );
  });

  it('rejects empty quotes, invalid lines and out-of-range amounts', () => {
    expect(() => calculateQuote([])).toThrow(BadRequestException);
    expect(() => calculateQuote([{ quantity: 0, unitPrice: 1 }])).toThrow(BadRequestException);
    expect(() => calculateQuote([{ quantity: 1, unitPrice: 1, taxRate: 150 }])).toThrow(
      BadRequestException,
    );
    expect(() =>
      calculateQuote([{ quantity: 1_000_000, unitPrice: 1_000_000_000_000 }]),
    ).toThrow(BadRequestException);
  });
});
