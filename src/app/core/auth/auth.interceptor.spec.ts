import { HttpEvent, HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { authInterceptor } from './auth.interceptor';
import { KeycloakService } from './keycloak.service';

describe('authInterceptor', () => {
  let keycloak: { getToken: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    keycloak = { getToken: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: KeycloakService, useValue: keycloak }],
    });
  });

  it('should add Authorization header when token exists', () => {
    keycloak.getToken.mockReturnValue('test-token');
    const request = new HttpRequest('GET', '/api/posts');
    const next = vi.fn().mockReturnValue(of({} as HttpEvent<unknown>));

    TestBed.runInInjectionContext(() => {
      const result = authInterceptor(request, next as never);
      expect(next).toHaveBeenCalled();
      const forwarded = next.mock.calls[0][0] as HttpRequest<unknown>;
      expect(forwarded.headers.get('Authorization')).toBe('Bearer test-token');
      expect(result).toBeTruthy();
    });
  });

  it('should forward without header when no token', () => {
    keycloak.getToken.mockReturnValue(undefined);
    const request = new HttpRequest('GET', '/api/posts');
    const next = vi.fn().mockReturnValue(of({} as HttpEvent<unknown>));

    TestBed.runInInjectionContext(() => {
      const result = authInterceptor(request, next as never);
      expect(next).toHaveBeenCalledWith(request);
      expect(result).toBeTruthy();
    });
  });

  it('should forward empty token as no header', () => {
    keycloak.getToken.mockReturnValue('');
    const request = new HttpRequest('GET', '/api/posts');
    const next = vi.fn().mockReturnValue(of({} as HttpEvent<unknown>));

    TestBed.runInInjectionContext(() => {
      const result = authInterceptor(request, next as never);
      expect(next).toHaveBeenCalledWith(request);
      expect(result).toBeTruthy();
    });
  });
});
