import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message =
        error.error instanceof ErrorEvent
          ? `Erro do cliente: ${error.error.message}`
          : `API ${error.status} - ${error.message}`;

      console.error(`[HTTP ${req.method} ${req.url}]`, message);

      return throwError(() => new Error(message));
    })
  );
