import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdministrationPage } from './administration-page';

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn()
}));

vi.mock('../../lib/api', () => ({ api: apiMocks }));

const admin = {
  id: 'admin-1',
  name: 'Administrador',
  email: 'admin@example.com',
  role: 'ADMIN' as const,
  active: true,
  createdAt: '2026-09-24T12:00:00.000Z',
  updatedAt: '2026-09-24T12:00:00.000Z'
};

const pricingConfig = {
  id: 'pricing-1',
  code: 'WEBSITE_BASE_LANDING_PAGE',
  name: 'Base landing page',
  applicationType: 'WEBSITE' as const,
  category: 'BASE',
  configType: 'FIXED_VALUE' as const,
  value: '2500.0000',
  active: true,
  metadata: null,
  createdAt: '2026-09-24T12:00:00.000Z',
  updatedAt: '2026-09-24T12:00:00.000Z'
};

const platformPricingConfig = {
  ...pricingConfig,
  id: 'pricing-2',
  code: 'WEB_PLATFORM_NOTIFICATION_EMAIL',
  name: 'Notificacoes por e-mail',
  applicationType: 'PLATAFORMA_WEB' as const,
  category: 'NOTIFICACOES'
};

const internalPricingConfig = {
  ...pricingConfig,
  id: 'pricing-3',
  code: 'INTERNAL_SYSTEM_MODULE_STANDARD',
  name: 'Modulo padrao',
  applicationType: 'SISTEMA_INTERNO' as const,
  category: 'MODULOS'
};

const invitation = {
  id: 'invitation-1',
  name: 'Maria Silva',
  email: 'maria@example.com',
  role: 'USER' as const,
  status: 'PENDING' as const,
  expiresAt: '2026-09-26T12:00:00.000Z',
  deliveryVersion: 1,
  createdAt: '2026-09-24T12:00:00.000Z',
  updatedAt: '2026-09-24T12:00:00.000Z'
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/administration']}>
      <Routes>
        <Route element={<Outlet context={{ user: admin }} />}>
          <Route path="/administration" element={<AdministrationPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('AdministrationPage', () => {
  beforeEach(() => {
    apiMocks.get.mockImplementation((url: string) => {
      if (url === '/users') return Promise.resolve({ data: { users: [admin] } });
      if (url === '/user-invitations') return Promise.resolve({ data: { invitations: [] } });
      return Promise.resolve({ data: { pricingConfigs: [pricingConfig, platformPricingConfig, internalPricingConfig] } });
    });
  });

  it('envia convite sem solicitar senha e o exibe separadamente', async () => {
    apiMocks.post.mockResolvedValueOnce({
      data: { invitation }
    });
    renderPage();
    const user = userEvent.setup();

    await screen.findByText('Contas internas');
    await user.type(screen.getByLabelText('Nome'), 'Maria Silva');
    await user.type(screen.getByLabelText('E-mail'), 'maria@example.com');
    expect(screen.queryByLabelText('Senha inicial')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Enviar convite' }));

    expect(await screen.findByText('Maria Silva')).toBeInTheDocument();
    expect(apiMocks.post).toHaveBeenCalledWith('/user-invitations', expect.objectContaining({
      email: 'maria@example.com', role: 'USER'
    }));
  });

  it('permite reenviar um convite pendente', async () => {
    apiMocks.get.mockImplementation((url: string) => {
      if (url === '/users') return Promise.resolve({ data: { users: [admin] } });
      if (url === '/user-invitations') return Promise.resolve({ data: { invitations: [invitation] } });
      return Promise.resolve({ data: { pricingConfigs: [pricingConfig] } });
    });
    apiMocks.post.mockResolvedValueOnce({ data: { invitation: { ...invitation, deliveryVersion: 2 } } });
    renderPage();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Reenviar' }));
    expect(apiMocks.post).toHaveBeenCalledWith('/user-invitations/invitation-1/resend');
  });

  it('edita um valor de precificação na mesma área administrativa', async () => {
    apiMocks.patch.mockResolvedValueOnce({
      data: { pricingConfig: { ...pricingConfig, value: '3000.0000' } }
    });
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('tab', { name: 'Precificação' }));
    const input = screen.getByRole('spinbutton', { name: 'Valor de Base landing page' });
    await user.clear(input);
    await user.type(input, '3000');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(apiMocks.patch).toHaveBeenCalledWith(
      '/pricing-configs/pricing-1',
      { value: '3000' }
    ));
    expect(await screen.findByText('Valor de “Base landing page” atualizado.')).toBeInTheDocument();
  });

  it('separa a precificação por tipo de aplicação e acentua os nomes exibidos', async () => {
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('tab', { name: 'Precificação' }));
    expect(screen.getByText('Base landing page')).toBeInTheDocument();
    expect(screen.queryByText('Módulo padrão')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Sistema Interno' }));
    expect(screen.getByText('Módulo padrão')).toBeInTheDocument();
    expect(screen.getByText('Módulos')).toBeInTheDocument();
    expect(screen.queryByText('Base landing page')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Plataforma Web' }));
    expect(screen.getByText('Notificações por e-mail')).toBeInTheDocument();
    expect(screen.getByText('Notificações')).toBeInTheDocument();
  });
});
