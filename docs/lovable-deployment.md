# Bull Media Ops V2 — Lovable Deployment

Este guia explica como usar Lovable com a V2 sem reescrever a arquitetura modular.

Importante: a documentacao atual do Lovable pode limitar a importacao direta de repositorios GitHub existentes. Por isso, o caminho recomendado para deploy externo da V2 e Vercel ou Netlify. Lovable deve ser tratado como camada visual/prototipacao, se aplicavel, e nao como origem de uma reescrita da plataforma.

## 1. Conectar o Repositorio

Repositorio:

```text
rooliveira2026/bull-media-ops-v2
```

No Lovable:

1. Crie um novo projeto separado da V1.
2. Se a importacao de repositorio GitHub existente estiver disponivel, conecte `bull-media-ops-v2`.
3. Use a branch `main` ou uma branch de preview.
4. Confirme que o projeto usa Vite/React.
5. Comando de build: `bun run build` ou `npm run build`, conforme runtime disponivel no Lovable.

Se o Lovable nao permitir importar o repo existente, use Vercel/Netlify para deploy e mantenha Lovable apenas para prototipar ajustes visuais que depois serao aplicados no repositorio.

Nao conectar este projeto ao repositorio da V1.

## 2. Variaveis de Ambiente

Para preview seguro em mock:

```bash
VITE_DATA_MODE=mock
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Para staging com Supabase:

```bash
VITE_DATA_MODE=supabase
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY
```

Nunca configurar `service_role` no Lovable.

## 3. Rodar em Mock

Use `VITE_DATA_MODE=mock`.

Comportamento esperado:

- app abre direto, sem login;
- Core, Media Ops, Central de Acoes e Social Ops usam mocks;
- nenhum Supabase remoto e necessario;
- ideal para ajustes visuais e preview.

## 4. Trocar para Supabase

Antes de trocar:

1. Criar projeto Supabase staging.
2. Aplicar migrations com `supabase db push`.
3. Criar usuario admin no Supabase Auth.
4. Rodar `select public.bootstrap_staging_admin('email@dominio.com');`.
5. Configurar `VITE_DATA_MODE=supabase`, URL e anon key no Lovable.

Comportamento esperado:

- app mostra tela de login;
- repositories usam Supabase;
- RLS limita leitura/escrita por profile, membership, role e client_access;
- se Supabase nao estiver configurado, o app nao deve exigir secrets no build.

## 5. Arquivos que o Lovable Nao Deve Alterar

Evitar alteracoes automaticas nestes arquivos sem sprint tecnica:

- `supabase/migrations/*`
- `src/shared/api/*`
- `src/modules/*/api/*`
- `src/auth/AuthProvider.tsx`
- `src/shared/config/env.ts`
- `src/shared/permissions/*`
- `src/shared/audit/*`
- `src/shared/types/**`
- `package.json`
- `bun.lock`
- `.gitignore`
- `.env.example`

Esses arquivos controlam arquitetura, dados, Auth, permissoes e contratos.

## 6. Areas que Podem Receber Ajuste Visual

Com baixo risco, o Lovable pode ajustar:

- `src/styles.css`
- componentes visuais em `src/shared/components/**`
- layout e espacamentos
- sidebar
- cards
- tabelas
- microcopy
- composicao visual de paginas em:
  - `src/modules/media-ops/ExecutiveOverview.tsx`
  - `src/modules/media-ops/MediaOpsPage.tsx`
  - `src/modules/media-ops/ActionsCenter.tsx`
  - `src/modules/social-ops/SocialOpsPage.tsx`
  - placeholders dos modulos planejados

Esses ajustes nao devem mudar contratos de dados, Auth, RLS, migrations ou repositories.

## 7. Como Evitar Reescrita da Arquitetura

Ao pedir alteracoes ao Lovable:

- pedir mudancas pequenas por modulo;
- manter repositories existentes;
- nao mover logica de permissao para componentes visuais;
- nao criar uma action central que retorna tudo;
- nao juntar Media Ops e Social Ops em um payload unico;
- nao adicionar Apps Script;
- nao adicionar integracoes externas sem sprint dedicada;
- nao colocar secrets no codigo;
- validar build apos cada alteracao.

Lovable nao deve recriar o projeto do zero, trocar o stack, duplicar repositories, criar payload unico ou mover regra de permissao para componentes visuais.

## 8. Checklist Antes de Publicar

- `VITE_DATA_MODE` configurado corretamente.
- Build verde.
- `.env` e `.env.local` nao versionados.
- `dist` e `node_modules` nao versionados.
- Migrations revisadas antes de `db push`.
- Nenhuma policy com `using (true)` ou `with check (true)` em tabelas sensiveis.
- V1 nao alterada.
