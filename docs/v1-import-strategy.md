# Bull Media Ops V2 — V1 Import Strategy

## Por que a V1 é uma ponte temporária

A V1 continua sendo a ferramenta operacional atual e contém dados reais em Google Sheets/Apps Script. A V2 não deve se acoplar diretamente ao runtime da V1.

Por isso, a Sprint 6B usa uma ponte controlada:

1. exportar JSON da V1;
2. validar tamanho e formato;
3. normalizar linguagem, datas, moeda, canais e métricas;
4. agrupar ocorrências técnicas em recomendações-mãe;
5. persistir dados normalizados em Supabase staging.

## Por que APIs oficiais virão depois

Google Ads, Meta, GA4, LinkedIn e ClickUp exigem OAuth, escopos, contas, rate limits e regras próprias de governança. Essas integrações devem entrar fonte por fonte, depois da base de Data Sources estar estável.

## Como Rodar Importação em Staging

O importador runtime está em:

```text
scripts/import-v1/run-import-v1-export.mjs
```

Os normalizadores TypeScript de referência continuam em:

```text
src/importers/v1/
```

Fixture de forma:

```text
src/importers/v1/fixtures/sample-v1-export.json
```

Fluxo esperado para uma automação futura:

```text
JSON V1 -> normalizeV1Export -> Supabase import_batches -> tabelas normalizadas
```

Para a primeira carga real, seguir:

```text
docs/first-real-import-runbook.md
```

## Normalizadores

Funções disponíveis:

- `normalizeCurrency`
- `normalizeDateRange`
- `normalizeChannel`
- `normalizeClientObjective`
- `normalizePriority`
- `normalizeStatus`
- `normalizeMetricValue`
- `sanitizeClientLanguage`
- `groupRecommendedActions`
- `detectSourceType`
- `buildImportBatchSummary`

## Linguagem

Termos operacionais da V1 são suavizados antes de entrar na V2:

- “crítico” vira “atenção estratégica”
- “conta crítica” vira “em acompanhamento”
- “problema” vira “ponto de atenção”
- “falha” vira “ponto a validar”
- “desperdício” vira “oportunidade de eficiência”
- “tráfego irrelevante” vira “tráfego com menor aderência ao perfil ideal”

## Agrupamento de Ações

Regra:

```text
cliente + canal + tipo de recomendação + tema
```

Isso gera uma ação-mãe. Ocorrências técnicas ficam em `grouped_occurrences`.

Campos preparados:

- `action_group_id`
- `parent_action_id`
- `affected_items_count`
- `grouped_occurrences`
- `expected_impact`
- `effort_level`
- `decision_owner`
- `specialist_note`
- `final_decision`

## Reprocessamento sem Duplicar

Usar:

- `import_batches.checksum`
- `source_type`
- período
- client id
- action group id

Se o mesmo checksum já estiver completo, o job futuro deve pular ou rodar em modo de atualização idempotente.

## Tabelas Gravadas na Primeira Carga Real

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

O export real da V1 não deve ser commitado. A V2 deve consumir apenas os dados já normalizados no Supabase.

## Voltar para Mock

No `.env.local`:

```bash
VITE_DATA_MODE=mock
```

O frontend volta a usar dados mockados e não exige Supabase.
