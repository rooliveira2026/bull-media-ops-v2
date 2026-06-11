# Bull Media Ops V2 — Vercel Env Setup

## Modo Mock

Use para preview seguro:

```bash
VITE_DATA_MODE=mock
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Comportamento:

- abre sem login real;
- usa repositories mock;
- mostra Data Sources preparados e importação V1 de exemplo;
- não conecta APIs externas.

## Modo Supabase

Use somente depois de aplicar migrations no Supabase staging e validar a primeira carga:

```bash
VITE_DATA_MODE=supabase
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY
```

Nunca configurar `service_role` na Vercel.

Variáveis que não devem ser configuradas na Vercel client:

- `SUPABASE_SERVICE_ROLE_KEY`
- credenciais Google Ads
- credenciais Meta
- credenciais GA4
- credenciais Instagram, LinkedIn ou TikTok
- URLs ou tokens de Apps Script

## Checklist

- `supabase db push` aplicado no projeto staging.
- usuário admin criado no Supabase Auth.
- `bootstrap_staging_admin` executado no SQL Editor.
- importação real executada a partir de ambiente local/server-side seguro.
- build Vercel verde.
- Data Sources mostra estado vazio elegante se ainda não houver importação.

## Primeira Importação Real

A importação V1 deve ser executada fora do browser e fora do build Vercel:

```bash
npm run import:v1 -- --file /caminho/seguro/export-v1.json --dry-run
npm run import:v1 -- --file /caminho/seguro/export-v1.json
```

Runbook completo:

```text
docs/first-real-import-runbook.md
```

## Sem Integrações Oficiais Nesta Sprint

As variáveis de Google Ads, Meta, GA4, LinkedIn e ClickUp ainda não devem ser configuradas.
