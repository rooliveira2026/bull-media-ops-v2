# Bull Media Ops V2 — External Deployment

Este guia prepara a Bull Media Ops Platform V2 para deploy externo seguro antes de qualquer conexao com Lovable.

## Deploy Recomendado: Vercel

A V2 e uma aplicacao Vite/React. A Vercel detecta esse stack automaticamente.

Repositorio:

```text
rooliveira2026/bull-media-ops-v2
```

Configuracao recomendada:

- Framework preset: `Vite`
- Build command: `bun run build` ou `npm run build`
- Output directory: `dist`
- Install command: `bun install` ou instalacao padrao da Vercel
- Branch inicial: `main` ou uma branch de preview

`vercel.json` nao e obrigatorio para este projeto neste momento. O preset Vite ja publica `dist` corretamente.

## Deploy Alternativo: Netlify

Configuracao recomendada:

- Build command: `bun run build` ou `npm run build`
- Publish directory: `dist`
- Branch inicial: `main` ou uma branch de preview

Se o deploy precisar de fallback SPA em rotas futuras, criar `_redirects` ou `netlify.toml` em sprint propria. No estado atual, a navegacao e client-side interna e nao exige arquivo extra.

## Variaveis de Ambiente

### Modo Mock

Use para preview seguro sem Supabase remoto:

```bash
VITE_DATA_MODE=mock
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Comportamento esperado:

- app abre direto;
- login real nao e exigido;
- Core, Media Ops, Central de Acoes e Social Ops usam mocks/adapters locais;
- ideal para validar layout e navegacao.

### Modo Supabase

Use somente depois que o projeto Supabase staging estiver criado e com migrations aplicadas:

```bash
VITE_DATA_MODE=supabase
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY
```

Nunca configurar `service_role` no frontend, Vercel, Netlify ou Lovable.

Comportamento esperado:

- app mostra tela de login;
- Supabase Auth controla sessao;
- repositories usam Supabase;
- RLS limita acesso por `profiles`, `memberships`, `roles` e `client_access`.

## Checklist Pre-Deploy

- Build local verde com `tsc -b && vite build`.
- Build verde com `VITE_DATA_MODE=mock`.
- Build verde com `VITE_DATA_MODE=supabase` sem secrets.
- `.env` e `.env.local` nao versionados.
- `node_modules` e `dist` nao versionados.
- `.env.example` sem credenciais reais.
- Migrations em ordem cronologica.
- Nenhuma migration nova com `using (true)` ou `with check (true)`.
- Nenhum Apps Script.
- Nenhuma integracao Google Ads, Meta, GA4, Instagram, LinkedIn ou TikTok.
- Nenhuma publicacao automatica.
- V1 nao alterada.

## Checklist Pos-Deploy

### Em Mock

- Abrir a URL publicada.
- Confirmar que a plataforma abre sem login.
- Navegar por:
  - Visao Executiva
  - Media Ops
  - Central de Acoes
  - Social Ops
  - Configuracoes
- Confirmar que nao ha chamadas Supabase obrigatorias.

### Em Supabase

- Confirmar que a tela de login aparece.
- Entrar com usuario criado no Supabase Auth.
- Confirmar que `profiles` foi criado pelo trigger.
- Rodar `select public.bootstrap_staging_admin('email@dominio.com');` no SQL Editor para o admin inicial.
- Confirmar que o admin ve clientes, acoes e posts permitidos.
- Confirmar que usuario sem `client_access` nao ve dados de cliente.
- Confirmar que visualizador nao executa acoes operacionais.

## Arquivos Sensíveis

Nao alterar sem sprint tecnica:

- `supabase/migrations/*`
- `src/shared/api/*`
- `src/modules/*/api/*`
- `src/auth/AuthProvider.tsx`
- `src/shared/config/env.ts`
- `src/shared/permissions/*`
- `src/shared/audit/*`

## Fora de Escopo

- Aplicar Supabase remoto.
- Apps Script.
- Integracoes Google Ads, Meta, GA4, Instagram, LinkedIn ou TikTok.
- Publicacao automatica.
- PDM/Relatorios reais.
