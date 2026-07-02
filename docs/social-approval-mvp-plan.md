# Bull Media Ops V2.1 - Social Approval MVP

## Objetivo

Colocar em operacao uma ferramenta de aprovacao de posts para clientes dentro da Bull Media Ops V2, reaproveitando Supabase/Auth, organizacoes, clientes e o modulo Social Ops existente.

Esta sprint evolui a V2 atual. Nao cria V3, nao altera a V1, nao adiciona publicacao automatica e nao reintroduz mock em producao.

## Diagnostico das tabelas Social Ops atuais

### Tabelas existentes

| Tabela | Estado atual | Observacao |
| --- | --- | --- |
| `social_pillars` | Existe | Guarda pilares editoriais por organizacao. Pode ser reaproveitada sem mudanca obrigatoria. |
| `social_posts` | Existe | Guarda post, cliente, pilar, canal, formato, data, status, approval_status, copy, responsavel e metadata. Precisa de campos adicionais para URL da arte, versao e workflow externo. |
| `social_post_approvals` | Existe | Guarda status, nota, profile_id e data. Hoje cobre aprovacao interna autenticada, mas nao guarda aprovador externo, decisao por token, versao aprovada ou e-mail/nome do cliente. |
| `social_audit_events` | Existe | Guarda eventos por post com profile_id e metadata. Pode ser reaproveitada para historico simples. Precisa aceitar evento externo sem profile_id quando vier de link seguro. |
| `social_calendar_items` | Existe | Guarda itens de calendario ligados a post. Pode ser mantida, mas o MVP pode derivar calendario diretamente de `social_posts.scheduled_date` para reduzir duplicidade. |
| `social_content_pillars` | View existente | Alias de `social_pillars`. Nao precisa ser expandida no MVP. |
| `social_approvals` | View existente | Alias de `social_post_approvals`. Nao precisa ser expandida no MVP. |

### Lacunas atuais

| Lacuna | Impacto |
| --- | --- |
| Status atuais nao batem com o workflow do MVP. | A UI precisa operar com `draft`, `internal_review`, `sent_for_approval`, `changes_requested`, `approved`, `scheduled`, `published`, `cancelled`. |
| Falta URL da arte. | O cliente nao consegue revisar a arte sem campo dedicado. |
| Falta versionamento simples do post. | A aprovacao precisa registrar a versao aprovada. |
| Falta token seguro de aprovacao. | O cliente externo ainda depende de login interno ou fluxo manual. |
| Falta comentario separado de aprovacao. | Comentarios internos e externos precisam ficar consultaveis no historico. |
| `listSocialClients()` retorna vazio em modo Supabase. | A pagina interna precisa listar clientes reais com acesso do usuario. |
| Permissoes da UI ainda usam mocks. | O MVP deve usar perfil real no Supabase para operacao interna. |
| Nao ha pagina externa de aprovacao. | Criterio central do MVP ainda nao existe. |

## Proposta de schema e migrations minimas

Criar uma migration incremental, sem `delete`, `truncate`, `drop` destrutivo e sem alterar dados existentes.

### Alteracoes em `social_posts`

Adicionar colunas:

| Coluna | Tipo | Motivo |
| --- | --- | --- |
| `asset_url` | `text` | Link da arte/preview que o cliente vai revisar. |
| `version` | `integer default 1` | Versao atual do post. Incrementa quando copy, arte, data, canal ou formato forem alterados apos envio/aprovacao. |
| `sent_for_approval_at` | `timestamptz` | Registro do envio ao cliente. |
| `approved_at` | `timestamptz` | Registro rapido da aprovacao final. |
| `approved_by_name` | `text` | Nome informado pelo aprovador externo ou nome do usuario interno. |
| `approved_by_email` | `text` | E-mail informado pelo aprovador externo ou e-mail do usuario interno. |

Status recomendado em `social_posts.status`:

- `draft`
- `internal_review`
- `sent_for_approval`
- `changes_requested`
- `approved`
- `scheduled`
- `published`
- `cancelled`

Decisao: reduzir uso de `approval_status` no produto novo. Para compatibilidade, manter a coluna, mas tratar `status` como fonte operacional principal do MVP. `approval_status` pode continuar sendo atualizado como campo derivado durante a transicao.

### Nova tabela `social_approval_requests`

Tabela para links seguros por solicitacao de aprovacao.

Campos propostos:

| Coluna | Tipo | Motivo |
| --- | --- | --- |
| `id` | `uuid primary key default gen_random_uuid()` | Identificador interno. |
| `organization_id` | `uuid not null references organizations(id)` | Escopo da organizacao. |
| `client_id` | `uuid not null references clients(id)` | Escopo do cliente. |
| `post_id` | `uuid not null references social_posts(id)` | Post solicitado. |
| `token_hash` | `text not null unique` | Hash do token. O token bruto nao deve ser salvo. |
| `status` | `text not null default 'active'` | `active`, `used`, `expired`, `revoked`. |
| `expires_at` | `timestamptz not null` | Expiracao obrigatoria. |
| `created_by` | `uuid references profiles(id)` | Usuario interno que enviou. |
| `created_at` | `timestamptz default now()` | Auditoria. |
| `used_at` | `timestamptz` | Quando houve decisao final. |
| `metadata` | `jsonb default '{}'` | Campos auxiliares sem migration nova. |

Indices:

- `social_approval_requests_post_idx` em `post_id`.
- `social_approval_requests_client_idx` em `client_id`.
- `social_approval_requests_token_hash_idx` unique em `token_hash`.
- `social_approval_requests_expires_idx` em `expires_at`.

### Nova tabela `social_post_comments`

Tabela para comentarios internos e externos.

Campos propostos:

| Coluna | Tipo | Motivo |
| --- | --- | --- |
| `id` | `uuid primary key default gen_random_uuid()` | Identificador. |
| `organization_id` | `uuid not null references organizations(id)` | Escopo. |
| `client_id` | `uuid not null references clients(id)` | Escopo. |
| `post_id` | `uuid not null references social_posts(id)` | Relacao com post. |
| `approval_request_id` | `uuid references social_approval_requests(id)` | Quando comentario vier do link externo. |
| `profile_id` | `uuid references profiles(id)` | Autor interno autenticado, quando houver. |
| `author_name` | `text` | Nome do cliente ou usuario. |
| `author_email` | `text` | E-mail do cliente ou usuario. |
| `visibility` | `text not null default 'internal'` | `internal` ou `external`. |
| `body` | `text not null` | Comentario. |
| `created_at` | `timestamptz default now()` | Historico. |

Indices:

- `social_post_comments_post_idx` em `post_id`.
- `social_post_comments_client_idx` em `client_id`.
- `social_post_comments_request_idx` em `approval_request_id`.

### Ajuste em `social_post_approvals`

Adicionar colunas:

| Coluna | Tipo | Motivo |
| --- | --- | --- |
| `approval_request_id` | `uuid references social_approval_requests(id)` | Vincular decisao ao link usado. |
| `approver_name` | `text` | Nome do aprovador externo. |
| `approver_email` | `text` | E-mail do aprovador externo. |
| `decision` | `text` | `approved` ou `changes_requested`. |
| `approved_version` | `integer` | Versao aprovada ou avaliada. |
| `metadata` | `jsonb default '{}'` | Dados auxiliares. |

Manter `status` e `note` por compatibilidade com o codigo atual.

### RLS e acesso externo por token

Recomendacao segura para o MVP:

1. Time interno autenticado:
   - Usa RLS atual baseada em `can_access_client(client_id)` e roles.
   - `admin`, `gestor`, `analista`: criar/editar/enviar posts.
   - `visualizador`: leitura.

2. Cliente externo via link:
   - Nao usar `service_role` no frontend.
   - Nao liberar policies amplas com `using (true)`.
   - Criar uma funcao RPC `get_social_approval_request(p_token text)` com `security definer` que:
     - gera hash do token recebido;
     - valida existencia, status `active` e `expires_at > now()`;
     - retorna somente os campos necessarios do post, cliente, comentarios externos e status da solicitacao.
   - Criar uma funcao RPC `submit_social_approval_decision(p_token text, p_decision text, p_author_name text, p_author_email text, p_note text)` com `security definer` que:
     - valida token e expiracao;
     - grava comentario externo, aprovacao e auditoria;
     - atualiza `social_posts.status`;
     - atualiza `social_post_approvals`;
     - marca request como `used` apenas quando decisao for final;
     - nao retorna dados de outros clientes.

3. Token:
   - Gerado no frontend interno com `crypto.getRandomValues` ou via RPC.
   - Salvar somente `token_hash`.
   - Expiracao sugerida: 14 dias.
   - Link externo: `/approval/social/:token` ou `/?approval_token=...` dependendo da abordagem de roteamento escolhida.

## Mapa de telas

### 1. Social Ops interno

Evoluir `SocialOpsPage` para conter:

- Cabecalho e KPIs:
  - posts no periodo;
  - em revisao interna;
  - enviados ao cliente;
  - ajustes solicitados;
  - aprovados;
  - agendados.
- Filtros:
  - cliente;
  - status;
  - canal;
  - responsavel;
  - periodo;
  - busca.
- Calendario mensal:
  - agrupamento por dia;
  - badge de status;
  - clique abre detalhe do post.
- Lista/tabela de posts:
  - cliente;
  - titulo;
  - canal;
  - formato;
  - data prevista;
  - responsavel;
  - status;
  - ultima decisao.
- Acoes:
  - criar post;
  - editar post;
  - enviar para aprovacao;
  - copiar link de aprovacao;
  - marcar como agendado;
  - marcar como publicado;
  - cancelar.

### 2. Modal/drawer interno de post

Abas:

- Resumo:
  - cliente, titulo, canal, formato, data, responsavel e status.
- Conteudo:
  - copy;
  - URL da arte;
  - preview/link clicavel.
- Aprovação:
  - status da solicitacao;
  - link seguro;
  - expiracao;
  - ultima decisao;
  - aprovador.
- Comentarios:
  - internos;
  - externos.
- Historico:
  - criado;
  - editado;
  - enviado;
  - comentario;
  - ajuste solicitado;
  - aprovado;
  - agendado;
  - publicado.

### 3. Pagina externa de aprovacao

Tela limpa, sem sidebar.

Conteudo:

- Logo/nome Bull Media Ops.
- Nome do cliente.
- Titulo do post.
- Canal, formato e data prevista.
- Copy.
- Link/preview da arte.
- Campo para nome/e-mail do aprovador.
- Campo de comentario.
- Botao `Aprovar`.
- Botao `Solicitar ajustes`.
- Estados:
  - carregando;
  - token expirado;
  - solicitacao ja respondida;
  - decisao registrada;
  - erro de configuracao seguro.

## Fluxo operacional

1. Time interno cria post em `draft`.
2. Time edita campos minimos: cliente, titulo, canal, formato, copy, asset_url, data prevista e responsavel.
3. Time move para `internal_review`.
4. Time envia para cliente:
   - cria `social_approval_requests`;
   - muda status para `sent_for_approval`;
   - registra auditoria `sent_for_approval`;
   - disponibiliza link seguro para copiar.
5. Cliente abre link externo.
6. Cliente aprova ou solicita ajustes:
   - grava `social_post_comments`;
   - grava `social_post_approvals`;
   - atualiza `social_posts.status` para `approved` ou `changes_requested`;
   - registra auditoria;
   - salva nome/e-mail/versao.
7. Time ve status atualizado na pagina interna.
8. Time agenda/publica manualmente fora da plataforma e marca status como `scheduled` ou `published`.

## Fluxo de permissoes

| Perfil | Pode ver Social Ops | Criar/editar post | Enviar aprovacao | Aprovar internamente | Agendar/publicar manualmente | Ver link externo |
| --- | --- | --- | --- | --- | --- | --- |
| Admin | Sim | Sim | Sim | Sim | Sim | Sim |
| Gestor | Sim | Sim | Sim | Sim | Sim | Sim |
| Analista | Sim | Sim | Sim | Nao, exceto se politica permitir depois | Sim | Sim |
| Visualizador | Sim | Nao | Nao | Nao | Nao | Nao |
| Cliente externo | Apenas link recebido | Nao | Nao | Pode aprovar/solicitar ajuste no proprio link | Nao | Apenas posts do token |

Decisao recomendada: no MVP, aprovacao externa por cliente nao exige login Supabase, mas exige token com hash, expiracao e RPC restrita. Login de cliente pode ficar para etapa posterior.

## Lista de arquivos que provavelmente serao alterados

### Banco/Supabase

- `supabase/migrations/20260702090000_social_approval_mvp.sql`

### Tipos e API

- `src/modules/social-ops/types.ts`
- `src/modules/social-ops/api/social-ops-repository.ts`
- Possivel novo arquivo: `src/modules/social-ops/api/social-approval-public-repository.ts`

### UI interna

- `src/modules/social-ops/SocialOpsPage.tsx`
- Possivel novo arquivo: `src/modules/social-ops/components/SocialPostForm.tsx`
- Possivel novo arquivo: `src/modules/social-ops/components/SocialPostDrawer.tsx`
- Possivel novo arquivo: `src/modules/social-ops/components/SocialCalendarMonth.tsx`

### UI externa

- Possivel novo arquivo: `src/modules/social-ops/SocialApprovalPage.tsx`
- `src/app/App.tsx` para detectar rota/token externo antes do AppShell autenticado.

### Estilos

- `src/styles.css`

### Documentacao

- `docs/social-approval-mvp-plan.md`
- Futuro runbook: `docs/social-approval-runbook.md`

## Decisoes tecnicas recomendadas

| Tema | Decisao |
| --- | --- |
| Roteamento | Como a V2 ainda usa estado local em `App.tsx`, usar deteccao simples de URL para pagina externa no MVP. Exemplo: `window.location.pathname.startsWith('/approval/social/')`. Router completo pode ficar para depois. |
| Status | Usar `social_posts.status` como fonte principal do workflow V2.1. Manter `approval_status` por compatibilidade temporaria. |
| Calendario | Derivar de `social_posts.scheduled_date` no MVP. Evitar duplicar escrita em `social_calendar_items` ate haver necessidade real. |
| Link seguro | Token bruto apenas no link. Banco armazena hash. Expiracao obrigatoria. |
| Cliente externo | Sem login no MVP, mas tambem sem acesso direto a tabelas. Usar RPC restrita. |
| Mock | Permitido apenas em desenvolvimento/mock mode. Producao sempre Supabase. |
| Publicacao | Manual fora da plataforma; V2 apenas registra status `scheduled`/`published`. |

## Riscos

| Risco | Mitigacao |
| --- | --- |
| Token externo vazar. | Expiracao curta, hash no banco, escopo por post/cliente e possibilidade de revogar request. |
| RLS ficar ampla demais. | Nao criar `using (true)`. Usar RPCs `security definer` com validacao de token e retorno limitado. |
| Duplicidade entre `status` e `approval_status`. | Tratar `status` como fonte principal e atualizar `approval_status` apenas por compatibilidade. |
| Cliente acessar post errado. | RPC deve filtrar exclusivamente pelo token hash e retornar somente aquele post/request. |
| Workflow ficar grande demais. | MVP deve cobrir criar, editar, enviar, comentar, aprovar/ajustar e historico. Publicacao automatica fica fora. |
| UI interna continuar com permissoes mockadas. | Trocar para permissoes derivadas da sessao/membership antes de liberar em producao. |

## Decisoes abertas

1. O link externo deve ser por path (`/approval/social/:token`) ou query string (`/?approval_token=...`)?
2. O token deve aprovar um post por vez ou um lote mensal de posts do cliente?
3. O cliente precisa informar nome e e-mail sempre ou podemos pre-preencher no metadata da solicitacao?
4. Depois da primeira decisao, o link deve expirar imediatamente ou permitir comentarios adicionais ate a data de expiracao?
5. Analista pode enviar para aprovacao sozinho ou precisa de gestor em `internal_review`?

## Sequencia sugerida para implementacao

### Sprint 2.1A - Banco e contratos

- Criar migration minima.
- Criar tipos novos.
- Criar repositories internos e publicos.
- Criar RPCs para token.
- Validar RLS sem expor tabelas publicamente.

### Sprint 2.1B - UI interna

- Criar/editar post.
- Calendario mensal.
- Filtros.
- Enviar para aprovacao.
- Copiar link seguro.
- Historico no drawer.

### Sprint 2.1C - UI externa

- Pagina externa por token.
- Aprovar/solicitar ajustes.
- Comentarios externos.
- Estados de expirado/respondido.

### Sprint 2.1D - Validacao operacional

- Teste com cliente real em staging.
- Ajustes de copy, estados vazios e historico.
- Checklist de uso interno.
- Preparacao para producao.

## Criterios de aceite do MVP

- Time cria post para cliente real.
- Time adiciona copy, canal, formato, data prevista, responsavel e URL da arte.
- Time envia para aprovacao.
- Link seguro e expiravel e gerado.
- Cliente acessa link e ve somente o post daquele token.
- Cliente aprova ou solicita ajustes com comentario.
- Decisao aparece na tela interna apos recarregar ou atualizar estado.
- Historico registra criacao, envio, comentario, ajuste/aprovacao, agendamento e publicacao manual.
- Post aparece no calendario com status atualizado.
- Fluxo funciona em Supabase staging/producao.
- Nenhum mock e usado em producao.

