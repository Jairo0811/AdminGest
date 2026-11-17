/** Subset of an EntityPage field needed to convert values. */
export interface FieldShape {
  type?: string;
}

/** Empty inputs are omitted (never sent as 0 or ""), so optional values stay optional. */
export const normalizeValue = (field: FieldShape, value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return field.type === 'number' ? Number(trimmed) : value;
};

/** Converts API dates (ISO strings) into the value format of date inputs. */
export const toInputValue = (field: FieldShape, value: unknown): string => {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (field.type === 'date') return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : '';
  if (field.type === 'datetime-local') {
    const date = new Date(text);
    if (Number.isNaN(date.getTime())) return '';
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
  }
  return text;
};
