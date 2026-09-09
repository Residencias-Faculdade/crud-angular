import {
  APP_INITIALIZER,
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
// COMPATIBILIDADE ATIVIDADENGX - imports adicionados:
import { KeycloakService } from './core/auth/keycloak.service'; // NOVO: auth Keycloak espelhado da shell
import { authInterceptor } from './core/auth/auth.interceptor'; // NOVO: injeta Bearer token
import { errorInterceptor } from './core/interceptors/error.interceptor';

// COMPATIBILIDADE ATIVIDADENGX - APP_INITIALIZER keycloak
// Antes: apenas provideHttpClient com errorInterceptor
// Agora: inicializa Keycloak antes do bootstrap (similar a atividadengx/src/main.ts:70 initAuth)
// catch(() => false) evita travar app se Keycloak estiver fora do ar (exibe /unauthorized via guard)
function initializeKeycloak(keycloak: KeycloakService): () => Promise<boolean> {
  return () => keycloak.initialize().catch(() => false);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    // MODIFICADO: adicionado authInterceptor antes do errorInterceptor (ordem importa: auth injeta token primeiro)
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorInterceptor])),
    // ADICIONADO: APP_INITIALIZER que bloqueia bootstrap até Keycloak.init() resolver
    // Equivalente ao await keycloak.init({ onLoad:'check-sso', pkceMethod:'S256' }) da shell
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      deps: [KeycloakService],
      multi: true,
    },
  ],
};
