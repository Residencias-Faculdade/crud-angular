/**
 * COMPATIBILIDADE COM ATIVIDADENGX - authInterceptor
 * ARQUIVO NOVO. Injeta Authorization: Bearer <token> em toda requisicao HttpClient.
 * Em 401 tenta refreshToken() (updateToken 30s) e enfileira requisicoes concorrentes,
 * igual logica de renovacao da shell (scheduleRefresh) mas no nivel HTTP.
 * Header X-Retry evita loop infinito.
 */
import { HttpErrorResponse, HttpEvent, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs';

import { KeycloakService } from './keycloak.service';

let refreshing = false;
let queue: Array<(token: string) => void> = [];

function drainQueue(token: string): void {
  queue.forEach((callback) => callback(token));
  queue = [];
}

function addToQueue(callback: (token: string) => void): void {
  queue.push(callback);
}

function attachToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const keycloak = inject(KeycloakService);
  const token = keycloak.getToken();
  const outgoing = token ? attachToken(request, token) : request;

  return next(outgoing).pipe(
    catchError((error: unknown) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        request.headers.has('X-Retry')
      ) {
        return throwError(() => error);
      }

      if (refreshing) {
        return new Observable<HttpEvent<unknown>>((observer) => {
          addToQueue((newToken: string) => {
            const retry = attachToken(request, newToken).clone({
              setHeaders: { 'X-Retry': 'true' },
            });
            next(retry).subscribe({
              next: (value) => observer.next(value),
              error: (errorValue: unknown) => observer.error(errorValue),
              complete: () => observer.complete(),
            });
          });
        });
      }

      refreshing = true;

      return from(keycloak.refreshToken()).pipe(
        switchMap((refreshed) => {
          refreshing = false;
          if (!refreshed) {
            queue = [];
            return throwError(() => error);
          }
          const newToken = keycloak.getToken();
          if (!newToken) return throwError(() => error);
          drainQueue(newToken);
          const retry = attachToken(request, newToken).clone({ setHeaders: { 'X-Retry': 'true' } });
          return next(retry);
        }),
        catchError((refreshError: unknown) => {
          refreshing = false;
          queue = [];
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
