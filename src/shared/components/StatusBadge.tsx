import type { ActionPriority, ActionStatus, HealthStatus } from "../types/media";

export function HealthBadge({ status }: { status: HealthStatus }) {
  const label = {
    healthy: "Saudável",
    attention: "Atenção",
    critical: "Crítico",
    opportunity: "Oportunidade",
  }[status];
  return <span className={`badge badge--${status}`}>{label}</span>;
}

export function PriorityBadge({ priority }: { priority: ActionPriority }) {
  return <span className={`badge badge--priority-${priority}`}>{priority}</span>;
}

export function ActionStatusBadge({ status }: { status: ActionStatus }) {
  const label = {
    pending: "Pendente",
    executed: "Executada",
    recheck: "Reavaliar",
  }[status];
  return <span className={`badge badge--action-${status}`}>{label}</span>;
}
