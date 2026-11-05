import { BadRequestException } from '@nestjs/common';

export interface QuoteCalculationItem {
  quantity: number;
  unitPrice: number;
  taxRate?: number;
}

export interface QuoteLineTotals {
  /** quantity × unit price, before discount and ITBIS. */
  lineTotal: number;
  /** Share of the global discount assigned to the line. */
  discount: number;
  /** ITBIS of the line, calculated over (lineTotal − discount). */
  tax: number;
  taxRate: number;
}

export interface QuoteTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  lines: QuoteLineTotals[];
}

export const DEFAULT_ITBIS_RATE = 18;
/** Largest amount that fits safely in DECIMAL(18,2) with margin for sums. */
export const MAX_QUOTE_TOTAL = 9_999_999_999_999.99;

const toCents = (value: number): bigint => BigInt(Math.round(value * 100));
const toBasisPoints = (rate: number): bigint => BigInt(Math.round(rate * 100));
const fromCents = (value: bigint): number => Number(value) / 100;
/** Integer division rounding half up (inputs are non-negative). */
const divideRounded = (numerator: bigint, denominator: bigint): bigint =>
  (numerator * 2n + denominator) / (denominator * 2n);

/**
 * Calculates a quote in integer cents:
 * 1. line subtotal = quantity × unit price, rounded to cents;
 * 2. the global discount is distributed among lines proportionally to their subtotal
 *    (largest remainder method, so the line discounts add up exactly to the discount);
 * 3. ITBIS is calculated per line over its discounted base with the line rate
 *    (0 % for exempt lines) and rounded to cents;
 * 4. totals are the exact sum of the line amounts.
 */
export function calculateQuote(
  items: QuoteCalculationItem[],
  discount = 0,
): QuoteTotals {
  if (!items.length) {
    throw new BadRequestException('La cotización debe contener al menos una línea.');
  }

  const lines = items.map((item) => {
    if (!(item.quantity > 0) || item.unitPrice < 0) {
      throw new BadRequestException('Cantidad o precio unitario no válidos.');
    }
    const rate = item.taxRate ?? DEFAULT_ITBIS_RATE;
    if (rate < 0 || rate > 100) {
      throw new BadRequestException('La tasa de ITBIS debe estar entre 0 % y 100 %.');
    }
    return {
      cents: divideRounded(toCents(item.quantity) * toCents(item.unitPrice), 100n),
      rate,
      rateBasisPoints: toBasisPoints(rate),
    };
  });

  const subtotal = lines.reduce((sum, line) => sum + line.cents, 0n);
  const requestedDiscount = toCents(Math.max(discount || 0, 0));
  const discountCents = requestedDiscount > subtotal ? subtotal : requestedDiscount;

  // Proportional distribution with exact sum (largest remainder).
  const shares = lines.map((line, index) => {
    if (subtotal === 0n) return { index, cents: 0n, remainder: 0n };
    const product = discountCents * line.cents;
    return { index, cents: product / subtotal, remainder: product % subtotal };
  });
  let pending = discountCents - shares.reduce((sum, share) => sum + share.cents, 0n);
  [...shares]
    .sort((left, right) =>
      right.remainder === left.remainder
        ? left.index - right.index
        : right.remainder > left.remainder ? 1 : -1,
    )
    .forEach((share) => {
      if (pending > 0n) {
        shares[share.index].cents += 1n;
        pending -= 1n;
      }
    });

  const lineTotals = lines.map((line, index) => {
    const base = line.cents - shares[index].cents;
    const tax = divideRounded(base * line.rateBasisPoints, 10_000n);
    return { line, discount: shares[index].cents, tax };
  });
  const tax = lineTotals.reduce((sum, line) => sum + line.tax, 0n);
  const total = subtotal - discountCents + tax;

  if (fromCents(total) > MAX_QUOTE_TOTAL || fromCents(subtotal) > MAX_QUOTE_TOTAL) {
    throw new BadRequestException('El importe de la cotización excede el máximo permitido.');
  }

  return {
    subtotal: fromCents(subtotal),
    discount: fromCents(discountCents),
    tax: fromCents(tax),
    total: fromCents(total),
    lines: lineTotals.map(({ line, discount: lineDiscount, tax: lineTax }) => ({
      lineTotal: fromCents(line.cents),
      discount: fromCents(lineDiscount),
      tax: fromCents(lineTax),
      taxRate: line.rate,
    })),
  };
}
