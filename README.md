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
- `pnpm test`: executa os testes do frontend e dos contratos compartilhados.
- `pnpm lint`: executa o ESLint.
- `pnpm typecheck`: valida os tipos TypeScript.

## Estrutura

```text
src/                  aplicacao React
docs/                 documentacao historica do monorepo
```

Os contratos e schemas de dominio pertencem ao backend e sao consumidos pelo
pacote `@mjm/contracts`. No desenvolvimento local, os repositorios devem ficar
lado a lado:

```text
mjm-orcamento/
mjm-orcamento-back/
```

O vinculo local esta declarado como `link:../mjm-orcamento-back/packages/shared`.
Para CI e releases, use uma tag imutavel do backend, por exemplo:

```json
"@mjm/contracts": "github:tuca-janahu/mjm-orcamento-back#v0.1.0&path:packages/shared"
```

O frontend pode usar os schemas para feedback imediato, mas a API sempre executa
a validacao autoritativa e decide as regras de negocio.
