import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';

import { environment } from '../../../environments/environment';
import { authGuard } from './auth.guard';
import { KeycloakService } from './keycloak.service';

describe('authGuard', () => {
  const authEnabled = environment.auth.enabled;
  let keycloak: { isAuthenticated: ReturnType<typeof vi.fn>; initialize: ReturnType<typeof vi.fn> };
  let router: { createUrlTree: ReturnType<typeof vi.fn> };
  let unauthorized: UrlTree;

  beforeEach(() => {
    environment.auth.enabled = true;
    TestBed.resetTestingModule();
    keycloak = {
      isAuthenticated: vi.fn(),
      initialize: vi.fn(),
    };
    unauthorized = {} as UrlTree;
    router = { createUrlTree: vi.fn().mockReturnValue(unauthorized) };

    TestBed.configureTestingModule({
      providers: [
        { provide: KeycloakService, useValue: keycloak },
        { provide: Router, useValue: router },
      ],
    });
  });

  afterEach(() => {
    environment.auth.enabled = authEnabled;
    TestBed.resetTestingModule();
  });

  it('should allow access when authentication is disabled', async () => {
    environment.auth.enabled = false;

    const result = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toBe(true);
    expect(keycloak.isAuthenticated).not.toHaveBeenCalled();
  });

  it('should allow when already authenticated', async () => {
    keycloak.isAuthenticated.mockReturnValue(true);

    const result = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toBe(true);
    expect(keycloak.initialize).not.toHaveBeenCalled();
  });

  it('should initialize and allow when a session exists', async () => {
    keycloak.isAuthenticated.mockReturnValue(false);
    keycloak.initialize.mockResolvedValue(true);

    const result = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(keycloak.initialize).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('should return the unauthorized route when no session exists', async () => {
    keycloak.isAuthenticated.mockReturnValue(false);
    keycloak.initialize.mockResolvedValue(false);

    const result = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(router.createUrlTree).toHaveBeenCalledWith(['/unauthorized']);
    expect(result).toBe(unauthorized);
  });

  it('should return the unauthorized route when initialization fails', async () => {
    keycloak.isAuthenticated.mockReturnValue(false);
    keycloak.initialize.mockRejectedValue(new Error('network'));

    const result = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toBe(unauthorized);
  });
});
