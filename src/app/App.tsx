import { useState } from "react";
import { AppShell } from "../shell/AppShell";
import { LoginPage } from "../auth/LoginPage";
import { useAuth } from "../auth/AuthProvider";
import type { RouteKey } from "../shell/navigation";
import { AiAgentsPage } from "../modules/ai-agents/AiAgentsPage";
import { ClientIntelligencePage } from "../modules/client-intelligence/ClientIntelligencePage";
import { CoreSettingsPage } from "../modules/core/CoreSettingsPage";
import { CreativeOpsPage } from "../modules/creative-ops/CreativeOpsPage";
import { IntegrationsPage } from "../modules/integrations/IntegrationsPage";
import { ActionsCenter } from "../modules/media-ops/ActionsCenter";
import { ExecutiveOverview } from "../modules/media-ops/ExecutiveOverview";
import { MediaOpsPage } from "../modules/media-ops/MediaOpsPage";
import { PdmPage } from "../modules/pdm/PdmPage";
import { ReportsPage } from "../modules/reports/ReportsPage";
import { SocialOpsPage } from "../modules/social-ops/SocialOpsPage";

function renderRoute(route: RouteKey) {
  switch (route) {
    case "executive":
      return <ExecutiveOverview />;
    case "media":
      return <MediaOpsPage />;
    case "actions":
      return <ActionsCenter />;
    case "social":
      return <SocialOpsPage />;
    case "creative":
      return <CreativeOpsPage />;
    case "reports":
      return <ReportsPage />;
    case "pdm":
      return <PdmPage />;
    case "intelligence":
      return <ClientIntelligencePage />;
    case "integrations":
      return <IntegrationsPage />;
    case "settings":
      return <CoreSettingsPage />;
    default:
      return <AiAgentsPage />;
  }
}

export function App() {
  const [activeRoute, setActiveRoute] = useState<RouteKey>("executive");
  const { configurationError, isLoading, isSupabaseMode, session } = useAuth();

  if (isSupabaseMode && isLoading) {
    return <div className="app-loading">Carregando sessão...</div>;
  }

  if (isSupabaseMode && configurationError) {
    return (
      <div className="app-loading app-loading--error">
        <strong>Configuração Supabase incompleta</strong>
        <span>{configurationError}</span>
      </div>
    );
  }

  if (isSupabaseMode && !session) {
    return <LoginPage />;
  }

  return (
    <AppShell activeRoute={activeRoute} onNavigate={setActiveRoute}>
      {renderRoute(activeRoute)}
    </AppShell>
  );
}
