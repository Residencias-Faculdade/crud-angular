# Posts CRUD

Aplicacao Angular 21 de CRUD de publicacoes, autenticada com Keycloak e distribuida como Web Component para uso em micro frontends.

## Stack

Angular 21, TypeScript strict, signals e recursos reativos, RxJS, Angular Elements, keycloak-js, Express SSR, Vitest, ESLint, Prettier, Docker e Nginx.

## Arquitetura

```
src/app/core/auth                 sessao Keycloak, guard e interceptor HTTP
src/app/core/interceptors         tratamento padronizado de erros HTTP
src/app/features/posts/domain     modelos do dominio
src/app/features/posts/data       acesso a API
src/app/features/posts/application estado e casos de uso da feature
src/app/features/posts/presentation componente e template
src/app/shared/components         componentes reutilizaveis
src/app/shared/styles             design tokens
```

A feature de posts e isolada por camadas. O componente cuida apenas de interacao e renderizacao; o estado e as operacoes ficam em `PostsStore`; o acesso HTTP fica em `PostRepository`.

## Requisitos

- Node.js 22
- npm 11
- Docker e Docker Compose para a execucao containerizada

## Desenvolvimento

```bash
npm ci
npm start
```

A aplicacao fica disponivel em `http://localhost:4200`. No ambiente de desenvolvimento a autenticacao esta desativada, permitindo acessar `/posts` sem Keycloak.

Para habilitar o login localmente, altere `auth.enabled` para `true` em `src/environments/environment.development.ts` e suba o Keycloak com `docker compose up -d keycloak`.

## Laboratório de formulário configurável

O projeto inclui um laboratório isolado em `/lab` (`http://localhost:4200/lab`). Ele renderiza um
formulário completo a partir de um schema JSON ou YAML, sem campos escritos no TypeScript.

O laboratório tem abas para o formulário, a fonte do schema, a tipagem de cada campo e o payload
gerado. Ele não depende de autenticação e pode ser removido apagando `src/app/lab` e a rota `lab`
em `src/app/app.routes.ts`.

O guia completo, incluindo o contrato do schema, a tabela de widgets e como estender o motor,
está em [`src/app/lab/README.md`](src/app/lab/README.md).

## Configuracao

```bash
cp .env.example .env
```

Variaveis disponiveis:

| Variavel                  | Padrao  | Descricao                      |
| ------------------------- | ------- | ------------------------------ |
| `FRONTEND_PORT`           | `4200`  | Porta publicada pelo container |
| `KEYCLOAK_PORT`           | `8080`  | Porta do Keycloak              |
| `KEYCLOAK_ADMIN`          | `admin` | Usuario administrativo local   |
| `KEYCLOAK_ADMIN_PASSWORD` | `admin` | Senha administrativa local     |

O arquivo `.env` nao e versionado.

## Docker

```bash
docker compose up --build
```

Servicos:

- Aplicacao: `http://localhost:4200`
- Keycloak: `http://localhost:8080`

O realm `atividadengx` e o client `frontend` sao importados automaticamente a partir de `keycloak/realm.json`.

## Web Component

O componente e publicado como `<posts-crud>`:

```html
<script type="module" src="http://localhost:4200/main.js"></script>
<posts-crud></posts-crud>
```

Modos de execucao:

- Aplicacao completa quando existe `<app-root>` e nao ha solicitacao de elemento.
- Web Component quando existe `<posts-crud>` ou quando a URL contem `?element=true`.

O componente usa `ViewEncapsulation.ShadowDom` e nao expoe dependencias internas. O build de producao executa `scripts/postbuild.mjs`, que publica `main.js` com nome estavel e gera `microfrontend.json`.

## Testes e qualidade

```bash
npm test
npx eslint src --max-warnings 0
npx prettier --check "src/**/*.{ts,html,css}"
```

Os testes cobrem repositorio, store, componentes, guard, interceptors e servico de autenticacao.

## Build de producao

```bash
npm run build
```

O artefato fica em `dist/posts-crud/browser` e e servido pelo Nginx no container.
