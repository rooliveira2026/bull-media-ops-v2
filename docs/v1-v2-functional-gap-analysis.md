# Bull Media Ops V1 x V2 - Analise de Paridade Funcional

## Contexto

Este documento compara a Bull Media Ops V1 com a Bull Media Ops Platform V2 para orientar as proximas sprints de produto.

A V1 continua sendo a referencia funcional: ela concentra a experiencia operacional mais completa, com leitura executiva, performance, acoes, relatorios, PDM, inteligencia, GA4 qualidade, gestao de clientes e usuarios.

A V2 ja resolveu a base arquitetural: projeto separado, Supabase/Auth, RLS, repositorios modulares, importacao controlada, seed staging, Media Ops inicial, Central de Acoes, Social Ops base e modulos separados. A V2 ainda precisa ganhar profundidade funcional para se aproximar da V1.

Fora do escopo desta analise:

- Alterar codigo.
- Alterar V1.
- Alterar migrations.
- Alterar auth gate.
- Criar novas integracoes.

## Legenda de classificacao

| Classificacao | Significado |
| --- | --- |
| Critico para uso operacional | Necessario para a V2 substituir parte real da rotina da V1. |
| Importante para paridade | Necessario para aproximar a experiencia da V1, mas nao bloqueia piloto controlado. |
| Acabamento | Melhoria de experiencia, microcopy, filtros, estados ou polimento visual. |
| Futuro | Evolucao relevante, mas deve entrar depois da paridade essencial. |

## Mapa funcional da V1

| Area V1 | Funcionalidades identificadas |
| --- | --- |
| Visao Executiva | KPIs consolidados, clientes analisados, atencoes, acoes pendentes, investimento, conversoes, CPA, ROAS, receita, leitura por canal, top acoes agrupadas, inteligencia correlacionada e botoes de diagnostico. |
| Performance / Media Ops | Filtros por cliente, periodo, canal, origem e campanha; graficos de investimento, conversoes, CPA e ROAS; tabela detalhada por campanha; leitura por canal e campanha. |
| Central de Acoes | Acoes consolidadas, filtros por origem, prioridade, status e pos-ajuste; modal de execucao; permissoes; status operacional; reavaliacao e historico de acoes executadas. |
| Clientes | Lista de clientes, criacao/edicao, canais configurados, pendencias, pagina do cliente com KPIs, acoes, performance por canal, leitura do agente e recomendacoes. |
| Relatorios | Central de relatorios por cliente/periodo/tipo/status, detalhe do relatorio, narrativa, script de slides, configuracao de geracao, copia, impressao/exportacao e permissao de geracao. |
| PDM | Planejamento mensal por cliente, detalhe do plano, resumo executivo, canais, acoes planejadas, oportunidades, historico de aprovacao, exportacao/visao cliente e projecao preditiva. |
| GA4 Qualidade | Qualidade pos-clique por cliente, sessoes, engajamento, conversoes, duracao, status, filtros por cliente/status/busca/periodo. |
| Inteligencia do Cliente | Memoria estrategica, briefings, insights, preparacao de reuniao, busca, inteligencia correlacionada e leitura do agente. |
| Usuarios e permissoes | Supabase Auth, rotas de login/reset/2FA, usuarios, roles, clientes permitidos e bootstrap admin. |
| Backend/data source | Apps Script/server functions, ops-data, ops-data-lite, ops-data-raw, ops-debug, ops-ping e actions operacionais. |

## Mapa funcional da V2

| Area V2 | Estado atual |
| --- | --- |
| Plataforma Core | Supabase/Auth funcionando, gate de producao, profiles/memberships/roles/client_access, settings basico, data mode mock/supabase e RuntimeEnvBadge tecnico. |
| Visao Executiva | Tela inicial com KPIs de Media Ops, top canais, clientes monitorados e prioridades. Ja le Supabase quando em modo staging/producao. |
| Media Ops | Overview, leitura por cliente, repositorio modular, metricas diarias e campanhas importaveis. Ainda e uma versao resumida. |
| Central de Acoes | Fluxo suggested -> in_review -> approved -> executed -> monitoring -> dismissed, drawer/modal de curadoria/execucao/historico, auditoria mockada/estruturada e persistencia Supabase inicial. |
| Social Ops | Base de calendario/posts/pilares/status/aprovacao com repositorio e mocks. Sem publicacao automatica e sem integracoes sociais. |
| Creative Ops | Placeholder de modulo. |
| Relatorios | Lista simples por cliente com dados de Supabase/importacao, KPIs basicos e preview estatico. |
| PDM | Board simples por blocos com planos importados, observacao local e dados basicos. |
| Inteligencia do Cliente | Memoria estrategica simples por cliente, agrupada por client_id e alimentada por registros importados. |
| Integracoes | Lista de fontes, import batches e logs de qualidade. Sem OAuth, sem conectores oficiais e sem jobs nativos. |
| Configuracoes | Clientes, modulos, fontes e estrutura de configuracao. Ainda nao possui paridade com gestao completa de usuarios/clientes da V1. |

## Itens ainda mockados, hardcoded ou incompletos

| Item | Estado |
| --- | --- |
| Permissoes operacionais em UI | Parte dos modulos ainda usa permissoes mockadas ou contratos preparados, sem gestao visual completa por role/client_access. |
| Auditoria visivel | Eventos existem como contrato/helper, mas historico operacional ainda nao esta completo em todas as telas. |
| Periodo global | V1 tem filtro de periodo mais presente; V2 usa recortes fixos ou basicos em varias telas. |
| Relatorios | V2 lista registros, mas ainda nao gera, edita, aprova, exporta ou apresenta detalhe rico como a V1. |
| PDM | V2 mostra planos, mas nao tem detalhe executivo completo, aprovacao, historico, projecao preditiva ou visao cliente. |
| Inteligencia | V2 exibe memoria, mas ainda nao tem busca, briefings, preparacao de reuniao, correlacao media/GA4 e agente. |
| GA4 Qualidade | Nao existe modulo equivalente na V2. Deve entrar como parte de Client Intelligence ou Media Ops Quality. |
| Clientes | V2 tem leitura/configuracao basica, mas nao tem criacao/edicao completa, pendencias e pagina detalhada equivalentes. |
| Integracoes | V2 tem estrutura e logs, mas nao tem conectores oficiais nem sincronizacao automatica. |
| Creative Ops / AI Agents | Estruturados como destino de produto, ainda sem funcionalidade operacional. |

## Gaps por modulo

### Visao Executiva

| Gap | Classificacao | Observacao |
| --- | --- | --- |
| Trazer KPIs da V1 com maior cobertura: clientes analisados, atencoes, pendencias, investimento, conversoes, CPA, ROAS e receita. | Critico para uso operacional | A V2 ja tem KPIs, mas precisa alinhar formulas, periodo e fontes reais. |
| Recriar leitura de decisao por canal/cliente com status consultivo. | Critico para uso operacional | Deve usar dados normalizados, sem payload monolitico. |
| Incorporar qualidade pos-clique/GA4 na leitura executiva. | Importante para paridade | Hoje a V2 nao tem GA4 qualidade. |
| Filtro global por periodo e cliente. | Importante para paridade | Essencial para navegacao operacional diaria. |
| Botoes tecnicos de ping/debug da V1. | Futuro | Na V2 deve virar diagnostico interno, nao dependencia operacional. |

### Media Ops

| Gap | Classificacao | Observacao |
| --- | --- | --- |
| Tela de performance com filtros por cliente, periodo, canal, origem e campanha. | Critico para uso operacional | A V2 ainda tem visao resumida. |
| Tabela detalhada por campanha com metricas completas. | Critico para uso operacional | Necessaria para analise e validacao das recomendacoes. |
| Graficos por canal/campanha para investimento, conversoes, CPA e ROAS. | Importante para paridade | Ajuda a recuperar a experiencia analitica da V1. |
| Normalizar campos de campanhas e metricas importadas da V1. | Critico para uso operacional | Sem isso as telas continuam parcialmente vazias ou inconsistentes. |
| Comparativo periodo anterior/meta. | Importante para paridade | Deve entrar depois dos filtros e tabela base. |

### Central de Acoes

| Gap | Classificacao | Observacao |
| --- | --- | --- |
| Garantir persistencia completa de mudancas de status e execucoes em Supabase. | Critico para uso operacional | A arquitetura existe; precisa validar ponta a ponta com dados reais. |
| Historico operacional completo por acao. | Critico para uso operacional | Deve unir action_executions e audit_logs. |
| Permissoes reais por role/client_access para aprovar, descartar e executar. | Critico para uso operacional | Hoje ainda ha partes preparadas/mockadas. |
| Filtros equivalentes aos da V1: origem, prioridade, status, pos-ajuste e busca. | Importante para paridade | A V2 ja tem filtros, mas deve alinhar semantica da V1. |
| Reavaliacao pos-execucao com resultado antes/depois. | Importante para paridade | Importante para fechar ciclo operacional. |

### Social Ops

| Gap | Classificacao | Observacao |
| --- | --- | --- |
| Calendario editorial com CRUD completo e aprovacao persistida. | Importante para paridade | Social Ops e novo na V2, nao uma paridade direta da V1. |
| Permissoes reais por role. | Importante para paridade | Deve seguir o mesmo contrato do Core. |
| Publicacao automatica via APIs sociais. | Futuro | Fora do momento atual. |
| Metricas sociais. | Futuro | Deve vir depois do calendario e aprovacao. |

### Creative Ops

| Gap | Classificacao | Observacao |
| --- | --- | --- |
| Estrutura de briefing, pecas, status criativo e aprovacao. | Futuro | A V1 tem alguns sinais em recomendacoes/assets do cliente, mas nao um modulo completo. |
| Relacao entre acoes de media e demandas criativas. | Importante para paridade | Pode ajudar a operacionalizar recomendacoes que dependem de criacao. |
| Biblioteca de ativos e historico de criativos. | Futuro | Depende de modelo de dados proprio. |

### Relatorios

| Gap | Classificacao | Observacao |
| --- | --- | --- |
| Detalhe completo do relatorio por cliente/periodo. | Critico para uso operacional | A V2 ainda so lista relatorios e preview estatico. |
| Narrativa editavel, revisao, aprovacao e envio. | Critico para uso operacional | E uma das areas mais importantes da V1. |
| Exportacao/impressao/PDF ou formato compartilhavel. | Importante para paridade | Primeiro pode ser HTML imprimivel; PDF depois. |
| Script de slides e linguagem consultiva. | Importante para paridade | Presente na V1 e valioso para entrega ao cliente. |
| Configuracao de geracao de relatorio. | Importante para paridade | Deve ser modular, sem callOpsAction monolitico. |

### PDM

| Gap | Classificacao | Observacao |
| --- | --- | --- |
| Detalhe completo do plano mensal. | Critico para uso operacional | A V2 tem board simples, sem profundidade da V1. |
| Canais, acoes planejadas, oportunidades e resumo executivo. | Critico para uso operacional | Deve ser alimentado por tabelas normalizadas. |
| Fluxo de aprovacao e historico. | Importante para paridade | Necessario para uso com cliente e time interno. |
| Projecao preditiva. | Importante para paridade | Existe na V1; pode ser reimplementada depois do detalhe base. |
| Visao cliente/exportacao. | Importante para paridade | Importante para entrega externa. |

### Inteligencia do Cliente

| Gap | Classificacao | Observacao |
| --- | --- | --- |
| Busca de insights/memoria estrategica. | Critico para uso operacional | V2 exibe memoria, mas ainda nao permite exploracao real. |
| Briefings e preparacao de reuniao. | Importante para paridade | Funcionalidade forte da V1. |
| Inteligencia correlacionada media + GA4 + pos-clique. | Critico para uso operacional | Deve virar um dominio claro, nao uma leitura solta. |
| Agente com leitura consultiva por cliente. | Futuro | Deve usar dados normalizados e trilha de auditoria. |
| GA4 Qualidade como submodulo ou aba. | Importante para paridade | Hoje nao existe equivalente na V2. |

### Integracoes

| Gap | Classificacao | Observacao |
| --- | --- | --- |
| Importacao operacional recorrente da V1 ou planilhas controladas. | Critico para uso operacional | Caminho atual e arquivo local; precisa rotina segura e repetivel. |
| Monitor de qualidade da importacao. | Importante para paridade | V2 ja tem data_quality_logs, mas precisa ficar mais acionavel. |
| Conectores nativos Google Ads, GA4, Meta, LinkedIn e TikTok. | Futuro | Nao deve bloquear paridade inicial. |
| ClickUp e Sheets como origem temporaria controlada. | Importante para paridade | Deve ser pipeline, nao backend principal. |

### Configuracoes

| Gap | Classificacao | Observacao |
| --- | --- | --- |
| CRUD completo de clientes. | Critico para uso operacional | V1 ja possui criacao/edicao de cliente. |
| Gestao de usuarios, roles e acessos por cliente. | Critico para uso operacional | V2 tem base no banco, mas falta UI operacional completa. |
| Configuracao de canais por cliente. | Critico para uso operacional | Necessaria para Media Ops, relatorios e PDM. |
| Diagnosticos tecnicos acessiveis de forma controlada. | Acabamento | Deve substituir badges temporarios depois da estabilizacao. |

## Sequencia recomendada de implementacao

### Sprint A - Media Ops operacional e Visao Executiva confiavel

Objetivo: fazer a V2 refletir dados reais suficientes para rotina diaria de media.

Entregaveis:

- Filtro global por cliente e periodo.
- Performance por campanha/canal com tabela detalhada.
- KPIs alinhados com a V1.
- Leitura executiva com status consultivo por cliente.
- Validacao de dados importados e estados vazios claros.

Criterio de aceite:

- Um cliente importado aparece na Visao Executiva e Media Ops com metricas reais.
- Nao ha fallback para mock em producao.
- Tabela de campanhas permite validar CPA, ROAS, conversoes e investimento.

### Sprint B - Relatorios MVP de paridade

Objetivo: tornar Relatorios utilizavel para revisao interna.

Entregaveis:

- Detalhe do relatorio por cliente/periodo.
- Narrativa editavel.
- Status de revisao/aprovacao/envio.
- Preview imprimivel.
- Script de apresentacao ou secoes consultivas.

Criterio de aceite:

- Um relatorio importado pode ser aberto, revisado e marcado como aprovado.
- A tela mostra dados do cliente, periodo, performance e recomendacoes relacionadas.

### Sprint C - PDM MVP de paridade

Objetivo: recuperar o planejamento mensal operacional da V1.

Entregaveis:

- Detalhe do PDM por cliente/mes.
- Resumo executivo.
- Canais, acoes planejadas, oportunidades e investimento.
- Historico de aprovacao.
- Visao cliente inicial.

Criterio de aceite:

- Um PDM importado abre com estrutura consultiva completa.
- O time consegue revisar e aprovar o plano sem voltar para a V1.

### Sprint D - Inteligencia, GA4 Qualidade e correlacao

Objetivo: reconstruir a camada consultiva de decisao.

Entregaveis:

- Busca de memoria estrategica.
- Briefings por cliente.
- Tela de qualidade GA4/pos-clique.
- Inteligencia correlacionada media + GA4.
- Leitura consultiva por cliente baseada em dados normalizados.

Criterio de aceite:

- O usuario consegue explicar performance com contexto de qualidade, memoria e aprendizados.

### Sprint E - Central de Acoes completa

Objetivo: fechar o ciclo operacional de recomendacao, aprovacao, execucao e monitoramento.

Entregaveis:

- Permissoes reais por role/client_access.
- Historico completo em audit_logs/action_executions.
- Resultado antes/depois.
- Reavaliacao pos-execucao.
- Filtros e busca alinhados a V1.

Criterio de aceite:

- Uma acao percorre todo o ciclo com auditoria persistida e permissao correta.

### Sprint F - Configuracoes, clientes e usuarios

Objetivo: permitir operacao sem manutencao manual no banco.

Entregaveis:

- CRUD de clientes.
- Configuracao de canais por cliente.
- Usuarios, memberships, roles e client_access.
- Tela de diagnostico controlado.

Criterio de aceite:

- Admin consegue cadastrar cliente, configurar canais e conceder acesso sem intervencao tecnica.

### Sprint G - Social Ops, Creative Ops e AI Agents

Objetivo: expandir a plataforma alem da paridade da V1.

Entregaveis:

- Social Ops com calendario persistido e aprovacao.
- Creative Ops com briefing/status/relacao com acoes.
- AI Agents como camada assistiva auditavel.
- Integracoes nativas planejadas por pipeline.

Criterio de aceite:

- Novos modulos operam sem acoplar dados nem recriar payload gigante.

## Decisoes de arquitetura para manter

- A V2 nao deve recriar o `ops-data` monolitico.
- Cada modulo deve ter repositorio e contrato proprio.
- Apps Script deve ser apenas origem temporaria ou referencia historica, nao backend principal.
- Dados importados devem entrar normalizados no Supabase.
- Mocks devem existir apenas em modo mock/desenvolvimento.
- Permissao deve ser validada por Auth, membership, role, client_access e RLS.
- Relatorios, PDM e inteligencia devem consumir dados modulares, nao um payload unico.

## Prioridade objetiva

1. Media Ops operacional e filtros globais.
2. Relatorios com detalhe e revisao.
3. PDM com detalhe e aprovacao.
4. Inteligencia/GA4 qualidade.
5. Central de Acoes com auditoria e permissoes reais.
6. Configuracoes completas de clientes/usuarios.
7. Social Ops, Creative Ops e AI Agents como expansao.

