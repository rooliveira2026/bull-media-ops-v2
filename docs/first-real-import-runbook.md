# Bull Media Ops V2 — First Real V1 Import Runbook

Este runbook descreve a primeira importação real da V1 para o Supabase staging da V2.

O objetivo é usar a V1 apenas como origem temporária controlada, sem acoplar o frontend da V2 ao Apps Script, Google Sheets ou payloads gigantes.

## Escopo

Incluído:

- export JSON controlado da V1;
- validação local do formato;
- normalização de clientes, canais, métricas e recomendações;
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

Use `src/importers/v1/fixtures/sample-v1-export.json` como referência de forma, não como dado real.

## Simulação

Antes de gravar no Supabase staging:

```bash
npm run import:v1 -- --file /caminho/seguro/export-v1.json --dry-run
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
- métricas: `organization_id + client_id + date + source_platform + channel + campaign_name`
- recomendações: `organization_id + action_group_id`
- relatórios: `organization_id + client_id + period_key + report_type`
- PDM: `organization_id + client_id + period_key + planned_action`

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
