import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { KeycloakService } from './keycloak.service';

export const authGuard: CanActivateFn = () => {
  if (!environment.auth.enabled) return true;

  const keycloak = inject(KeycloakService);
  const router = inject(Router);

  if (keycloak.isAuthenticated()) return true;

  return keycloak.initialize().then(
    (authenticated) => authenticated || router.createUrlTree(['/unauthorized']),
    () => router.createUrlTree(['/unauthorized']),
  );
};
