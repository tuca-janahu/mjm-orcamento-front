import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { LoginPage } from './login-page';

describe('LoginPage', () => {
  it('alterna a visibilidade da senha de forma acessível', async () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    const user = userEvent.setup();
    const password = screen.getByPlaceholderText('Sua senha');
    const toggle = screen.getByRole('button', { name: 'Mostrar senha' });
    expect(password).toHaveAttribute('type', 'password');
    await user.click(toggle);
    expect(password).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Ocultar senha' })).toHaveAttribute('aria-pressed', 'true');
  });
});
