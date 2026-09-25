import { NavLink, useLocation } from 'react-router';
import type { AuthUser } from '../lib/api-types';
import { BrandMark } from './brand-mark';

interface AppHeaderProps {
  user: AuthUser;
  onLogout: () => void | Promise<void>;
}

const navigationLink = ({ isActive }: { isActive: boolean }) =>
  `flex items-center border-b-2 no-underline transition-colors ${
    isActive
      ? 'border-white text-white'
      : 'border-transparent text-zinc-400 hover:border-zinc-400 hover:text-white'
  }`;

export function AppHeader({ user, onLogout }: AppHeaderProps) {
  const location = useLocation();
  const projectsActive =
    location.pathname.startsWith('/projects') ||
    location.pathname.startsWith('/budgets');

  return (
    <header className="-mx-6 grid min-h-17 grid-cols-[1fr_auto] items-center bg-black px-6 text-white md:-mx-10 md:px-10 lg:-mx-16 lg:grid-cols-[1fr_auto_1fr] lg:px-16">
      <NavLink
        className="w-fit text-white no-underline"
        to="/"
        aria-label="Ir para a visão geral"
      >
        <BrandMark compact />
      </NavLink>

      <nav
        className="hidden self-stretch items-stretch gap-7 text-xs lg:flex"
        aria-label="Navegação principal"
      >
        <NavLink className={navigationLink} to="/" end>
          Visão geral
        </NavLink>
        <NavLink
          className={() => navigationLink({ isActive: projectsActive })}
          to="/projects"
        >
          Projetos e orçamentos
        </NavLink>
        {user.role === 'ADMIN' && (
          <NavLink className={navigationLink} to="/administration">
            Administração
          </NavLink>
        )}
      </nav>

      <div className="flex items-center justify-self-end gap-5">
        <div className="flex items-center gap-2 text-xs text-zinc-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="hidden sm:inline">{user.name}</span>
        </div>
        <button
          className="cursor-pointer border-0 border-b border-zinc-500 bg-transparent p-0 pb-0.5 text-[0.625rem] tracking-[0.12em] text-zinc-300 uppercase transition-colors hover:border-white hover:text-white"
          type="button"
          onClick={() => void onLogout()}
        >
          Sair
        </button>
      </div>
    </header>
  );
}
