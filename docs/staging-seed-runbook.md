# Supabase Staging Minimal Seed

Use este seed apenas no projeto Supabase staging da Bull Media Ops V2.

## Objetivo

Popular dados mínimos e fictícios para validar:

- Visão Executiva;
- Media Ops;
- Central de Ações;
- Integrações;
- Social Ops, Reports, PDM e Client Intelligence quando as tabelas existirem.

O seed não conecta Google Ads, Meta, LinkedIn, Apps Script ou qualquer API externa.

## Arquivo

```text
supabase/seed/staging_minimal_seed.sql
```

## Como aplicar

Opção recomendada:

1. Abrir o projeto Supabase staging.
2. Entrar em SQL Editor.
3. Colar o conteúdo de `supabase/seed/staging_minimal_seed.sql`.
4. Executar uma vez.
5. Recarregar a V2 em produção/staging após login.

Opção por terminal local seguro, se você tiver a connection string do staging apenas na sessão atual:

```bash
psql "$SUPABASE_STAGING_DB_URL" -f supabase/seed/staging_minimal_seed.sql
```

Não salvar `SUPABASE_STAGING_DB_URL` no repositório.

## Segurança

- O script é idempotente.
- O script não apaga dados existentes.
- O script usa dados fictícios/controlados para Bull Digital.
- Não usar `service_role` no frontend.
- Não colocar secrets em `.env`, `.env.local`, Vercel client env ou Lovable.

## Resultado esperado

Após rodar o seed:

- `clients` contém Bull Digital.
- `client_channels` contém Google Ads, Meta Ads e LinkedIn Ads.
- `media_campaigns` contém 3 campanhas controladas.
- `media_metrics_daily` contém 7 dias de métricas fictícias por canal.
- `recommended_actions` contém 3 ações estratégicas.
- `data_sources` contém Exportação controlada V1.
- `import_batches` contém 1 lote de exemplo.
- `data_quality_logs` contém 2 logs de qualidade.
- tabelas opcionais recebem registros mínimos somente se existirem.

## Validação visual

Depois de aplicar:

- Visão Executiva deixa de aparecer zerada.
- Media Ops mostra clientes, canais e métricas.
- Central de Ações mostra recomendações.
- Integrações mostra a fonte "Exportação controlada V1" e o batch de exemplo.

Se uma área continuar vazia, confirme se o usuário autenticado tem `client_access` para o cliente Bull Digital e se as policies RLS foram aplicadas.
