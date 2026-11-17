// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { AuthProvider } from '../auth/AuthContext';
import { ThemeProvider } from '../theme/ThemeContext';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

function renderLogin(handler: (path: string, init?: RequestInit) => Response) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) =>
      handler(new URL(String(input), 'http://localhost').pathname, init),
    ),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/login']}>
        <ThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('LoginPage with an unavailable backend', () => {
  it('explains that the API is not configured instead of reporting wrong credentials', async () => {
    const notConfigured = () =>
      json(503, {
        message: 'La API de AdminGest todavía no está configurada.',
        code: 'API_NOT_CONFIGURED',
      });
    renderLogin(notConfigured);

    expect(
      await screen.findByText(/todavía no está configurado en este despliegue/),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Correo electrónico' }), {
      target: { value: 'ana@empresa.test' },
    });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'Clave-segura-1' } });
    fireEvent.click(screen.getByRole('button', { name: /Entrar/ }));

    const alert = await screen
      .findByRole('alert', { name: '' }, { timeout: 2000 })
      .catch(() => null);
    expect(alert ?? document.body).not.toHaveTextContent(/credenciales/i);
    expect(screen.queryByText(/credenciales/i)).not.toBeInTheDocument();
    // Registration is hidden when its availability cannot be confirmed.
    expect(screen.queryByRole('button', { name: /Crea una cuenta/ })).not.toBeInTheDocument();
  });

  it('hides self-service registration when the API reports it is closed', async () => {
    renderLogin((path) => {
      if (path.endsWith('/auth/registration')) return json(200, { enabled: false });
      if (path.endsWith('/health/ready')) return json(200, { status: 'ready' });
      return json(401, { message: 'Sesión no válida.' });
    });

    expect(await screen.findByText(/registro de nuevas empresas está cerrado/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Crea una cuenta/ })).not.toBeInTheDocument();
  });

  it('offers registration when the API allows it', async () => {
    renderLogin((path) => {
      if (path.endsWith('/auth/registration')) return json(200, { enabled: true });
      if (path.endsWith('/health/ready')) return json(200, { status: 'ready' });
      return json(401, { message: 'Sesión no válida.' });
    });
    expect(await screen.findByRole('button', { name: /Crea una cuenta/ })).toBeInTheDocument();
  });
});
