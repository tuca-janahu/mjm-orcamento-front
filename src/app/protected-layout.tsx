import type { AuthUser } from '../lib/api-types';
import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { BrandMark } from '../components/brand-mark';
import { AppHeader } from '../components/app-header';
import { api } from '../lib/api';

export function ProtectedLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let active = true;
    void api
      .get<{ user: AuthUser }>('/auth/me')
      .then(({ data }) => { if (active) setUser(data.user); })
      .catch(() => { if (active) void navigate('/login', { replace: true }); });
    return () => { active = false; };
  }, [navigate]);

  async function logout(): Promise<void> {
    await api.post('/auth/logout');
    void navigate('/login', { replace: true });
  }

  if (user === null) {
    return (
      <main className="grid min-h-screen place-content-center justify-items-center gap-5 bg-zinc-50 text-zinc-950">
        <BrandMark />
        <span className="h-px w-24 animate-pulse bg-zinc-950" />
        <p className="m-0 text-[0.625rem] tracking-[0.18em] text-zinc-500 uppercase">Validando acesso</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-zinc-100 px-6 text-zinc-950 md:px-10 lg:px-16">
      <AppHeader user={user} onLogout={logout} />
      <Outlet context={{ user }} />
      <footer className="mt-auto flex flex-col justify-between gap-3.5 py-6 text-[0.5625rem] tracking-[0.12em] text-zinc-500 uppercase sm:flex-row">
        <span>MJM Group</span>
        <span>Ferramenta de uso interno</span>
      </footer>
    </main>
  );
}
