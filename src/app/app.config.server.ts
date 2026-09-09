// NOTA: este arquivo NAO foi alterado para compatibilidade, mas permanece compativel:
// mergeApplicationConfig reaproveita appConfig que agora contem Keycloak APP_INITIALIZER.
// SSR nao interfere no Web Component (ShadowDom) que roda no browser.
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering(withRoutes(serverRoutes))],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
