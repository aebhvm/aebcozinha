# Correções da auditoria — 21/11/2026

Linha de base: `c076117`. Este registro complementa a auditoria inicial, preservando as evidências anteriores. O usuário autorizou as correções, commit, push e publicação. Para movimentações, confirmou expressamente: somente gestores podem alterar registros de outras pessoas; cada usuário mantém acesso aos próprios lançamentos.

## Implementado

| Pendência | Correção | Verificação |
|---|---|---|
| Gravação parcial de pedidos e relatórios | Registro principal e todos os filhos escritos em uma única instrução PostgreSQL com CTE; falha em qualquer filho desfaz tudo | Testes em PostgreSQL descartável com gatilhos que provocam falha no segundo item/anexo; nova tentativa idêntica funciona |
| Batch sem transação | Adaptador usa `neon().transaction()`; exclusões compostas de escalas e tarefas agrupadas | Erro induzido após a primeira instrução comprova rollback completo |
| Corrida de pedidos duplicados | Índice único preservado; conflito de fingerprint retorna 409 | Duas requisições simultâneas produzem um único pedido, com respostas 201 e 409 |
| Força bruta no login | Limites persistidos no PostgreSQL: 10 tentativas por conta/15 min; 100 por IP confiável/15 min; resposta 429 com Retry-After | Requisições simultâneas, expiração, sucesso, reinicialização de módulos e IPs testados |
| Identificadores nos contadores | Chaves são HMAC-SHA256, sem nome de usuário ou IP em claro; limpeza periódica de contadores expirados | Formato e persistência testados |
| Enumeração por tempo de resposta | Comparação bcrypt também ocorre quando o usuário não existe | Caminho de autenticação mantém erro genérico; não é promessa de tempo constante ponta a ponta |
| Sessões antigas após troca de PIN | JWT inclui versão de sessão; troca de PIN, desativação e exclusão incrementam a versão | Token anterior é recusado e novo login é aceito após troca de PIN |
| Alterar movimentações de terceiros | Verificação de autor/papel na API; botões exibidos de acordo com a mesma regra | Colaborador e estoquista recebem 403 para registro alheio; autor e gestor conseguem editar |
| Relatórios transferindo todos os arquivos | Listagem devolve metadados; conteúdo binário solicitado somente quando o anexo se aproxima da área visível | Lista sem base64; endpoint exige gestor; navegador carrega a imagem sem erros |
| CSP bloqueando mídia/PDF | Conversão base64 → Blob local, sem fetch de data URLs; conexões continuam limitadas à própria origem | Testes de preservação de bytes e navegador com CSP real, sem erros de console |
| Microfone bloqueado pelo próprio app | Permissions-Policy permite câmera e microfone da própria origem; consentimento do navegador continua obrigatório | Configurações Netlify/Vercel alinhadas; captação física não testada |
| Limite de corpo na hospedagem | Novos relatórios limitados a 3 MB de anexos para acomodar base64 e JSON no envio; download binário reduz o tamanho de resposta | Limite igual na interface e API; arquivos já salvos preservados |
| Dependências com advisories | Removido localtunnel sem uso nos arquivos/scripts e atualizado tsx de forma compatível; PGlite adicionado apenas a desenvolvimento | `npm audit`: zero avisos conhecidos no conjunto completo |
| Falta de CI | Workflow de GitHub Actions com ações fixadas em SHA: lint, testes, build e auditoria de dependências produtivas | Execução remota deve ser conferida após push; não foi imposta proteção de branch |

## Migração e preservação

Arquivo: `database/migrations/2026-11-21-login-security.sql`; equivalente executado pelo servidor em `netlify/functions/lib/security.ts`.

- Adiciona `users.session_version` com padrão zero.
- Cria `auth_login_limits` e índice por expiração.
- Registra versão separada em `app_meta`, sem mudar a versão nem reaplicar as migrações antigas.
- Aplicação atômica e idempotente; teste de reaplicação preservou usuários, pedidos, relatórios e versões de sessão.
- Tokens anteriores à mudança continuam válidos como versão zero até expirar ou haver troca de PIN/desativação. PINs e papéis não são modificados pela migração.
- Nenhum registro de negócio existente é excluído ou reconstruído. Pedidos eventualmente incompletos de antes da correção exigem inspeção no banco real antes de reparo.

## Validação local

- Lint e build com TypeScript do frontend/backend passaram.
- 33 testes em quatro arquivos: testes unitários, transporte simulado e integração com PostgreSQL em memória (PGlite).
- Integração executa o handler real, bcrypt, JWT, migrations e SQL; somente o transporte HTTP do Neon é substituído. Não substitui um teste no serviço Neon.
- Navegador com bundle compilado, CSP do projeto e API de teste: gestor, colaborador e estoquista em 390 e 1280 px; permissões, imagem sob demanda, ausência de overflow e de erros de CSP/JavaScript confirmadas.
- Não foram usadas contas reais para os testes de papéis. Não foram testados microfone/câmera físicos nem reprodução de todas as combinações de codec.
- `npm audit` do conjunto completo: zero avisos conhecidos, sem downgrade forçado.

## Limites e próximos passos externos

A API da conexão Vercel retornou 404 para `aebcozinha` tanto com a equipe `aebrestaurante` quanto com o ID da mesma equipe retornado pela listagem. Nenhum segredo de ambiente foi obtido. Permissões/roles do Neon, janela de restauração, backups e WAF permanecem **não verificados**. O domínio público e o status de publicação podem ser conferidos por HTTP/GitHub independentemente dessa conexão.

A branch não possuía proteção na consulta inicial. O workflow valida pushes e PRs, mas não impede sozinho um push direto ou uma publicação antes do término do CI. Proteção de branch e exigência de checks devem ser decididas conforme o fluxo desejado de publicação.

Não foram alteradas políticas de retenção nem excluídas fotos, relatórios, backups ou dados pessoais. Correções técnicas não certificam LGPD nem segurança absoluta.

Referência sobre os headers de IP tratados pela plataforma: [documentação oficial da Vercel](https://vercel.com/docs/headers/request-headers). O código só confia nos headers específicos do provedor quando executa no ambiente correspondente; fora dele permanece o limite por conta.
