import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';

import { KeycloakService } from './keycloak.service';

const RETRY_HEADER = 'X-Retry';

function withToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const keycloak = inject(KeycloakService);
  const token = keycloak.getToken();

  return next(token ? withToken(request, token) : request).pipe(
    catchError((error: unknown) => {
      const canRetry =
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !request.headers.has(RETRY_HEADER);

      if (!canRetry) return throwError(() => error);

      return from(keycloak.refreshToken()).pipe(
        switchMap((refreshed) => {
          const refreshedToken = keycloak.getToken();

          if (!refreshed || !refreshedToken) return throwError(() => error);

          const retry = withToken(request, refreshedToken).clone({
            setHeaders: { [RETRY_HEADER]: 'true' },
          });

          return next(retry);
        }),
      );
    }),
  );
};
