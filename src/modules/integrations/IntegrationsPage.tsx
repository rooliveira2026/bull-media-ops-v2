import { Database, Plug } from "lucide-react";
import { PageHeader } from "../../shared/components/PageHeader";

const integrations = [
  { name: "Google Ads", category: "Mídia paga", status: "preparado", note: "Pipeline futuro para campanhas e métricas." },
  { name: "Meta Ads", category: "Mídia paga", status: "preparado", note: "Conexão futura para campanhas sociais pagas." },
  { name: "GA4", category: "Analytics", status: "aguardando credenciais", note: "Base para qualidade pós-clique e eventos." },
  { name: "LinkedIn Ads", category: "Mídia paga B2B", status: "preparado", note: "Planejado para ciclos B2B e demanda qualificada." },
  { name: "ClickUp", category: "Operações", status: "não conectado", note: "Pode sincronizar execução operacional em sprint futura." },
  { name: "Google Sheets legado", category: "Origem temporária", status: "em validação", note: "Somente como origem temporária de importação." },
  { name: "Supabase", category: "Banco operacional", status: "preparado", note: "Auth, RLS e repositories já estão estruturados." },
];

export function IntegrationsPage() {
  return (
    <section>
      <PageHeader
        eyebrow="Integrações"
        title="Conexões e pipelines"
        description="Área preparada para fontes de dados futuras, sem conexão externa ativa nesta etapa."
        meta="Preparado"
      />
      <div className="integration-grid">
        {integrations.map((integration) => (
          <article className="section-card integration-card" key={integration.name}>
            <div className="integration-card__icon">{integration.name === "Supabase" ? <Database size={18} /> : <Plug size={18} />}</div>
            <div>
              <span>{integration.category}</span>
              <h2>{integration.name}</h2>
              <p>{integration.note}</p>
              <span className="badge">{integration.status}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
