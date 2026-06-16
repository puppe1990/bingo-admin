# Bingo Fácil — Admin

Painel administrativo para gerenciar assinaturas do [Bingo Fácil](https://github.com/puppe1990/bingo-facil-turso). Compartilha o mesmo banco Turso em produção e o mesmo SQLite local do app principal no desenvolvimento.

**Produção:** https://bingo-facil-admin.netlify.app

## Stack

- React 19 + TanStack Start (SSR) + TanStack Router
- Turso/libSQL + Drizzle ORM
- Better Auth (`user.role = admin`)
- Tailwind CSS 4 + Vite 7
- Deploy: Netlify Functions

## Funcionalidades

- Login restrito a usuários com `role = admin`
- Dashboard com estatísticas de assinaturas
- Listagem com filtros por status e data de expiração
- Criar, editar, estender e cancelar assinaturas
- Script `promote-admin` para promover usuário a admin

## Rodar localmente

**Pré-requisitos:** Node.js 22+

```bash
npm install
cp .env.example .env
```

O `.env` padrão aponta ao SQLite do app principal (`../bingo-facil-turso/data/bingo-facil.sqlite`). Rode o [bingo-facil-turso](https://github.com/puppe1990/bingo-facil-turso) pelo menos uma vez para criar o arquivo, ou crie a conta no app principal (`http://localhost:3001`).

```bash
npm run dev    # http://localhost:3002
```

Promover um usuário a admin (use o e-mail de uma conta já criada):

```bash
ADMIN_EMAIL=seu@email.com npm run promote-admin
```

Login: http://localhost:3002/login

## Comandos

| Comando                 | Propósito                              |
| ----------------------- | -------------------------------------- |
| `npm run dev`           | Desenvolvimento (porta 3002)           |
| `npm run build`         | Build de produção → `dist/`            |
| `npm start`             | Servidor de produção                   |
| `npm test`              | Testes Vitest                          |
| `npm run lint`          | Verificação TypeScript                 |
| `npm run ci`            | format + lint + test + build           |
| `npm run promote-admin` | Promove `ADMIN_EMAIL` a admin no banco |

## Variáveis de ambiente

### Local (SQLite)

```env
TURSO_DATABASE_URL=file:../bingo-facil-turso/data/bingo-facil.sqlite
TURSO_AUTH_TOKEN=

BETTER_AUTH_SECRET=your-secret-at-least-32-characters-long
BETTER_AUTH_URL=http://localhost:3002
```

### Produção (Turso)

```env
TURSO_DATABASE_URL=libsql://bingo-facil-your-org.aws-us-east-1.turso.io
TURSO_AUTH_TOKEN=your-turso-token

BETTER_AUTH_SECRET=mesmo-secret-do-app-principal
BETTER_AUTH_URL=https://bingo-facil-admin.netlify.app
```

`BETTER_AUTH_SECRET` deve ser **idêntico** ao do app principal para sessões compartilhadas. O banco Turso também é o mesmo (`bingo-facil`).

## Rotas

```
/login                       → login admin
/                            → dashboard (protegido)
/assinaturas                 → lista de assinaturas
/assinaturas/nova            → criar assinatura
/assinaturas/$id             → editar assinatura
```

## Deploy (Netlify)

O projeto inclui `netlify.toml`. Variáveis obrigatórias no site Netlify:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL` (URL do admin)
- `NODE_VERSION=22`

```bash
netlify link
netlify deploy --prod --build
```

## Estrutura

```
src/
  app/              → rotas TanStack Start
  lib/db/           → schema, migrations, conexão Turso/local
  lib/ui/           → componentes visuais compartilhados com o app principal
  server/           → lógica de assinaturas + server functions
  pages/            → páginas do admin
scripts/
  promote-admin.ts  → promove usuário a admin via Turso/SQLite
```

## Repositórios relacionados

- App principal: https://github.com/puppe1990/bingo-facil-turso
