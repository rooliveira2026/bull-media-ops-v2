import { PageHeader } from "./PageHeader";

interface PlaceholderPageProps {
  module: string;
  title: string;
  description: string;
}

export function PlaceholderPage({ module, title, description }: PlaceholderPageProps) {
  return (
    <section>
      <PageHeader eyebrow={module} title={title} description={description} meta="Sprint 0" />
      <div className="empty-panel">
        <span>Base modular criada</span>
        <strong>{title}</strong>
        <p>Este módulo já possui rota e área reservada. Dados reais, endpoints e permissões serão conectados nas próximas sprints.</p>
      </div>
    </section>
  );
}
