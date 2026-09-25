# MJM Orcamentos — Frontend

Aplicacao web do sistema de orcamentos da MJM, construida com React, TypeScript e Vite.

## Requisitos

- Node.js 22 ou superior
- pnpm 10.13.1
- API `mjm-orcamento-back` em execucao

## Configuracao

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Por padrao, o frontend abre em `http://localhost:5173` e consome a API em
`http://localhost:3001`. Altere `VITE_API_URL` no `.env` quando necessario.

## Comandos

- `pnpm dev`: inicia o servidor de desenvolvimento.
- `pnpm build`: gera a aplicacao de producao em `dist/`.
- `pnpm test`: executa os testes do frontend.
- `pnpm lint`: executa o ESLint.
- `pnpm typecheck`: valida os tipos TypeScript.

## Estrutura

```text
src/                  aplicacao React
docs/                 documentacao historica do monorepo
```

O frontend mantem apenas os tipos de transporte e as opcoes necessarias para a
interface. A API executa a validacao autoritativa e decide as regras de negocio.
Instalacao e build nao dependem de um checkout local do backend.
