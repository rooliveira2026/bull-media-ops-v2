# Bull Media Ops Platform V2

Bull Media Ops Platform V2 e a nova plataforma modular de Marketing Operations da Bull Digital.

Esta V2 foi criada separadamente da V1 para preservar a estabilidade da entrega atual e permitir uma evolucao mais segura, com dominios separados, payloads menores, Supabase como banco operacional e integracoes tratadas como pipelines futuros.

## Status

Checkpoint tecnico: Sprints 0 a 5B.

- Core Platform: clientes, usuarios, roles, permissoes e configuracoes.
- Media Ops: overview, performance por cliente e Central de Acoes.
- Social Ops: calendario editorial, posts, pilares, status, aprovacao e auditoria mockada/persistivel.
- Supabase: adapters, migrations, AuthProvider, login basico e RLS staging.
- Dados: modo `mock` por padrao, modo `supabase` preparado por variaveis de ambiente.

Ainda nao aplicado:

- Migrations em Supabase remoto.
- Conexao Lovable.
- Integracoes Google Ads, Meta, GA4, Instagram, LinkedIn ou TikTok.
- Apps Script.
- Publicacao automatica.
- PDM e relatorios reais.

## Como Rodar

Instalar dependencias:

```bash
bun install
```

Rodar localmente em mock:

```bash
bun run dev
```

Build:

```bash
bun run build
```

## Variaveis de Ambiente

Use `.env.local` para ambiente local. Nao versionar secrets.

```bash
VITE_DATA_MODE=mock
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Modos:

- `VITE_DATA_MODE=mock`: usa dados locais e nao exige Supabase.
- `VITE_DATA_MODE=supabase`: usa Auth/Supabase quando `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` existem.

## Estrutura

```text
src/
  app/
  auth/
  shell/
  shared/
    api/
    components/
    config/
    permissions/
    types/
    utils/
  modules/
    core/
    media-ops/
    social-ops/
    creative-ops/
    reports/
    pdm/
    integrations/
    client-intelligence/
    ai-agents/
supabase/
  migrations/
docs/
```

## Documentacao

- `docs/architecture.md`
- `docs/supabase-staging-setup.md`
- `docs/lovable-deployment.md`

## Regras de Evolucao

- Nao alterar a V1 neste repositorio/processo.
- Nao recriar o padrao de payload gigante da V1.
- Nao adicionar uma action monolitica para tudo.
- Nao conectar integracoes externas sem sprint dedicada.
- Nao colocar secrets em arquivos versionados.
- Manter repositories mockaveis e contratos por dominio.
