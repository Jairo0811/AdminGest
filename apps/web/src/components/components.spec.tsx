// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

const apiMock = vi.fn();
vi.mock('../api/client', () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));
vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'u1',
      companyId: 'c1',
      email: 'admin@empresa-a.test',
      firstName: 'Ana',
      lastName: 'Admin',
      role: 'ADMIN',
      company: { name: 'Empresa A', currency: 'DOP', timezone: 'America/Santo_Domingo' },
    },
  }),
}));

const { EntityPage } = await import('./EntityPage');

afterEach(cleanup);

function ModalHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} type="button">
        Abrir
      </button>
      {open && (
        <Modal onClose={() => setOpen(false)} title="Nuevo cliente">
          <form>
            <input aria-label="Nombre" />
            <button type="submit">Guardar</button>
          </form>
        </Modal>
      )}
    </>
  );
}

describe('Modal', () => {
  it('is labelled, moves focus inside, traps Tab, closes with Escape and restores focus', async () => {
    render(<ModalHarness />);
    const opener = screen.getByRole('button', { name: 'Abrir' });
    opener.focus();
    fireEvent.click(opener);

    const dialog = await screen.findByRole('dialog', { name: 'Nuevo cliente' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    const name = screen.getByLabelText('Nombre');
    expect(name).toHaveFocus();

    const save = screen.getByRole('button', { name: 'Guardar' });
    save.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(save).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(opener).toHaveFocus();
  });

  it('closes on a backdrop click but not when a press starts inside the dialog', async () => {
    render(<ModalHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    const dialog = await screen.findByRole('dialog');
    const backdrop = dialog.parentElement!;

    fireEvent.mouseDown(dialog);
    fireEvent.mouseUp(backdrop);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.mouseDown(backdrop);
    fireEvent.mouseUp(backdrop);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});

const renderEntityPage = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <EntityPage
        columns={[
          {
            label: 'Nombre',
            render: (item) => String(item.name),
            exportValue: (item) => String(item.name),
          },
        ]}
        description="Clientes"
        endpoint="/customers"
        fields={[
          { name: 'name', label: 'Nombre', required: true },
          { name: 'budget', label: 'Presupuesto', type: 'number' },
        ]}
        singular="cliente"
        title="Clientes"
      />
    </QueryClientProvider>,
  );
};

describe('EntityPage', () => {
  beforeEach(() => apiMock.mockReset());
  afterEach(() => vi.useRealTimers());

  it('shows an error state with retry instead of an empty list when the API fails', async () => {
    apiMock.mockRejectedValueOnce(new Error('Servicio no disponible'));
    renderEntityPage();

    expect(await screen.findByText('No fue posible cargar clientes')).toBeInTheDocument();
    expect(screen.getByText('Servicio no disponible')).toBeInTheDocument();
    expect(screen.queryByText(/Todavía no hay registros/)).not.toBeInTheDocument();

    apiMock.mockResolvedValueOnce([{ id: '1', name: 'Cliente Uno' }]);
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/ }));
    expect(await screen.findByText('Cliente Uno')).toBeInTheDocument();
  });

  it('distinguishes an empty module from an empty search result', async () => {
    apiMock.mockResolvedValueOnce([]);
    renderEntityPage();
    expect(await screen.findByText('Todavía no hay registros de clientes')).toBeInTheDocument();
  });

  it('submits once even when the user clicks repeatedly, and omits empty numbers', async () => {
    apiMock.mockResolvedValueOnce([]);
    let resolveSave: (value: unknown) => void = () => undefined;
    renderEntityPage();
    await screen.findByText('Todavía no hay registros de clientes');

    fireEvent.click(screen.getByRole('button', { name: /Nuevo cliente/ }));
    fireEvent.change(await screen.findByRole('textbox', { name: /Nombre/ }), {
      target: { value: 'Cliente Dos' },
    });
    apiMock.mockImplementationOnce(() => new Promise((resolve) => (resolveSave = resolve)));
    const form = screen.getByRole('button', { name: 'Guardar' }).closest('form')!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    fireEvent.submit(form);

    const posts = () =>
      apiMock.mock.calls.filter(
        ([, options]) => (options as RequestInit | undefined)?.method === 'POST',
      );
    await waitFor(() => expect(posts()).toHaveLength(1));
    await act(async () => new Promise((resolve) => setTimeout(resolve, 20)));
    const saves = posts();
    expect(saves).toHaveLength(1);
    expect(JSON.parse(String((saves[0][1] as RequestInit).body))).toEqual({ name: 'Cliente Dos' });

    apiMock.mockResolvedValue([]);
    await act(async () => resolveSave({ id: '2' }));
    expect(await screen.findByText('Cliente guardado correctamente.')).toBeInTheDocument();
  });
});
