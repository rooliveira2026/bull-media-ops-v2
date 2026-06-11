# Bull Media Ops V2 — Data Sources Architecture

## Objetivo

A camada de Data Sources prepara a V2 para receber dados de múltiplas origens sem recriar um payload central ou acoplar o frontend a uma origem específica.

Fontes previstas:

- `legacy_v1_export`
- `google_ads_api`
- `meta_ads_api`
- `ga4_api`
- `linkedin_ads_api`
- `clickup_api`
- `manual_input`

Na Sprint 6B, somente `legacy_v1_export` via JSON/fixture fica implementado como ponte controlada. APIs oficiais permanecem preparadas para sprints futuras.

## Componentes

### data_sources

Catálogo operacional das origens. Guarda tipo, status, conta, moeda, timezone, última sincronização e metadata.

### import_batches

Histórico idempotente de importação. Cada execução registra recebidos, importados, ignorados, warnings, errors e checksum.

### data_quality_logs

Registro consultivo de validações, pontos de atenção e decisões de normalização.

## Princípios

- Nenhum payload bruto gigante entra nas telas.
- Cada origem passa por normalização.
- Reprocessamento deve usar checksum/import batch para evitar duplicação.
- O frontend consome repositories por domínio, não a origem bruta.
- APIs oficiais podem substituir a ponte V1 sem reescrever UI.

## Status

Sprint 6B adiciona:

- migration incremental de Data Sources;
- repository mock/Supabase para a tela de Integrações;
- normalizadores;
- fixture JSON da V1;
- agrupamento de recomendações por cliente, canal, tipo e tema.

## Segurança

As policies novas não usam `using (true)` nem `with check (true)`.

Leitura e escrita dependem de usuário autenticado, organização acessível e perfil operacional.
