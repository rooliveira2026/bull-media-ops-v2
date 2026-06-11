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

Use somente depois de aplicar migrations no Supabase staging:

```bash
VITE_DATA_MODE=supabase
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY
```

Nunca configurar `service_role` na Vercel.

## Checklist

- `supabase db push` aplicado no projeto staging.
- usuário admin criado no Supabase Auth.
- `bootstrap_staging_admin` executado no SQL Editor.
- dados de teste importados ou fixture reprocessada.
- build Vercel verde.
- Data Sources mostra estado vazio elegante se ainda não houver importação.

## Sem Integrações Oficiais Nesta Sprint

As variáveis de Google Ads, Meta, GA4, LinkedIn e ClickUp ainda não devem ser configuradas.
