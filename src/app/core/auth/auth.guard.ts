/**
 * COMPATIBILIDADE COM ATIVIDADENGX - authGuard
 * ARQUIVO NOVO. Shell protege via initAuth login-required; aqui via CanActivateFn em app.routes.ts
 * Se ja autenticado (signal) libera; senao tenta initialize() e se falhar -> /unauthorized
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { KeycloakService } from './keycloak.service';

export const authGuard: CanActivateFn = async () => {
  const keycloak = inject(KeycloakService);
  const router = inject(Router);

  if (keycloak.isAuthenticated()) return true;

  const hasSession = await keycloak.initialize().catch(() => false);
  if (hasSession) return true;

  await router.navigateByUrl('/unauthorized');
  return false;
};
