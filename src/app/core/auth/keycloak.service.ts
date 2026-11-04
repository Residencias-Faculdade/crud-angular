import { Injectable, signal } from '@angular/core';
import Keycloak from 'keycloak-js';

import { environment } from '../../../environments/environment';

const EMBEDDED_APP_PORT = '3000';
const REFRESH_INTERVAL_MS = 20_000;
const TOKEN_MIN_VALIDITY_SECONDS = 30;

@Injectable({ providedIn: 'root' })
export class KeycloakService {
  private instance: Keycloak | null = null;
  private initialization: Promise<boolean> | null = null;
  private refreshPromise: Promise<boolean> | null = null;
  private refreshInterval: ReturnType<typeof setInterval> | null = null;
  private readonly authenticated = signal(false);

  readonly isAuthenticated = this.authenticated.asReadonly();

  initialize(): Promise<boolean> {
    this.initialization ??= this.createSession().catch((error: unknown) => {
      this.initialization = null;
      throw error;
    });

    return this.initialization;
  }

  async login(): Promise<void> {
    await this.instance?.login();
  }

  async logout(): Promise<void> {
    await this.instance?.logout({ redirectUri: window.location.origin });
    this.stopAutoRefresh();
    this.authenticated.set(false);
  }

  getToken(): string | undefined {
    return this.instance?.token;
  }

  refreshToken(): Promise<boolean> {
    if (!this.instance) return Promise.resolve(false);

    this.refreshPromise ??= this.instance
      .updateToken(TOKEN_MIN_VALIDITY_SECONDS)
      .then(() => {
        const authenticated = Boolean(this.instance?.token);
        this.authenticated.set(authenticated);
        return authenticated;
      })
      .catch(() => {
        this.authenticated.set(false);
        return false;
      })
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  private async createSession(): Promise<boolean> {
    this.instance = new Keycloak({
      url: environment.keycloak.url,
      realm: environment.keycloak.realm,
      clientId: environment.keycloak.clientId,
    });

    const embedded = this.isEmbedded();

    const authenticated = await this.instance.init({
      onLoad: embedded ? undefined : 'check-sso',
      silentCheckSsoRedirectUri: embedded
        ? undefined
        : `${window.location.origin}/silent-check-sso.html`,
      pkceMethod: 'S256',
      checkLoginIframe: false,
    });

    this.authenticated.set(authenticated);
    this.startAutoRefresh();

    return authenticated;
  }

  private isEmbedded(): boolean {
    return window.location.port === EMBEDDED_APP_PORT;
  }

  private startAutoRefresh(): void {
    if (this.refreshInterval !== null) return;

    this.refreshInterval = setInterval(() => {
      void this.refreshToken();
    }, REFRESH_INTERVAL_MS);
  }

  private stopAutoRefresh(): void {
    if (this.refreshInterval === null) return;

    clearInterval(this.refreshInterval);
    this.refreshInterval = null;
  }
}
