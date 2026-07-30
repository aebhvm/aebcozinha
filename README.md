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
npm run build
npm run test
```
