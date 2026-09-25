import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActivateAccountPage } from './activate-account-page';

const apiMocks = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('../../lib/api', () => ({ api: apiMocks }));

function renderPage(token = 'a'.repeat(43)) {
  return render(<MemoryRouter initialEntries={[`/activate-account?token=${token}`]}><Routes><Route path="/activate-account" element={<ActivateAccountPage />} /><Route path="/" element={<div>Conta ativada</div>} /></Routes></MemoryRouter>);
}

describe('ActivateAccountPage', () => {
  beforeEach(() => { apiMocks.post.mockResolvedValue({ data: { valid: true } }); });

  it('valida o link, confere as senhas e ativa a conta', async () => {
    renderPage();
    const user = userEvent.setup();
    await screen.findByText('Defina sua senha');
    await user.type(screen.getByLabelText('Senha'), 'senha-segura');
    await user.type(screen.getByLabelText('Confirmar senha'), 'senha-segura');
    await user.click(screen.getByRole('button', { name: 'Ativar conta' }));
    await waitFor(() => expect(apiMocks.post).toHaveBeenLastCalledWith('/auth/activations/accept', { token: 'a'.repeat(43), password: 'senha-segura' }));
    expect(await screen.findByText('Conta ativada')).toBeInTheDocument();
  });

  it('permite mostrar e ocultar os dois campos de senha', async () => {
    renderPage();
    const user = userEvent.setup();
    await screen.findByText('Defina sua senha');
    const toggles = screen.getAllByRole('button', { name: 'Mostrar senha' });
    await user.click(toggles[0]!);
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'text');
    expect(toggles[0]).toHaveAttribute('aria-pressed', 'true');
  });

  it('mostra um estado próprio para link expirado', async () => {
    apiMocks.post.mockRejectedValueOnce({ isAxiosError: true, response: { data: { error: { code: 'ACTIVATION_EXPIRED' } } } });
    renderPage();
    expect(await screen.findByText('Link expirado')).toBeInTheDocument();
  });
});
