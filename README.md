# Escala da Cozinha

Aplicativo web responsivo para criar escalas diarias de cozinha, controlar pracas, intervalos de uma hora e afazeres por colaborador.

## Stack

- React + Vite + TypeScript
- Netlify Functions
- PostgreSQL serverless via Neon

## Rodando localmente

```bash
npm install
npm run dev
```

O frontend abre pelo Vite. Para testar app e API juntos sem depender da CLI do Netlify:

```bash
npm run build
npm run serve:local
```

Em um banco vazio, configure `INITIAL_ADMIN_PIN` com um PIN numerico de 4 a 12 digitos antes do primeiro acesso. O usuario gestor `admin` e criado somente com essa configuracao; nao existe PIN padrao.

## Acesso fora do mesmo Wi-Fi

`localhost` e IP local funcionam apenas no computador ou na mesma rede. Para usar de qualquer lugar, publique o projeto no Netlify e configure o banco Neon nas variaveis de ambiente abaixo. Um tunel publico local pode ser usado para testes temporarios, mas nao substitui o deploy.

## Variaveis de ambiente

Configure no Netlify:

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=gere-um-segredo-aleatorio-com-pelo-menos-32-caracteres
INITIAL_ADMIN_PIN=
INITIAL_STOCKKEEPER_PIN=
ALLOWED_ORIGIN=https://escala-cozinha-aebvmhotel1.netlify.app
```

O valor de `DATABASE_URL` deve ser o connection string do Neon e nunca deve ser commitado no repositorio.

## Scripts

```bash
npm run lint
npm run build
npm run test
```

O build verifica os tipos do frontend, da API, do adaptador e do servidor local. Os testes da API incluem PostgreSQL descartável em memória (PGlite) e não precisam de credenciais reais.

## Hospedagem na Vercel

`vercel.json` publica o frontend Vite e encaminha `/api/*` para `api/relay.ts`, que reutiliza o handler de `netlify/functions/api.ts`. Configure as variáveis de ambiente do servidor no projeto correto da Vercel; nunca use prefixo `VITE_` para credenciais. As regras de cabeçalhos de Netlify e Vercel precisam ser mantidas alinhadas.

Auditoria técnica e limitações conhecidas: [relatório de 21/11/2026](docs/auditoria-final-2026-11-21.md).

Correções e migração aditiva de segurança: [registro de implementação](docs/correcoes-auditoria-2026-11-21.md). Na primeira execução da nova versão, o servidor aplica essa migração em transação, sem excluir dados ou reaplicar migrações antigas. O login limita tentativas por conta e IP confiável; trocar o PIN ou desativar um usuário revoga suas sessões anteriores.
