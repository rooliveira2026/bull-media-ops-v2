import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  detail?: string;
  icon: LucideIcon;
  tone?: "default" | "primary" | "success" | "warning" | "danger";
}

export function KpiCard({ label, value, detail, icon: Icon, tone = "default" }: KpiCardProps) {
  return (
    <article className={`kpi-card kpi-card--${tone}`}>
      <div className="kpi-card__top">
        <span className="kpi-card__label">{label}</span>
        <span className="kpi-card__icon">
          <Icon size={17} strokeWidth={1.9} />
        </span>
      </div>
      <strong className="kpi-card__value">{value}</strong>
      {detail ? <span className="kpi-card__detail">{detail}</span> : null}
    </article>
  );
}
