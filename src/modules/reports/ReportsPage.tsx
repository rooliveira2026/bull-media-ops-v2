import { CheckCircle2, FileText, Send, SquarePen } from "lucide-react";
import { getClientConfig, objectiveLabels } from "../../shared/api/client-config";
import { KpiCard } from "../../shared/components/KpiCard";
import { PageHeader } from "../../shared/components/PageHeader";

const reports = [
  { id: "report_001", clientId: "client_intercity", client: "Intercity Batel", status: "aprovado", period: "Maio/2026", type: "executivo", narrative: "Reservas diretas em evolução com oportunidade de ampliar campanhas de maior intenção." },
  { id: "report_002", clientId: "client_about", client: "About Events", status: "em revisão", period: "Maio/2026", type: "mídia paga", narrative: "Captação com bons sinais de volume e pontos de qualificação comercial para validar." },
  { id: "report_003", clientId: "client_bull", client: "Bull Digital", status: "rascunho", period: "Maio/2026", type: "executivo", narrative: "Demanda em acompanhamento com foco em qualidade pós-clique e leitura de produto." },
];

export function ReportsPage() {
  return (
    <section>
      <PageHeader
        eyebrow="Relatórios"
        title="Central de relatórios"
        description="Estrutura consultiva para revisão, aprovação e envio de relatórios por cliente."
        meta="Operação"
      />
      <div className="kpi-grid kpi-grid--compact">
        <KpiCard label="Relatórios no ciclo" value={String(reports.length)} icon={FileText} tone="primary" />
        <KpiCard label="Em revisão" value="1" icon={SquarePen} tone="warning" />
        <KpiCard label="Aprovados" value="1" icon={CheckCircle2} tone="success" />
        <KpiCard label="Enviados" value="0" icon={Send} />
      </div>
      <div className="section-card">
        <div className="section-card__header">
          <div><span>Relatórios</span><h2>Lista por cliente</h2></div>
          <p>PDF real será conectado em sprint futura.</p>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Cliente</th><th>Período</th><th>Tipo</th><th>Objetivo</th><th>Status</th><th>Narrativa</th><th>Ações</th></tr></thead>
            <tbody>
              {reports.map((report) => {
                const objective = getClientConfig(report.clientId).objective;
                return (
                  <tr key={report.id}>
                    <td><strong>{report.client}</strong></td>
                    <td>{report.period}</td>
                    <td>{report.type}</td>
                    <td>{objectiveLabels[objective]}</td>
                    <td><span className="badge">{report.status}</span></td>
                    <td><small>{report.narrative}</small></td>
                    <td><div className="button-row"><button className="inline-action">Ver relatório</button><button className="inline-action">Editar narrativa</button><button className="inline-action">Aprovar</button><button className="inline-action">Exportar PDF</button></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="section-card report-preview">
        <div className="section-card__header">
          <div><span>Preview</span><h2>Estrutura do relatório</h2></div>
          <p>Modelo preparado para receber dados reais e narrativa validada pelo especialista.</p>
        </div>
        <div className="report-page">
          <strong>Resumo executivo</strong>
          <p>Performance consolidada do ciclo, principais aprendizados, recomendações ativas e próximos passos aprovados para execução.</p>
          <strong>Leitura consultiva</strong>
          <p>O relatório prioriza contexto, decisão e impacto esperado, evitando linguagem alarmista e mantendo clareza para o cliente.</p>
        </div>
      </div>
    </section>
  );
}
