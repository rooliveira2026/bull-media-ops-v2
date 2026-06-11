# Bull Media Ops V2 — Supabase Staging Setup

Este guia prepara a V2 para rodar em um projeto Supabase staging real, sem alterar a V1.

## 1. Criar projeto Supabase

1. Acesse o Supabase e crie um projeto para staging.
2. Guarde:
   - Project URL
   - anon public key
   - project ref
3. Não use chaves `service_role` no frontend.

## 2. Configurar ambiente local

Crie `.env.local` na raiz da V2:

```bash
VITE_DATA_MODE=supabase
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY
```

Para voltar ao modo local mock:

```bash
VITE_DATA_MODE=mock
```

## 3. Aplicar migrations

No diretório `bull-media-ops-v2`:

```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase db push
```

As migrations aplicam:

- Core Platform
- Media Ops
- Action lifecycle
- Social Ops
- Persistência staging
- Auth trigger e RLS mínima segura
<<<<<<< Updated upstream
=======
- Data Sources foundation
- Import batches
- Data quality logs
- First real import workflow
>>>>>>> Stashed changes

## 4. Criar usuário admin inicial

1. No Supabase Dashboard, crie um usuário em Authentication.
2. Confirme o e-mail, se a configuração do projeto exigir.
3. Depois que o usuário existir, rode no SQL Editor:

```sql
select public.bootstrap_staging_admin('admin@seudominio.com');
```

Esse comando:

- cria ou atualiza a organização `Bull Digital`;
- cria membership do usuário;
- atribui role `admin`;
- concede `client_access` manage para clientes existentes da organização.

Se ainda não houver clientes, crie clientes depois e rode o comando novamente.

## 5. Popular dados iniciais opcionais

Clientes podem ser criados pelo SQL Editor enquanto a UI administrativa completa ainda não existir:

```sql
insert into public.clients (
  organization_id,
  client_id,
  name,
  status,
  primary_objective,
  business_model
)
select
  id,
  'bull_digital',
  'Bull Digital',
  'active',
  'Operar a plataforma V2 em staging.',
  'Marketing Operations'
from public.organizations
where slug = 'bull-digital'
on conflict (organization_id, client_id) do update set
  name = excluded.name,
  status = excluded.status,
  primary_objective = excluded.primary_objective,
  business_model = excluded.business_model,
  updated_at = now();

select public.bootstrap_staging_admin('admin@seudominio.com');
```

## 6. Rodar a aplicação

```bash
bun run dev
```

Em `VITE_DATA_MODE=supabase`, a V2 mostra a tela de login. Em `mock`, a V2 abre direto com dados mockados.

## 7. RLS aplicada nesta sprint

As policies não liberam escrita ampla para `anon`.

Regras principais:

- `profiles`: usuário vê o próprio profile; admin vê perfis da organização.
- `memberships`: membros veem memberships da organização; admin gerencia.
- `clients`: usuários veem clientes com `client_access`; admin vê todos da organização.
- `recommended_actions`: leitura por `client_access`; atualização para admin, gestor e analista.
- `action_executions`: leitura por `client_access`; inserção para admin, gestor e analista.
- `social_posts`: leitura por `client_access`; criação/edição para admin, gestor e analista.
- `social_post_approvals`: leitura por `client_access`; aprovação para admin e gestor.
- `audit_logs`: leitura por acesso ao cliente; inserção por usuário autenticado com acesso.

## 8. Fora do escopo desta sprint

- Google Ads
- Meta Ads
- GA4
- Instagram API
- LinkedIn API
- TikTok API
- Apps Script
- Publicação automática
- PDM e relatórios reais
<<<<<<< Updated upstream
=======

## 9. Importação V1 controlada

A ponte V1 deve usar JSON exportado, normalizado e agrupado antes de persistir em Supabase.

Arquivos de referência:

```text
src/importers/v1/fixtures/sample-v1-export.json
src/importers/v1/import-v1-export.ts
src/importers/v1/normalizers.ts
scripts/import-v1/run-import-v1-export.mjs
docs/first-real-import-runbook.md
```

Não conectar o frontend diretamente ao Apps Script ou à planilha.

### Dry-run local

```bash
npm run import:v1 -- --file /caminho/seguro/export-v1.json --dry-run
```

### Execução em staging

Use `SUPABASE_SERVICE_ROLE_KEY` somente em terminal local seguro ou job server-side controlado:

```bash
export SUPABASE_URL=https://SEU-PROJETO.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE_KEY
npm run import:v1 -- --file /caminho/seguro/export-v1.json
```

Nunca configurar `SUPABASE_SERVICE_ROLE_KEY` no frontend, Vercel client env ou Lovable.
>>>>>>> Stashed changes
