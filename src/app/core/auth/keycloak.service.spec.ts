import { TestBed } from '@angular/core/testing';

import { KeycloakService } from './keycloak.service';

vi.mock('keycloak-js', () => {
  return {
    default: vi.fn(function (this: unknown) {
      return {
        init: vi.fn().mockResolvedValue(true),
        login: vi.fn().mockResolvedValue(undefined),
        logout: vi.fn().mockResolvedValue(undefined),
        updateToken: vi.fn().mockResolvedValue(true),
        token: 'mock-token',
      };
    }),
  };
});

describe('KeycloakService', () => {
  let service: KeycloakService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [KeycloakService] });
    service = TestBed.inject(KeycloakService);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should initialize and set authenticated', async () => {
    const result = await service.initialize();
    expect(result).toBe(true);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should return token', async () => {
    await service.initialize();
    expect(service.getToken()).toBe('mock-token');
  });

  it('should login', async () => {
    await service.initialize();
    await expect(service.login()).resolves.toBeUndefined();
  });

  it('should logout', async () => {
    await service.initialize();
    await expect(service.logout()).resolves.toBeUndefined();
  });

  it('should refresh token', async () => {
    await service.initialize();
    const refreshed = await service.refreshToken();
    expect(refreshed).toBe(true);
  });

  it('should handle refresh failure', async () => {
    const failingInstance = {
      init: vi.fn().mockResolvedValue(true),
      updateToken: vi.fn().mockRejectedValue(new Error('failed')),
      token: undefined,
    } as unknown as InstanceType<typeof import('keycloak-js').default>;
    const freshService = new KeycloakService();
    (freshService as unknown as { instance: unknown }).instance = failingInstance;
    const result = await freshService.refreshToken();
    expect(result).toBe(false);
  });

  it('should handle initialize without instance for login', async () => {
    const freshService = new KeycloakService();
    await expect(freshService.login()).resolves.toBeUndefined();
    await expect(freshService.logout()).resolves.toBeUndefined();
    expect(freshService.getToken()).toBeUndefined();
  });
});
