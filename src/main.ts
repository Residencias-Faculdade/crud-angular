import { bootstrapApplication, createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';

import { appConfig } from './app/app.config';
import { App } from './app/app';
import { KeycloakService } from './app/core/auth/keycloak.service';
import { PostsComponent } from './app/features/posts/presentation/posts.component';
import { environment } from './environments/environment';

const ELEMENT_NAME = 'posts-crud';

const elementRequested =
  document.querySelector(ELEMENT_NAME) !== null ||
  new URLSearchParams(window.location.search).has('element');

async function defineElement(): Promise<void> {
  if (customElements.get(ELEMENT_NAME)) return;

  const application = await createApplication(appConfig);

  if (environment.auth.enabled) {
    await application.injector
      .get(KeycloakService)
      .initialize()
      .catch(() => false);
  }

  const element = createCustomElement(PostsComponent, { injector: application.injector });

  customElements.define(ELEMENT_NAME, element);
}

async function start(): Promise<void> {
  if (elementRequested) {
    await defineElement();
    return;
  }

  await bootstrapApplication(App, appConfig);
}

void start().catch((error: unknown) => console.error(error));
