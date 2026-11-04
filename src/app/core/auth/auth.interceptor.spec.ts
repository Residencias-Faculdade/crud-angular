import { HttpErrorResponse, HttpEvent, HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { authInterceptor } from './auth.interceptor';
import { KeycloakService } from './keycloak.service';

describe('authInterceptor', () => {
  let keycloak: {
    getToken: ReturnType<typeof vi.fn>;
    refreshToken: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    keycloak = {
      getToken: vi.fn(),
      refreshToken: vi.fn().mockResolvedValue(true),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: KeycloakService, useValue: keycloak }],
    });
  });

  it('should add Authorization header when a token exists', () => {
    keycloak.getToken.mockReturnValue('test-token');
    const request = new HttpRequest('GET', '/api/posts');
    const next = vi.fn().mockReturnValue(of({} as HttpEvent<unknown>));

    TestBed.runInInjectionContext(() => {
      const result = authInterceptor(request, next as never);
      const forwarded = next.mock.calls[0][0] as HttpRequest<unknown>;

      expect(forwarded.headers.get('Authorization')).toBe('Bearer test-token');
      expect(result).toBeTruthy();
    });
  });

  it('should forward the request without a header when no token exists', () => {
    keycloak.getToken.mockReturnValue(undefined);
    const request = new HttpRequest('GET', '/api/posts');
    const next = vi.fn().mockReturnValue(of({} as HttpEvent<unknown>));

    TestBed.runInInjectionContext(() => {
      authInterceptor(request, next as never);

      expect(next).toHaveBeenCalledWith(request);
    });
  });

  it('should refresh the token and retry once after a 401', async () => {
    keycloak.getToken.mockReturnValueOnce('expired-token').mockReturnValue('fresh-token');
    const request = new HttpRequest('GET', '/api/posts');
    const unauthorized = new HttpErrorResponse({ status: 401 });
    const finalNext = vi
      .fn()
      .mockImplementation((retryRequest: HttpRequest<unknown>) =>
        retryRequest.headers.get('Authorization') === 'Bearer fresh-token'
          ? of({} as HttpEvent<unknown>)
          : throwError(() => unauthorized),
      );

    await TestBed.runInInjectionContext(async () => {
      await firstValueFrom(authInterceptor(request, finalNext as never));

      expect(keycloak.refreshToken).toHaveBeenCalled();
      expect(finalNext).toHaveBeenCalledTimes(2);
      expect(finalNext.mock.calls[1][0].headers.get('X-Retry')).toBe('true');
    });
  });

  it('should not retry when the request was already retried', () => {
    keycloak.getToken.mockReturnValue('expired-token');
    const request = new HttpRequest('GET', '/api/posts').clone({
      setHeaders: { 'X-Retry': 'true' },
    });
    const next = vi.fn().mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    TestBed.runInInjectionContext(() => {
      authInterceptor(request, next as never).subscribe({ error: () => undefined });

      expect(keycloak.refreshToken).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
