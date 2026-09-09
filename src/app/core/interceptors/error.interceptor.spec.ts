import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should pass through successful response', async () => {
    const request = new HttpRequest('GET', '/api/posts');
    const next = vi.fn().mockReturnValue(of({} as never));

    const result = TestBed.runInInjectionContext(() => errorInterceptor(request, next as never));
    expect(result).toBeTruthy();
    let completed = false;
    result.subscribe({ complete: () => (completed = true) });
    expect(completed).toBe(true);
  });

  it('should transform HttpErrorResponse into Error', async () => {
    const request = new HttpRequest('GET', '/api/posts');
    const httpError = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });
    const next = vi.fn().mockReturnValue(throwError(() => httpError));

    TestBed.runInInjectionContext(() => {
      const result$ = errorInterceptor(request, next as never);
      result$.subscribe({
        error: (error: Error) => {
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toContain('500');
        },
      });
    });
  });

  it('should handle client side ErrorEvent', async () => {
    const request = new HttpRequest('GET', '/api/posts');
    const errorEvent = new ErrorEvent('Network error', { message: 'failed' });
    const httpError = new HttpErrorResponse({ error: errorEvent, status: 0 });
    const next = vi.fn().mockReturnValue(throwError(() => httpError));

    TestBed.runInInjectionContext(() => {
      const result$ = errorInterceptor(request, next as never);
      result$.subscribe({
        error: (error: Error) => {
          expect(error.message).toContain('Erro do cliente');
        },
      });
    });
  });
});
