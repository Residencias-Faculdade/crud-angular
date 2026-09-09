/**
 * COMPATIBILIDADE COM ATIVIDADENGX (shell micro-frontend)
 * ------------------------------------------------------
 * Este arquivo foi MODIFICADO para expor o CRUD como Web Component.
 * - Antes: apenas bootstrapApplication(App) standalone.
 * - Agora: dual-mode via @angular/elements + createCustomElement:
 *   1) Standalone (dev/local): bootstrapApplication(App) quando NAO ha <posts-crud> no DOM
 *   2) Web Component (shell): customElements.define('posts-crud', ...) quando a
 *      casca atividadengx injeta <script src="http://localhost:4200/main.js"> e
 *      monta <posts-crud> via public/microfrontends.json.
 * Por que: atividadengx/src/main.ts:219 carrega dinamicamente main.js com
 *   customElements.get(tag) guard + CORS *. Sem esse registro a shell nao encontra o elemento.
 * Dependencia adicionada em package.json: @angular/elements.
 */
import { createApplication } from '@angular/platform-browser';
import { bootstrapApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';

import { appConfig } from './app/app.config';
import { App } from './app/app';
import { PostsComponent } from './app/features/posts/presentation/posts.component';

// Tag deve conter hifen (spec Custom Elements) e ser unica no shell.
// Guard customElements.get evita "Already defined" se main.js for carregado 2x pela shell.
const elementName = 'posts-crud';

async function defineElement(): Promise<void> {
  if (customElements.get(elementName)) return; // idempotente p/ shell que faz loadScript()
  const application = await createApplication(appConfig);
  const element = createCustomElement(PostsComponent, { injector: application.injector });
  customElements.define(elementName, element);
}

// Deteccao de modo: se a pagina ja contem <posts-crud> ou ?element=true => modo elemento
const useElement =
  document.querySelector(elementName) !== null ||
  new URLSearchParams(window.location.search).has('element');

if (useElement) {
  // Modo Web Component puro (usado quando a shell injeta direto sem bootstrap do App)
  void defineElement();
} else {
  // Modo hibrido: roda app Angular completo + registra o elemento para a shell
  // Isso permite dev local em :4200 E consumo simultaneo pela shell em :3000
  bootstrapApplication(App, appConfig).catch((error: unknown) => console.error(error));
  void defineElement(); // registra sempre para que main.js responda a shell mesmo em standalone
}
