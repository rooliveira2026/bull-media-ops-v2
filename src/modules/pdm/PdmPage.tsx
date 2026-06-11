import { CheckCircle2, ClipboardList, PenLine, Sparkles } from "lucide-react";
import { KpiCard } from "../../shared/components/KpiCard";
import { PageHeader } from "../../shared/components/PageHeader";
import { currency } from "../../shared/utils/format";

const pdmItems = [
  { client: "Intercity Batel", block: "Plano recorrente mensal", objective: "Ampliar reservas diretas", channels: "Google Ads, Meta Ads", action: "Escalar campanhas de alta intenção", hypothesis: "Reservas diretas crescem mantendo CPA controlado.", impact: "Maior volume com eficiência preservada.", investment: 8200, benefit: "Incremento estimado de reservas", status: "especialista aprova", note: "Validar disponibilidade comercial antes de enviar ao cliente.", decision: "Aguardando aprovação interna" },
  { client: "About Events", block: "Oportunidades de evolução", objective: "Qualificar demanda B2B", channels: "LinkedIn Ads, Google Ads", action: "Criar segmentação por cargo e intenção", hypothesis: "Públicos mais específicos elevam qualidade comercial.", impact: "Mais previsibilidade no funil.", investment: 6400, benefit: "Leads com maior aderência", status: "especialista edita", note: "Ajustar narrativa e volume esperado.", decision: "Em validação" },
  { client: "Bull Digital", block: "Itens aprovados para execução", objective: "Validar demanda de produto", channels: "LinkedIn Ads", action: "Testar oferta de diagnóstico executivo", hypothesis: "Mensagem orientada a operação melhora qualidade pós-clique.", impact: "Aprendizado de posicionamento.", investment: 3200, benefit: "Sinal comercial mais claro", status: "em execução", note: "Acompanhar sinais de reunião qualificada.", decision: "Aprovado" },
];

export function PdmPage() {
  return (
    <section>
      <PageHeader
        eyebrow="PDM"
        title="Plano de Desenvolvimento de Mídia"
        description="Planejamento mensal com sugestões assistidas, revisão do especialista e decisão final documentada."
        meta="Planejamento"
      />
      <div className="kpi-grid kpi-grid--compact">
        <KpiCard label="Sugestões assistidas" value="3" icon={Sparkles} tone="primary" />
        <KpiCard label="Em edição" value="1" icon={PenLine} tone="warning" />
        <KpiCard label="Aprovadas" value="1" icon={CheckCircle2} tone="success" />
        <KpiCard label="Em execução" value="1" icon={ClipboardList} />
      </div>
      <div className="pdm-board">
        {["Plano recorrente mensal", "Oportunidades de evolução", "Itens aprovados para execução"].map((block) => (
          <div className="section-card" key={block}>
            <div className="section-card__header"><div><span>PDM</span><h2>{block}</h2></div></div>
            <ul className="simple-list">
              {pdmItems.filter((item) => item.block === block).map((item) => (
                <li key={`${item.client}-${item.action}`}>
                  <strong>{item.client}</strong>
                  <span>{item.objective} · {item.channels}</span>
                  <span>{item.action}</span>
                  <span>Hipótese: {item.hypothesis}</span>
                  <span>Impacto esperado: {item.impact}</span>
                  <span>Investimento adicional: {currency(item.investment)} · {item.benefit}</span>
                  <label className="field-stack"><span>Observação do especialista</span><textarea defaultValue={item.note} /></label>
                  <span>Decisão final: {item.decision}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
