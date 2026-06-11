import { Activity, Command } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { RuntimeEnvBadge } from "../shared/components/RuntimeEnvBadge";
import { navItems, type RouteKey } from "./navigation";

interface AppShellProps {
  activeRoute: RouteKey;
  onNavigate: (route: RouteKey) => void;
  children: React.ReactNode;
}

export function AppShell({ activeRoute, onNavigate, children }: AppShellProps) {
  const { isSupabaseMode, memberships, profile, user, signOut } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand__mark">
            <Activity size={20} strokeWidth={2} />
          </div>
          <div>
            <strong>Bull Media Ops</strong>
            <span>Platform V2</span>
          </div>
        </div>

        <nav className="sidebar__nav" aria-label="Navegação principal">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.key === activeRoute;

            return (
              <button
                key={item.key}
                className={active ? "nav-item nav-item--active" : "nav-item"}
                onClick={() => onNavigate(item.key)}
                type="button"
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar__footer">
          <Command size={16} />
          <span>Operação integrada de marketing, mídia e inteligência.</span>
        </div>
      </aside>

      <main className="main-area">
        <div className="topbar">
          <div>
            <span className="topbar__label">Bull Digital</span>
            <strong>Marketing Operations Platform</strong>
          </div>

          <div className="topbar__actions">
            <div className="topbar__status">
              <span />
              {isSupabaseMode ? "Supabase staging" : "Ambiente de demonstração"}
            </div>

            {isSupabaseMode ? (
              <button className="topbar__logout" onClick={signOut} type="button">
                Sair
                {profile?.name || user?.email ? ` · ${profile?.name ?? user?.email}` : ""}
                {memberships.length ? ` · ${memberships.length} org` : ""}
              </button>
            ) : null}
          </div>
        </div>

        <div className="content">{children}</div>
      </main>

      <RuntimeEnvBadge />
    </div>
  );
}
