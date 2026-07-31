// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { exportToExcel } from './export';

describe('exportToExcel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates and downloads an Excel-compatible file', () => {
    const createObjectUrl = vi.fn(() => 'blob:admingest-test');
    const revokeObjectUrl = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrl,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectUrl,
    });

    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

    exportToExcel(
      'Clientes activos',
      [{ name: 'Acme', total: 1250 }],
      [
        { label: 'Cliente', value: (item) => item.name },
        { label: 'Total', value: (item) => item.total },
      ],
    );

    expect(createObjectUrl).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:admingest-test');
  });
});
