# Auditoria final — Cozinha — 21/11/2026

Atualização posterior: [correções autorizadas e verificadas](correcoes-auditoria-2026-11-21.md). Os achados abaixo registram a situação encontrada na auditoria inicial.

## Resumo e parecer

**NÃO VERIFICADO para aprovação integral de produção.** A revisão de código e as verificações locais foram concluídas, com correções proporcionais. Permanecem lacunas fundamentais de integração autenticada, regras de acesso por objeto e controles da infraestrutura. Não foi demonstrada exploração crítica/alta em produção; isso não elimina os riscos potenciais descritos abaixo.

Repositório: `aebhvm/aebcozinha`; branch inicial `main`; linha de base `196b940490377101f9697e2add4a735351280415`. Checkout inicialmente limpo. Domínio conferido: `https://aebcozinha.vercel.app`. Não foram usados usuários reais, credenciais produtivas, uploads ou operações de escrita no banco durante a auditoria. A autorização anterior do usuário permite commit, push e publicação dos ajustes validados; nenhuma mudança de permissões, schema ou dados foi incluída.

## Inventário

- React 19, TypeScript, Vite, React Router e npm com `package-lock.json`.
- API TypeScript em `netlify/functions/api.ts`; adaptador Vercel em `api/relay.ts`.
- Neon/PostgreSQL acessado apenas no servidor; queries com parâmetros separados.
- Sessões JWT HS256 com validade de 12 horas; PIN com bcrypt; usuário ativo e papel consultados no banco a cada autenticação.
- Papéis: gestor, colaborador e estoquista. Dados incluem nomes, tarefas, escalas, pedidos, movimentações e mídia.
- Configurações Netlify e Vercel presentes; o domínio atualmente inspecionado usa Vercel.
- Não há AGENTS.md nem workflow de CI versionado neste checkout. README e scripts de lint, build e testes presentes.

## Tabela de achados

As linhas referem-se à versão auditada com as correções locais. “Corrigido” significa correção implementada e verificada localmente; a aplicação dos headers no domínio depende da publicação.

| ID / pilar | Severidade / estado | Evidência | Ação | Risco residual |
|---|---|---|---|---|
| O1 Organização | Médio / confirmado | `src/App.tsx`: 4.476 linhas; `netlify/functions/api.ts`: 1.918 linhas na revisão | Preservados, sem refatoração ampla | Forte acoplamento torna revisões e regressões mais difíceis. Extrair módulos em trabalho próprio. |
| O2 Organização | Médio / confirmado, corrigido | `tsconfig.node.json:23` antes incluía só `vite.config.ts` | Incluídos API, adaptador e servidor local no typecheck do build | Typecheck não substitui testes de integração. |
| O3 Organização | Médio / confirmado | `git ls-files`: sem `.github/workflows` | Registrada pendência | Não há evidência de lint/testes obrigatórios em cada push; proteção de branch não inspecionada. |
| L1 Limpeza | Baixo / confirmado, corrigido | `.gitignore`: `.env.*` não cobria o nome literal `.env` | Adicionado `.env`; mantida a exceção de `.env.example` | Não foi auditado todo o histórico Git nem o armazenamento de segredos do provedor. |
| L2 Limpeza | Baixo / potencial | `src/assets/react.svg`, `src/assets/vite.svg`, `src/assets/hero.png` sem referência encontrada nos arquivos versionados | Preservados | Podem existir usos manuais/externos. Não removidos apenas por ausência de import. |
| S1 Segurança | Médio / confirmado, corrigido | `netlify/functions/api.ts:1907`: catch anteriormente devolvia `error.message` de qualquer erro | Erros inesperados retornam 500 genérico; JSON/Zod retornam 400 sem ecoar valores; 4xx explícitos preservados | Não há telemetria estruturada para diagnóstico interno; detalhes não são mais enviados ao cliente. |
| S2 Segurança | Médio / confirmado, corrigido na configuração | GET público do domínio: CSP, X-Frame-Options, nosniff, Referrer-Policy e Permissions-Policy ausentes; HSTS presente | `vercel.json`: espelhados os headers já usados em `netlify.toml`, além da política de cache do service worker | Conferir headers após deploy. Fluxos autenticados com mídia/PDF não foram exercitados com a CSP nova. |
| S3 Segurança | Alto / presença confirmada, exploração não demonstrada; corrigido nas dependências de produção | `npm audit`: 28 pacotes sinalizados antes; Zod 4.4.3 afetado por aviso de exaustão de memória | Atualizações compatíveis do lockfile, sem `--force`; Zod 4.6.7, Vite 8.3.8, Vitest 4.1.12, React Router DOM 7.18.6 | `npm audit --omit=dev` final: zero avisos conhecidos. Não significa ausência de vulnerabilidades. |
| S4 Segurança | Alto no advisory / presença confirmada em desenvolvimento | Auditoria final: Axios e localtunnel, ambos high; esbuild low | Preservados; não aplicada a troca incompatível de localtunnel 2.0.2 para 1.8.3 sugerida pelo npm | Total de 3 avisos em ferramentas de desenvolvimento; não demonstrada exposição no aplicativo de produção. Não expor servidores de desenvolvimento/túneis a origens não confiáveis. |
| S5 Segurança | Alto / potencial | `netlify/functions/api.ts:961`: login não implementa limitação de tentativas; cadastro aceita PIN a partir de 4 caracteres | Sem mudança de autenticação nesta revisão | PIN curto pode ser alvo de força bruta. Rate limiting/WAF do provedor não verificados. Revisar limitação persistente por conta e origem e recuperação de acesso. |
| S6 Segurança | Alto / potencial, comportamento de código confirmado | `netlify/functions/api.ts:1560` e `:1589`: PUT/DELETE de movimentações exigem apenas usuário autenticado; WHERE não filtra autor/papel | Regra atual preservada | Qualquer papel autenticado pode alterar/excluir movimentações por ID. Confirmar se compartilhamento é regra autorizada antes de restringir; não foi declarada uma vulnerabilidade de negócio sem essa confirmação. |
| S7 Integridade | Alto / potencial de perda parcial; implementação confirmada | `netlify/functions/api.ts:90`: batch é um loop sem transação; `:1484` e `:1643`: registro principal é inserido antes dos itens/anexos | Sem mudança transacional neste lote | Falha intermediária pode deixar pedido/relatório incompleto. Fingerprint único pode impedir reenvio de pedido parcialmente salvo. Necessita teste com falha induzida em banco isolado e transação abrangendo pai e filhos. |
| S8 Segurança | Médio / potencial | `netlify/functions/api.ts:571` e `:581`: JWT de 12h sem versão de sessão associada ao PIN | Preservado | Trocar PIN não revoga automaticamente tokens existentes. Desativação e mudança de papel são consultadas no banco. Não foi feita troca de credenciais. |
| S9 Disponibilidade e dados | Médio / confirmado no código | `netlify/functions/api.ts:789`: lista até 200 relatórios e inclui todos os anexos base64 | Preservado | Respostas grandes podem exceder memória/limites de plataforma. Separar metadados de mídia e paginar em trabalho próprio, mantendo controle de acesso. |
| S10 Infraestrutura e privacidade | Médio / não verificado | Sem acesso administrativo nesta auditoria | Lacuna documentada | Grants/roles do Neon, backups e restauração, WAF, variáveis por ambiente, retenção e política de acesso a fotos/relatórios não inspecionados. Não há certificação jurídica de LGPD. |

## Pilar 1 — Organização

O README descreve instalação, variáveis por nome, build e servidor local. A documentação de hospedagem priorizava Netlify apesar da presença de Vercel; foi acrescentada uma nota sobre o adaptador e os comandos completos de validação. A cobertura TypeScript foi ampliada para o backend. Os dois módulos longos foram preservados para não misturar uma refatoração estrutural com a auditoria de segurança.

## Pilar 2 — Limpeza inteligente

Nenhum arquivo de negócio, mídia, backup, migration ou registro foi removido. Os artefatos candidatos e a dependência localtunnel foram preservados por possível uso manual. Os relatórios brutos gerados nesta execução foram separados em uma pasta de evidências fora do checkout, evitando sua publicação involuntária.

Verificação dos arquivos rastreados: não foram encontrados `dist/`, `node_modules/`, logs ou backups versionados. `.env.example` é o único arquivo de ambiente rastreado. Uma busca por padrões de URLs de conexão com senha e tokens conhecidos nos arquivos textuais rastreados não encontrou correspondências; o teste não abrange todo o histórico, segredos desconhecidos ou arquivos binários.

## Pilar 3 — Segurança e controles observados

- JWT assinado, com expiração e consulta de usuário ativo; papel atual vem do banco.
- bcrypt para PIN, segredo JWT obrigatório com tamanho mínimo e sem fallback fraco aceito.
- Rotas administrativas usam verificação de papel no servidor; relatórios de gestores são restritos a gestores.
- Pedidos de colaboradores são consultados com filtro por solicitante. Testes de SQL verificam parâmetros separados da consulta.
- Zod valida entradas. Validações de mídia conferem prefixo e tamanho decodificado, mas não constituem antivírus nem inspeção completa de conteúdo.
- Token fica em sessionStorage e é enviado via Authorization. Não há sessão baseada em cookie automático; CSRF tradicional não foi confirmado. XSS continua sendo relevante para tokens acessíveis a JavaScript.
- Não foram encontrados `dangerouslySetInnerHTML`, `eval` ou logs de dados no frontend/API durante a busca estática.
- O handler executa `ensureDb()` antes da autorização; migrations automáticas devem ser reavaliadas em uma revisão de implantação. Nenhuma migration foi executada ou modificada nesta auditoria.

## Validação

| Comando/verificação | Resultado | Limite |
|---|---|---|
| `npm run lint` | Passou | Análise estática. |
| `npm run build` | Passou após as atualizações e ampliação do tsconfig | Inclui typecheck de frontend e backend; não valida banco real. |
| `npm test` | Passou: 20 testes em 3 arquivos, sendo 14 testes novos da API | Testes unitários e API com Neon simulado. Sem escrita em banco real. |
| Testes da API | Incluem ausência de sessão, token forjado/expirado, usuário inativo, papéis, JSON inválido, validação, erro interno e SQL parametrizado | Não cobrem todas as rotas ou IDOR de cada objeto. |
| `npm audit` | Antes: 28 (13 altos, 12 moderados, 3 baixos). Após: 3 (2 altos e 1 baixo) | Contagem de pacotes, não de explorações; residuais no conjunto de desenvolvimento. |
| `npm audit --omit=dev` | Zero avisos após as atualizações | Base de advisories consultada na execução. |
| GET público do domínio | Conferidos headers, sem login e sem ações de negócio | Verificação inicial confirmou ausência dos headers; repetir após publicação. |
| `git diff --check` | Passou | Escopo e segredos devem ser revistos antes do commit. |
| Fluxos com contas reais, pedidos, uploads, transações e restauração | Não executados | Sem banco isolado/contas de auditoria. Não foram usados dados de produção. |

A primeira tentativa de typecheck manual foi ajustada às exigências do TypeScript 6; o resultado considerado é o build final com a configuração ampliada. Avisos de tempo de plugins do Vite não impediram a compilação.

Um teste novo inicialmente presumiu que cadastrar produtos era exclusivo do gestor/estoquista. A leitura do handler e do formulário confirmou que colaboradores podem cadastrar produtos; a regra foi preservada e o teste passou a verificar a edição, que é restrita. O resultado final de 20 testes foi obtido após essa correção do teste, sem mudar permissões.

## Mudanças e sequência recomendada

Arquivos alterados: `.gitignore`, `netlify/functions/api.ts`, `netlify/functions/api.test.ts` (novo), `package-lock.json`, `tsconfig.node.json`, `vercel.json`, `README.md` e este relatório. Não houve mudança de schema, credenciais ou permissões de usuários.

1. Publicar apenas este conjunto validado, com atenção à CSP e aos novos códigos 500 para falhas internas; conferir headers e fluxos de mídia/PDF após deploy.
2. Confirmar quem pode editar/excluir movimentações de terceiros e verificar a proteção efetiva contra tentativas de login no provedor.
3. Criar ambiente isolado para testar transações, erros de inserção e recuperação de pedidos parcialmente gravados; só então corrigir a persistência.
4. Auditar grants e backups do Neon, testar restauração, revisar revogação de sessões e retenção de mídia/dados pessoais.
5. Tratar os 3 advisories de desenvolvimento sem downgrade forçado e adicionar CI com lint, typecheck e testes.

Este parecer não garante ausência de falhas nem conformidade integral com a LGPD.
