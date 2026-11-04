import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((error: unknown) => {
      const message =
        error instanceof HttpErrorResponse
          ? error.error instanceof ErrorEvent
            ? `Erro do cliente: ${error.error.message}`
            : `API ${error.status} - ${error.message}`
          : 'Erro inesperado';

      console.error(`[HTTP ${request.method} ${request.url}]`, message);

      return throwError(() => new Error(message));
    }),
  );
