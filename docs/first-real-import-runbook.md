# Bull Media Ops V2 — First Real V1 Import Runbook

Este runbook descreve a primeira importação real da V1 para o Supabase staging da V2.

O objetivo é usar a V1 apenas como origem temporária controlada, sem acoplar o frontend da V2 ao Apps Script, Google Sheets ou payloads gigantes.

## Escopo

Incluído:

- export JSON controlado da V1;
- validação local do formato;
- normalização de clientes, canais, métricas e recomendações;
- persistência de campanhas de mídia;
- agrupamento de ocorrências técnicas em recomendações-mãe;
- persistência em Supabase staging;
- registro de batch, checksum e logs de qualidade.

Fora do escopo:

- Apps Script como backend da V2;
- integração oficial Google Ads, Meta, GA4, Instagram, LinkedIn ou TikTok;
- publicação automática;
- alteração da V1;
- conexão direta da UI com planilhas.

## Pré-requisitos

1. Migrations aplicadas no Supabase staging.
2. Organização inicial criada.
3. Usuário admin criado no Supabase Auth.
4. `bootstrap_staging_admin` executado para o admin.
5. Export JSON da V1 salvo localmente em um arquivo fora do repositório ou em uma pasta temporária.

Nunca versionar o export real da V1.

## Variáveis Locais

Configure apenas no terminal local seguro:

```bash
export SUPABASE_URL="https://SEU-PROJETO.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="SUA_SERVICE_ROLE_KEY"
```

`SUPABASE_SERVICE_ROLE_KEY` não deve ir para `.env`, `.env.local`, Vercel, Lovable ou frontend.

## Formato Esperado do Export

Campos raiz obrigatórios:

```json
{
  "export_id": "v1-export-2026-06-11",
  "source": "legacy_v1_export",
  "organization_id": "uuid-da-organizacao",
  "period": {
    "start": "2026-06-01",
    "end": "2026-06-30"
  },
  "clients": [],
  "metrics": [],
  "recommended_actions": []
}
```

Campos opcionais aceitos:

- `reports`
- `pdm`
- `client_intelligence`

Use `supabase/seed/examples/v1-export-sample.json` como referência de forma, não como dado real.

### Contrato mínimo por bloco

`clients`:

- `id`: identificador estável do cliente na V1.
- `name`: nome do cliente.
- `objective`: objetivo principal.
- `channels`: lista de canais usados pelo cliente.
- opcionais: `status`, `business_model`, `client_type`, `currency`.

`campaigns`:

- `client_id`: mesmo identificador usado em `clients[].id`.
- `id` ou `external_campaign_id`: identificador da campanha no export.
- `channel`: canal de mídia.
- `campaign_name`: nome da campanha.
- opcional: `status`.

Se `campaigns` não vier no export, o importador deriva campanhas a partir de `metrics`.

`metrics`:

- `client_id`.
- `channel`.
- `date`.
- `campaign_name`.
- métricas numéricas: `cost`, `clicks`, `impressions`, `conversions`, `revenue`.
- opcional: `campaign_id` ou `external_campaign_id` para vincular à campanha.

`recommended_actions`:

- `client_id`.
- `channel`.
- `title`.
- `description`.
- `recommendation_type`.
- `theme`.
- `priority`.
- `status`.
- `expected_impact`.
- `occurrence`.
- opcionais: `client_name`, `effort_level`, `decision_owner`, `specialist_note`, `final_decision`.

`data_sources`, `import_batches` e `data_quality_logs`:

- não precisam vir no JSON.
- o script cria `data_sources` e `import_batches`.
- o script gera `data_quality_logs` para avisos de agrupamento e registros ignorados.

Blocos opcionais:

- `reports`: `client_id`, `period`, `type`, `status`, `narrative`.
- `pdm`: `client_id`, `period`, `cycle_objective`, `planned_action`, `status`.
- `client_intelligence`: `client_id`, `insight_type`, `content` ou `learning`.

## Simulação

Antes de gravar no Supabase staging:

```bash
npm run import:v1 -- --file /caminho/seguro/export-v1.json --dry-run
```

Para validar apenas o exemplo versionado:

```bash
npm run import:v1:dry-run
```

Resultado esperado:

- checksum calculado;
- total de registros recebidos;
- clientes detectados;
- métricas detectadas;
- recomendações agrupadas;
- avisos de qualidade, se existirem.

Se a simulação falhar, ajuste o export antes de gravar.

## Execução Real

Depois da simulação:

```bash
npm run import:v1 -- --file /caminho/seguro/export-v1.json
```

O script grava:

- `data_sources`
- `import_batches`
- `clients`
- `client_channels`
- `media_campaigns`
- `media_metrics_daily`
- `recommended_actions`
- `reports`
- `pdm_plans`
- `client_intelligence`
- `data_quality_logs`

## Idempotência

O script calcula checksum SHA-256 do arquivo. Se o mesmo arquivo já tiver sido importado com status concluído, a nova execução é ignorada.

As principais tabelas usam chaves estáveis para upsert:

- clientes: `organization_id + client_id`
- canais: `organization_id + client_id + channel`
- campanhas: procura por `organization_id + client_id + source_platform + channel + campaign_name` antes de inserir
- métricas: `organization_id + client_id + date + source_platform + channel + campaign_name`
- recomendações: `organization_id + action_group_id`
- relatórios: `organization_id + client_id + period_key + report_type`
- PDM: `organization_id + client_id + period_key + planned_action`
- inteligência do cliente: evita duplicar o mesmo `source_id + insight_type + content`

## Checklist da Primeira Importação Real

Antes:

- Fazer backup lógico do Supabase staging.
- Confirmar que as migrations estão aplicadas.
- Confirmar que o usuário Rodrigo tem acesso à organização e aos clientes.
- Salvar o export real fora do repositório.
- Confirmar que o JSON não contém tokens, chaves ou dados sensíveis desnecessários.

Simulação:

- Rodar `npm run import:v1 -- --file /caminho/seguro/export-v1.json --dry-run`.
- Validar `recordsReceived`, `clients`, `campaigns`, `metrics` e `groupedActions`.
- Revisar `warnings`.
- Corrigir o arquivo antes da importação se houver contagem inesperada.

Execução:

- Rodar `npm run import:v1 -- --file /caminho/seguro/export-v1.json`.
- Rodar ou confirmar `bootstrap_staging_admin` se novos clientes foram criados e precisarem de acesso.
- Não rodar com service role em navegador, Vercel, Lovable ou frontend.

Validação:

- Conferir `import_batches`.
- Conferir `data_quality_logs`.
- Conferir contagens de `clients`, `media_campaigns`, `media_metrics_daily` e `recommended_actions`.
- Acessar a V2 autenticada e validar Visão Executiva, Media Ops, Central de Ações e Integrações.

## Validação Pós-Importação

No Supabase SQL Editor:

```sql
select status, records_received, records_imported, records_skipped, warnings
from public.import_batches
order by started_at desc
limit 5;
```

```sql
select severity, entity_type, message
from public.data_quality_logs
order by created_at desc
limit 20;
```

```sql
select count(*) from public.clients;
select count(*) from public.media_metrics_daily;
select count(*) from public.recommended_actions;
```

## Segurança

- Use service role apenas no script local ou job server-side controlado.
- Nunca exponha service role no navegador.
- Mantenha `VITE_DATA_MODE=mock` para previews sem Supabase.
- Use `VITE_DATA_MODE=supabase` apenas com URL e anon key públicas.
- Não commitar export real, `.env`, `.env.local`, `dist` ou `node_modules`.

## Rollback Operacional

Se a primeira carga precisar ser descartada em staging, prefira criar um novo export corrigido e reprocessar. Exclusões manuais devem ser feitas apenas em staging, com backup, filtrando por `source_id`, `checksum` ou `import_batch`.

Não usar esse processo em produção até haver rotina formal de backup e aprovação.
