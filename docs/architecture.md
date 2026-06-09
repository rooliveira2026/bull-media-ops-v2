# Bull Media Ops Platform V2 — Architecture

## Visao Geral

Bull Media Ops Platform V2 e uma plataforma modular para operacoes de marketing, preparada para crescer em dominios independentes:

- Core Platform
- Media Ops
- Social Ops
- Creative Ops
- Reports
- PDM
- Client Intelligence
- AI Agents
- Integrations

A V2 e separada da V1 para evitar risco operacional e para corrigir aprendizados da versao anterior: payloads grandes, acoplamento entre abas, actions monoliticas, filtros misturados com UI e dependencia de Apps Script como backend principal.

## Principios

- Modularidade por dominio.
- Payloads pequenos e sob demanda.
- APIs/repositories separados por modulo.
- Supabase/Postgres como banco operacional.
- Auth e permissoes validadas server-side via RLS.
- Integracoes futuras como pipelines, nao como chamadas diretas espalhadas pela UI.
- Auditoria operacional para mudancas de status e execucoes.
- Modo mock preservado para desenvolvimento e Lovable preview.

## Camadas

### App e Shell

- `src/app/App.tsx`: roteamento interno simples.
- `src/shell/AppShell.tsx`: sidebar, topbar e area de conteudo.
- `src/auth`: sessao Supabase, login e logout.

### Shared

- `src/shared/api`: cliente Supabase e helpers compartilhados.
- `src/shared/config`: leitura de env e modo de dados.
- `src/shared/types`: contratos centrais.
- `src/shared/permissions`: helpers de permissao em mock/UI.
- `src/shared/audit`: criacao de eventos de auditoria.

### Modules

Cada modulo tem sua propria UI, tipos e repository/adapters quando necessario.

- `modules/core`: configuracoes, clientes, usuarios, fontes e roles.
- `modules/media-ops`: overview, performance e Central de Acoes.
- `modules/social-ops`: calendario, posts, pilares, aprovacao e auditoria.
- demais modulos: placeholders estruturais para evolucao.

## Dados

A V2 usa `VITE_DATA_MODE`:

- `mock`: repositories retornam dados locais e a UI abre sem login.
- `supabase`: repositories usam Supabase quando URL e anon key estao configuradas.

Se Supabase estiver indisponivel ou sem variaveis, os adapters preservam fallback mock para manter a experiencia local estavel.

## Supabase

Migrations atuais:

1. `20260609190000_core_platform.sql`
2. `20260609193000_media_ops.sql`
3. `20260609194500_action_lifecycle.sql`
4. `20260609200000_social_ops_base.sql`
5. `20260609210000_supabase_persistence_staging.sql`
6. `20260609220000_auth_rls_staging.sql`

O modelo cobre:

- organizations
- profiles
- clients
- memberships
- roles
- membership_roles
- client_access
- modules
- module_access
- data_sources
- integration_connections
- audit_logs
- recommended_actions
- action_executions
- social_pillars
- social_posts
- social_post_approvals
- social_calendar_items

## Auth e RLS

Sprint 5B adicionou:

- trigger `handle_new_auth_user` para criar `profiles`;
- helpers `current_organization_ids`, `current_client_ids`, `has_app_role`, `can_access_client`;
- bootstrap admin via `bootstrap_staging_admin(email)`;
- policies RLS sem escrita ampla para `anon`;
- login/logout basico no frontend em modo Supabase.

## Fora do Escopo Atual

- Aplicar migrations em Supabase remoto.
- Integracoes pagas ou sociais reais.
- OAuth Google/Meta/LinkedIn/TikTok.
- Publicacao automatica.
- Apps Script.
- PDM e relatorios reais.

## Como Evoluir

Novas features devem seguir este fluxo:

1. Criar tipos do dominio.
2. Criar repository mockavel.
3. Criar adapter Supabase quando houver schema.
4. Adicionar migration incremental.
5. Atualizar UI sem acoplar dados de outros modulos.
6. Validar build em mock e Supabase.
