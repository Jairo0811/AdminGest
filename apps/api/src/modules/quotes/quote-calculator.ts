export interface QuoteCalculationItem {
  quantity: number;
  unitPrice: number;
  taxRate?: number;
}

export interface QuoteTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  lines: Array<{ lineTotal: number; tax: number }>;
}

const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function calculateQuote(
  items: QuoteCalculationItem[],
  discount = 0,
): QuoteTotals {
  const lines = items.map((item) => {
    const lineTotal = money(item.quantity * item.unitPrice);
    return {
      lineTotal,
      tax: money(lineTotal * ((item.taxRate ?? 18) / 100)),
    };
  });
  const subtotal = money(lines.reduce((sum, line) => sum + line.lineTotal, 0));
  const normalizedDiscount = money(Math.min(Math.max(discount, 0), subtotal));
  const taxableRatio = subtotal === 0 ? 0 : (subtotal - normalizedDiscount) / subtotal;
  const tax = money(
    lines.reduce((sum, line) => sum + line.tax * taxableRatio, 0),
  );

  return {
    subtotal,
    discount: normalizedDiscount,
    tax,
    total: money(subtotal - normalizedDiscount + tax),
    lines,
  };
}

