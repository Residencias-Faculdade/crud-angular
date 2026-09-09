/**
 * COMPATIBILIDADE COM ATIVIDADENGX - KeycloakService
 * --------------------------------------------------
 * ARQUIVO NOVO criado para espelhar atividadengx/src/main.ts:62-128
 * Mesma lib keycloak-js@26.2, mesmo realm/client, mesmo PKCE S256.
 * Diferenca: aqui como Angular service com signal isAuthenticated + APP_INITIALIZER,
 * na shell como funcao initAuth() procedural.
 * Sincronizado com keycloak/realm.json (realm atividadengx, client frontend publicClient:true).
 */
import { Injectable, signal } from '@angular/core';
import Keycloak from 'keycloak-js';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class KeycloakService {
  private instance: Keycloak | null = null;
  private readonly authenticated = signal(false);

  readonly isAuthenticated = this.authenticated.asReadonly();

  async initialize(): Promise<boolean> {
    this.instance = new Keycloak({
      url: environment.keycloak.url,
      realm: environment.keycloak.realm,
      clientId: environment.keycloak.clientId,
    });

    // Compatibilidade shell: se estiver dentro da casca (:3000) ja existe sessao da shell,
    // entao nao força check-sso/silentCheck para evitar duplo login. Fora da shell usa check-sso.
    const isEmbedded = window.location.port === '3000' && !!customElements.get('posts-crud');
    const authenticated = await this.instance.init({
      onLoad: isEmbedded ? undefined : 'check-sso', // shell usa login-required; standalone usa check-sso
      silentCheckSsoRedirectUri: isEmbedded ? undefined : `${window.location.origin}/silent-check-sso.html`, // requer public/silent-check-sso.html
      pkceMethod: 'S256', // deve casar com realm.json attributes pkce.code.challenge.method
      checkLoginIframe: false, // desativa iframe legacy (usa silent-check)
    });

    this.authenticated.set(authenticated);
    this.scheduleRefresh();
    return authenticated;
  }

  login(): Promise<void> {
    if (!this.instance) return Promise.resolve();
    return this.instance.login();
  }

  logout(): Promise<void> {
    if (!this.instance) return Promise.resolve();
    return this.instance.logout({ redirectUri: window.location.origin });
  }

  getToken(): string | undefined {
    return this.instance?.token;
  }

  async refreshToken(): Promise<boolean> {
    if (!this.instance) return false;
    try {
      const refreshed = await this.instance.updateToken(30);
      return refreshed;
    } catch {
      this.authenticated.set(false);
      return false;
    }
  }

  // Renova token a cada 20s se expira em <30s, igual a shell scheduleRefresh() 20s/30s
  private scheduleRefresh(): void {
    if (!this.instance) return;
    setInterval(() => {
      void this.refreshToken(); // usa updateToken(30) interno
    }, 20000);
  }
}
