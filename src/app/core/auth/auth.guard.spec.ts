import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { authGuard } from './auth.guard';
import { KeycloakService } from './keycloak.service';

describe('authGuard', () => {
  let keycloak: { isAuthenticated: ReturnType<typeof vi.fn>; initialize: ReturnType<typeof vi.fn> };
  let router: { navigateByUrl: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    TestBed.resetTestingModule();
    keycloak = {
      isAuthenticated: vi.fn(),
      initialize: vi.fn(),
    };
    router = { navigateByUrl: vi.fn().mockResolvedValue(true) };

    TestBed.configureTestingModule({
      providers: [
        { provide: KeycloakService, useValue: keycloak },
        { provide: Router, useValue: router },
      ],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('should allow when already authenticated', async () => {
    keycloak.isAuthenticated.mockReturnValue(true);
    const result = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(result).toBe(true);
  });

  it('should initialize and allow when session exists', async () => {
    keycloak.isAuthenticated.mockReturnValue(false);
    keycloak.initialize.mockResolvedValue(true);
    const result = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(keycloak.initialize).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('should redirect to unauthorized when not authenticated', async () => {
    keycloak.isAuthenticated.mockReturnValue(false);
    keycloak.initialize.mockResolvedValue(false);
    const result = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(router.navigateByUrl).toHaveBeenCalledWith('/unauthorized');
    expect(result).toBe(false);
  });

  it('should handle initialize rejection', async () => {
    keycloak.isAuthenticated.mockReturnValue(false);
    keycloak.initialize.mockRejectedValue(new Error('network'));
    const result = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(result).toBe(false);
  });
});
