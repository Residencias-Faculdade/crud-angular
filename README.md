# primeiro-projeto

CRUD Angular 21 com Clean Architecture, Keycloak e Web Component, containerizado com Docker e Nginx.

## Stack

Angular 21, TypeScript strict, RxJS, Angular Elements, keycloak-js, Nginx alpine, Docker Compose, Vitest, ESLint, Prettier.

## Estrutura

```
src/app/core/auth           # keycloak.service, auth.guard, auth.interceptor
src/app/core/interceptors   # error.interceptor
src/app/shared/components   # pagination, confirm-modal, unauthorized
src/app/features/posts/domain      # post.model
src/app/features/posts/data        # post.repository
src/app/features/posts/presentation # posts.component (ShadowDom)
src/environments            # environment.ts
public/assets/silent-check-sso.html
```

Cada feature isolada em domain, data e presentation. Regras SOLID e Angular Style Guide aplicadas.

## Ambiente

Copie o exemplo e ajuste se necessario:

```bash
cp .env.example .env
```

Variaveis em `.env.example`:

```
FRONTEND_PORT=4200
KEYCLOAK_PORT=8080
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=atividadengx
KEYCLOAK_CLIENT_ID=frontend
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=admin
```

Nenhum segredo commitado. `.env` ignorado pelo git.

## Subir com Docker

Multi-stage Dockerfile: `npm ci && ng build --configuration production` e copia para `nginx:alpine` com `try_files` e proxy `/api/` preparado.

```bash
docker compose up --build
```

Acessos:

- Frontend: http://localhost:4200
- Keycloak: http://localhost:8080 (admin/admin)
- Crie realm `atividadengx` e client `frontend` com Valid Redirect URI `http://localhost:4200/*` e Web Origins `*`

## Desenvolvimento local

```bash
npm ci
npm start
```

Acesse http://localhost:4200/posts. Guard protege `/posts`. Sem sessao, redireciona para `/unauthorized`.

## Web Component

Exposto como `<posts-crud>` via `@angular/elements`.

`src/main.ts` suporta dois modos:

- Standalone: `bootstrapApplication(App)` quando nao ha tag no DOM
- Elemento: `createCustomElement(PostsComponent)` e `customElements.define('posts-crud', element)` quando detecta `<posts-crud>` ou `?element=true`

Uso na casca `atividadengx`:

```html
<script src="http://localhost:4200/main.js"></script>
<posts-crud></posts-crud>
```

Estilos encapsulados com `ViewEncapsulation.ShadowDom`, sem vazamento para a aplicacao externa. Nenhuma dependencia interna exposta.

## Testes

Vitest com jsdom, sem estado global compartilhado, mocks para HttpClient e Keycloak.

```bash
npm test
```

Cobertura minima 80 por cento em services, guards, interceptors e componentes com logica. Casos de sucesso, erro de token expirado, falha de rede e edge cases cobertos.

```bash
npx ng test --watch=false
```

## Lint e Format

```bash
npx eslint src --max-warnings 0
npx prettier --check "src/**/*.{ts,html,css}"
npx prettier --write "src/**/*.{ts,html,css}"
```

Sem warnings. Prettier com `singleQuote` e `printWidth 100`.

## Commits

Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `chore:`.

## Build producao

```bash
npx ng build --configuration production
```

Artefato em `dist/primeiro-projeto/browser` servido pelo Nginx no container.

---

## Compatibilidade com `atividadengx` (shell)

> Esta secao documenta exatamente o que foi **modificado** e o que foi **adicionado** para que este projeto funcione como micro frontend da casca `c:\Users\pc_ac\OneDrive\Desktop\atividadengx`. Todos os arquivos abaixo estao comentados no codigo com prefixo `COMPATIBILIDADE COM ATIVIDADENGX`.

### Objetivo

A casca `atividadengx` (`src/main.ts:52-78`) orquestra micro frontends via `fetch('/microfrontends.json')` + `loadScript(url, tag)` injetando `<script type="module" src="http://localhost:4200/main.js">` e montando `<posts-crud>`. Para isso o micro frontend precisa: expor `main.js` estavel com CORS `*`, registrar `customElements.define('posts-crud')` com guard, isolar Shadow DOM, usar mesmo realm/client Keycloak `atividadengx/frontend` com PKCE S256, e responder na mesma rede Docker `app-network`.

### Arquivos MODIFICADOS

| Arquivo | O que mudou | Por que (compatibilidade) |
|---|---|---|
| `src/main.ts:1-27` | Antes: apenas `bootstrapApplication(App)`. Agora: importa `createApplication` + `createCustomElement`, define `elementName='posts-crud'`, funcao `defineElement()` com guard `customElements.get`, e logica dual `useElement` (`querySelector` ou `?element=true`) | Casca espera `http://localhost:4200/main.js` que registre a tag. Sem isso `atividadengx/src/main.ts:219` falha com `customElements.get(tag) === undefined`. Registro duplo permite dev standalone + uso embarcado na shell `:3000` |
| `src/app/app.config.ts:1-32` | Adicionado `APP_INITIALIZER` com `KeycloakService.initialize()` e `provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))` | Espelha `atividadengx/src/main.ts:74` `keycloak.init({onLoad:'login-required', pkceMethod:'S256'})`. Inicializa antes do bootstrap e injeta `Authorization: Bearer` em todas as requisicoes |
| `src/app/app.routes.ts:1-21` | Rota `posts` mudou para `features/posts/presentation` + `canActivate:[authGuard]`; adicionada rota `unauthorized` | Antes rota sem guard; agora protege `/posts` igual shell protege sidebar. `unauthorized` evita loop de redirect quando nao autenticado |
| `src/environments/environment.ts:1-9` e `environment.development.ts` | Adicionado bloco `keycloak:{url, realm, clientId}` | Valores devem ser identicos a `atividadengx/.env.example` (`VITE_KEYCLOAK_*`) e `keycloak/realm.json:2,22`. Sem isso KeycloakService nao encontra realm/client |
| `src/app/features/posts/presentation/posts.component.ts:1-23` | Movido de `src/app/components/posts` para Clean Arch + `encapsulation: ViewEncapsulation.ShadowDom` | Shell monta multiplos micro frontends na mesma pagina; sem ShadowDom CSS vazaria. Refatoracao alinha com padrao `tokens.css` da shell |
| `package.json:4-42` | `build` virou `ng build && node scripts/postbuild.mjs`; deps `+@angular/elements@21.2.22`, `+keycloak-js@26.2.4`; devDeps `+eslint@10.9.1`, `+typescript-eslint@8.69.0` | `@angular/elements` para `createCustomElement`; `keycloak-js` mesma versao da shell (26.2); `postbuild` gera `main.js` estavel; eslint para zero warnings na integracao |
| `package-lock.json` | Regenerado | Reflexo das deps acima |
| `src/index.html:1-13` | Formatado com Prettier (quebras, `/>`) | Padroniza com `.prettierrc` (`printWidth 100`, `singleQuote`) exigido pela shell para diff limpo |
| `src/app/core/interceptors/error.interceptor.ts:1` | Pequeno ajuste de import/formatting | Mantido compativel com nova ordem `authInterceptor` -> `errorInterceptor` |
| `src/app/app.config.server.ts:1-10` | Comentario explicando que `mergeApplicationConfig` reaproveita `APP_INITIALIZER` | Garante SSR nao quebra Web Component |
| `src/styles.css` | Vazio com comentario global | Mantido, estilos isolados no ShadowDom nao dependem dele |
| `angular.json` | Mantido `outputHashing:all` (production) | Necessario para `postbuild.mjs` copiar `main-*.js` -> `main.js` |
| `src/app/components/posts/*`, `src/app/models/post.ts`, `src/app/services/post.service.ts` | **Removidos** e reorganizados em `src/app/features/posts/{domain,data,presentation}` | Clean Arch: `domain/post.model.ts`, `data/post.repository.ts`, `presentation/posts.component.*` |

### Arquivos ADICIONADOS

| Arquivo | Conteudo | Motivo |
|---|---|---|
| `.env.example:1-7` | `FRONTEND_PORT=4200`, `KEYCLOAK_*`, `KEYCLOAK_ADMIN` | Template commitado igual a `atividadengx/.env.example`. Shell le `POSTS_CRUD_PORT` e este le `FRONTEND_PORT` (mesma porta 4200). Sem isso `docker-compose` nao sobe na mesma rede |
| `.env:1-7` (nao commitado) | Copia local de `.env.example` | Ignorado pelo git, bakeado em build |
| `Dockerfile:1-12` | Multi-stage `node:22-alpine` (`npm ci` + `npm run build`) -> `nginx:alpine` com `dist/primeiro-projeto/browser` | Identico a `atividadengx/Dockerfile:1`, permite `docker-compose.yml` da shell fazer `build: ../primeiro-projeto` na rede `app-network` |
| `docker-compose.yml:1-43` | Services `frontend` + `keycloak:26.2` com `app-network`, `healthcheck`, volumes `keycloak-data` e `realm.json` | Replica `atividadengx/docker-compose.yml:1` mas standalone. Shell orquestra `shell:3000` + `posts-crud:4200` + `keycloak:8080` juntos; este compose roda isolado para dev |
| `nginx.conf:1-42` | `try_files`, `location = /main.js` `no-cache` + CORS `*`, `location ~* \.(js...)` `immutable` + CORS, `gzip` | Copia `atividadengx/nginx.conf:11` mas com bloco extra `/main.js` estavel. Shell busca cross-origin `:3000` -> `:4200`; sem CORS bloqueia. `main.js` nao pode ser hasheado senao URL quebra |
| `keycloak/realm.json:1-64` | Realm `atividadengx`, client `frontend` `publicClient:true` + `pkce.code.challenge.method:S256`, `redirectUris` 3000/4200/4201/4202, `webOrigins:*`, user `Alec / Lost seas1` | **Copia identica** de `atividadengx/keycloak/realm.json:1`. Importado via `docker-compose volumes ./keycloak/realm.json:/opt/keycloak/data/import/realm.json` com `--import-realm`. Desalinhamento quebra login |
| `public/silent-check-sso.html:1` | `<script>parent.postMessage(location.href, location.origin)</script>` | Copiado de `atividadengx/public/silent-check-sso.html:1`, requerido por `silentCheckSsoRedirectUri` em `KeycloakService:23` |
| `scripts/postbuild.mjs:1-29` | Encontra `main-*.js` hasheado, copia para `main.js`, gera `microfrontend.json`, reescreve `index.html` | Angular `outputHashing:all` gera hash; shell precisa URL fixa `/main.js`. Sem script, `public/microfrontends.json` apontaria para arquivo inexistente |
| `src/app/core/auth/keycloak.service.ts:1-64` | Service `KeycloakService` com `signal`, `init({onLoad:'check-sso', pkceMethod:'S256', checkLoginIframe:false})`, `scheduleRefresh 20s`, `updateToken(30)` | Espelha `atividadengx/src/main.ts:62-128` mas como Angular service + `APP_INITIALIZER`. Deteccao `isEmbedded` evita duplo login quando dentro da shell |
| `src/app/core/auth/auth.guard.ts:1-17` | `CanActivateFn` que checa `isAuthenticated()` ou tenta `initialize()` senao `navigateByUrl('/unauthorized')` | Equivalente ao `login-required` da shell no nivel de rota Angular |
| `src/app/core/auth/auth.interceptor.ts:1-77` | `HttpInterceptorFn` injeta `Bearer`, fila `queue` + `refreshing` flag, trata `401` com `X-Retry` | Replica renovacao `updateToken(30)` da shell no nivel HTTP, enfileira requisicoes durante refresh |
| `src/app/core/interceptors/error.interceptor.spec.ts` | Testes do interceptor | Cobertura para novo fluxo 401 |
| `src/app/features/posts/domain/post.model.ts` | Interface `Post` | Extraido de `src/app/models/post.ts` para Clean Arch |
| `src/app/features/posts/data/post.repository.ts` (+ spec) | Repository com `httpResource` | Extraido de `src/app/services/post.service.ts`, mantem `apiUrl` |
| `src/app/features/posts/presentation/posts.component.*` (html/css/ts/spec) | Componente com `ShadowDom`, signals, paginacao | Movido e isolado |
| `src/app/shared/components/unauthorized/unauthorized.component.ts` | Pagina `/unauthorized` | Alvo do `authGuard` quando sem sessao |
| `src/app/shared/components/pagination/*` e `modal/confirm-modal.component.ts` | Componentes compartilhados | Extraidos para `shared` reutilizavel |
| `src/app/shared/styles/tokens.css` | Design tokens `--color-primary` etc | Alinha com `atividadengx/src/tokens.css:1`, evita hardcode |
| `eslint.config.mjs:1-20` | `typescript-eslint` recommended + rules `no-explicit-any:error` etc | Novo, garante zero warnings ao plugar na shell |
| `.prettierrc:1-12` e `.editorconfig:1-17` | `printWidth 100`, `singleQuote`, `indent 2` | Padroniza formatacao com a shell |
| `.gitignore` (mantido) | Ignora `dist`, `node_modules`, `.angular/cache` | Ja compativel; `.env` ja ignorado via `atividadengx/.gitignore` pattern |

### Como validar a compatibilidade

```bash
# 1. Build gera main.js estavel
npm run build
ls dist/primeiro-projeto/browser/main.js        # deve existir (postbuild)
cat dist/primeiro-projeto/browser/microfrontend.json

# 2. Docker standalone
docker compose up --build -d
curl -I http://localhost:4200/main.js            # 200 + Access-Control-Allow-Origin: *

# 3. Orquestrado pela shell (recomendado)
cd c:\Users\pc_ac\OneDrive\Desktop\atividadengx
docker compose up --build -d                     # sobe shell:3000 + posts-crud:4200 + keycloak:8080
# Verifique public/microfrontends.json da shell aponta para http://localhost:4200/main.js
# Acesse http://localhost:3000 -> botao "Posts CRUD (primeiro-projeto)" na sidebar
```
