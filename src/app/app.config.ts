import { isPlatformBrowser } from '@angular/common';
import {
  ApplicationConfig,
  PLATFORM_ID,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { KeycloakService } from './core/auth/keycloak.service';
import { authInterceptor } from './core/auth/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(
      withFetch(),
      withInterceptors(
        environment.auth.enabled ? [authInterceptor, errorInterceptor] : [errorInterceptor],
      ),
    ),
    provideAppInitializer(() => {
      if (!environment.auth.enabled || !isPlatformBrowser(inject(PLATFORM_ID))) return;

      return inject(KeycloakService)
        .initialize()
        .catch(() => false);
    }),
  ],
};
