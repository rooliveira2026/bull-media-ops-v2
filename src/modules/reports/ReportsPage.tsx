import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileText, Send, SquarePen } from "lucide-react";
import { objectiveLabels, type ClientObjective } from "../../shared/api/client-config";
import { KpiCard } from "../../shared/components/KpiCard";
import { PageHeader } from "../../shared/components/PageHeader";
import { listReports, type ReportItem } from "./api/reports-repository";

function objectiveLabel(value: string) {
  return objectiveLabels[value as ClientObjective] ?? value ?? "Objetivo em validação";
}

export function ReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);

  useEffect(() => {
    listReports().then(setReports).catch(() => setReports([]));
  }, []);

  const stats = useMemo(() => ({
    total: reports.length,
    review: reports.filter((report) => report.status.includes("review") || report.status.includes("revis")).length,
    approved: reports.filter((report) => report.status.includes("approved") || report.status.includes("aprov")).length,
    sent: reports.filter((report) => report.status.includes("sent") || report.status.includes("enviado")).length,
  }), [reports]);

  return (
    <section>
      <PageHeader
        eyebrow="Relatórios"
        title="Central de relatórios"
        description="Estrutura consultiva para revisão, aprovação e envio de relatórios por cliente."
        meta="Operação"
      />
      <div className="kpi-grid kpi-grid--compact">
        <KpiCard label="Relatórios no ciclo" value={String(stats.total)} icon={FileText} tone="primary" />
        <KpiCard label="Em revisão" value={String(stats.review)} icon={SquarePen} tone="warning" />
        <KpiCard label="Aprovados" value={String(stats.approved)} icon={CheckCircle2} tone="success" />
        <KpiCard label="Enviados" value={String(stats.sent)} icon={Send} />
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
                return (
                  <tr key={report.id}>
                    <td><strong>{report.clientName}</strong></td>
                    <td>{report.period}</td>
                    <td>{report.type}</td>
                    <td>{objectiveLabel(report.clientObjective)}</td>
                    <td><span className="badge">{report.status}</span></td>
                    <td><small>{report.narrative}</small></td>
                    <td><div className="button-row"><button className="inline-action">Ver relatório</button><button className="inline-action">Editar narrativa</button><button className="inline-action">Aprovar</button><button className="inline-action">Exportar PDF</button></div></td>
                  </tr>
                );
              })}
              {reports.length === 0 ? (
                <tr><td colSpan={7}><small>Nenhum relatório carregado para os clientes acessíveis.</small></td></tr>
              ) : null}
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
