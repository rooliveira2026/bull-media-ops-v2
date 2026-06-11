# Bull Media Ops V2 — Supabase Staging Setup

Este guia prepara a V2 para rodar em um projeto Supabase staging real, sem alterar a V1.

## 1. Criar projeto Supabase

1. Acesse o Supabase e crie um projeto para staging.
2. Guarde em local seguro:

   * Project URL
   * Publishable key ou anon public key
   * Project Ref
   * Database Password
3. Não use chaves `service_role` no frontend.

## 2. Configurar ambiente local

Crie `.env.local` na raiz da V2:

```bash
VITE_DATA_MODE=supabase
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
```

Para voltar ao modo local mock:

```bash
VITE_DATA_MODE=mock
```

A variável `VITE_SUPABASE_ANON_KEY` deve receber somente uma chave pública, como `Publishable key` ou `anon public key`.

Nunca configure `service_role`, secret keys, JWT secret, database password ou connection string com senha em variáveis `VITE_`.

## 3. Aplicar migrations

No diretório `bull-media-ops-v2`:

```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase db push
```

As migrations aplicam:

* Core Platform
* Media Ops
* Action lifecycle
* Social Ops
* Persistência staging
* Auth trigger e RLS mínima segura
* Data Sources foundation
* Import batches
* Data quality logs
* First real import workflow

## 4. Criar usuário admin inicial

1. No Supabase Dashboard, crie um usuário em Authentication.
2. Confirme o e-mail, se a configuração do projeto exigir.
3. Depois que o usuário existir, rode no SQL Editor:

```sql
select public.bootstrap_staging_admin('admin@seudominio.com');
```

Esse comando:

* cria ou atualiza a organização `Bull Digital`;
* cria membership do usuário;
* atribui role `admin`;
* concede `client_access` manage para clientes existentes da organização.

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

Em `VITE_DATA_MODE=supabase`, a V2 mostra a tela de login.

Em `VITE_DATA_MODE=mock`, a V2 abre direto com dados mockados.

## 7. RLS aplicada nesta sprint

As policies não liberam escrita ampla para `anon`.

Regras principais:

* `profiles`: usuário vê o próprio profile; admin vê perfis da organização.
* `memberships`: membros veem memberships da organização; admin gerencia.
* `clients`: usuários veem clientes com `client_access`; admin vê todos da organização.
* `recommended_actions`: leitura por `client_access`; atualização para admin, gestor e analista.
* `action_executions`: leitura por `client_access`; inserção para admin, gestor e analista.
* `social_posts`: leitura por `client_access`; criação/edição para admin, gestor e analista.
* `social_post_approvals`: leitura por `client_access`; aprovação para admin e gestor.
* `audit_logs`: leitura por acesso ao cliente; inserção por usuário autenticado com acesso.
* `data_sources`: leitura conforme organização e acesso permitido.
* `import_batches`: leitura conforme organização e fonte de dados.
* `data_quality_logs`: leitura conforme organização, cliente e fonte de dados.

## 8. Fora do escopo desta sprint

* Google Ads API
* Meta Ads API
* GA4 API
* Instagram API
* LinkedIn API
* TikTok API
* Apps Script como backend da V2
* Publicação automática
* Conexão direta do frontend com planilhas
* Importação de payload bruto gigante da V1

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

## 10. Tabelas gravadas na primeira carga real

A primeira carga real pode gravar dados normalizados nas seguintes tabelas:

* `data_sources`
* `import_batches`
* `clients`
* `client_channels`
* `media_metrics_daily`
* `recommended_actions`
* `reports`
* `pdm_plans`
* `client_intelligence`
* `data_quality_logs`

O export real da V1 não deve ser commitado. A V2 deve consumir apenas os dados normalizados persistidos em staging.

## 11. Voltar para Mock

Para voltar o app ao modo mock local:

```bash
VITE_DATA_MODE=mock
```

Na Vercel, altere a variável:

```bash
VITE_DATA_MODE=mock
```

Depois faça redeploy.

## 12. Cuidados de segurança

Nunca commitar:

* `.env`
* `.env.local`
* service role key
* secret keys
* database password
* JWT secret
* connection string com senha
* export real da V1
* payload bruto de clientes
* dados sensíveis de campanhas, contas ou usuários

A `service_role` pode ser usada apenas em execução server-side controlada, job seguro ou terminal local confiável. Ela nunca deve ir para frontend, variável `VITE_`, Lovable ou ambiente público.
