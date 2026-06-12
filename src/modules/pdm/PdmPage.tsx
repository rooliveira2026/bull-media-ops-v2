import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardList, PenLine, Sparkles } from "lucide-react";
import { KpiCard } from "../../shared/components/KpiCard";
import { PageHeader } from "../../shared/components/PageHeader";
import { currency } from "../../shared/utils/format";
import { listPdmPlans, type PdmItem } from "./api/pdm-repository";

const blocks = ["Plano recorrente mensal", "Oportunidades de evolução", "Itens aprovados para execução"];

export function PdmPage() {
  const [pdmItems, setPdmItems] = useState<PdmItem[]>([]);

  useEffect(() => {
    listPdmPlans().then(setPdmItems).catch(() => setPdmItems([]));
  }, []);

  const stats = useMemo(() => ({
    total: pdmItems.length,
    editing: pdmItems.filter((item) => item.status.includes("edit") || item.status.includes("review")).length,
    approved: pdmItems.filter((item) => item.status.includes("approved") || item.status.includes("aprov")).length,
    execution: pdmItems.filter((item) => item.status.includes("exec")).length,
  }), [pdmItems]);

  return (
    <section>
      <PageHeader
        eyebrow="PDM"
        title="Plano de Desenvolvimento de Mídia"
        description="Planejamento mensal com sugestões assistidas, revisão do especialista e decisão final documentada."
        meta="Planejamento"
      />
      <div className="kpi-grid kpi-grid--compact">
        <KpiCard label="Sugestões assistidas" value={String(stats.total)} icon={Sparkles} tone="primary" />
        <KpiCard label="Em edição" value={String(stats.editing)} icon={PenLine} tone="warning" />
        <KpiCard label="Aprovadas" value={String(stats.approved)} icon={CheckCircle2} tone="success" />
        <KpiCard label="Em execução" value={String(stats.execution)} icon={ClipboardList} />
      </div>
      <div className="pdm-board">
        {blocks.map((block) => (
          <div className="section-card" key={block}>
            <div className="section-card__header"><div><span>PDM</span><h2>{block}</h2></div></div>
            <ul className="simple-list">
              {pdmItems.filter((item) => item.block === block).map((item) => (
                <li key={item.id}>
                  <strong>{item.clientName}</strong>
                  <span>{item.objective} · {item.channels}</span>
                  <span>{item.action}</span>
                  <span>Hipótese: {item.hypothesis}</span>
                  <span>Impacto esperado: {item.impact}</span>
                  <span>Investimento adicional: {currency(item.investment)} · {item.benefit}</span>
                  <label className="field-stack"><span>Observação do especialista</span><textarea defaultValue={item.note} /></label>
                  <span>Decisão final: {item.decision}</span>
                </li>
              ))}
              {pdmItems.filter((item) => item.block === block).length === 0 ? (
                <li><span>Nenhum plano carregado nesta etapa.</span></li>
              ) : null}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
