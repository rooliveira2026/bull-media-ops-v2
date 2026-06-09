import { Activity, Command } from "lucide-react";
import { navItems, type RouteKey } from "./navigation";

interface AppShellProps {
  activeRoute: RouteKey;
  onNavigate: (route: RouteKey) => void;
  children: React.ReactNode;
}

export function AppShell({ activeRoute, onNavigate, children }: AppShellProps) {
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
          <span>Arquitetura modular preparada para Supabase</span>
        </div>
      </aside>

      <main className="main-area">
        <div className="topbar">
          <div>
            <span className="topbar__label">Bull Digital</span>
            <strong>Marketing Operations Platform</strong>
          </div>
          <div className="topbar__status">
            <span />
            Mock data · Sprint 0
          </div>
        </div>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
