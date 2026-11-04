import { TestBed } from '@angular/core/testing';

import { KeycloakService } from './keycloak.service';

vi.mock('keycloak-js', () => {
  class KeycloakMock {
    readonly token = 'mock-token';
    readonly init = vi.fn().mockResolvedValue(true);
    readonly login = vi.fn().mockResolvedValue(undefined);
    readonly logout = vi.fn().mockResolvedValue(undefined);
    readonly updateToken = vi.fn().mockResolvedValue(true);
  }

  return { default: KeycloakMock };
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

  it('should cache the initialization', async () => {
    await service.initialize();
    await service.initialize();

    expect(service.isAuthenticated()).toBe(true);
  });

  it('should return the current token', async () => {
    await service.initialize();

    expect(service.getToken()).toBe('mock-token');
  });

  it('should login', async () => {
    await service.initialize();

    await expect(service.login()).resolves.toBeUndefined();
  });

  it('should logout and clear the session', async () => {
    await service.initialize();

    await expect(service.logout()).resolves.toBeUndefined();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should refresh the token', async () => {
    await service.initialize();

    const refreshed = await service.refreshToken();

    expect(refreshed).toBe(true);
  });

  it('should handle refresh failures', async () => {
    const failingInstance = {
      init: vi.fn().mockResolvedValue(true),
      updateToken: vi.fn().mockRejectedValue(new Error('failed')),
      token: undefined,
    };
    const freshService = new KeycloakService();
    (freshService as unknown as { instance: unknown }).instance = failingInstance;

    const result = await freshService.refreshToken();

    expect(result).toBe(false);
  });

  it('should be a no-op before initialization', async () => {
    const freshService = new KeycloakService();

    await expect(freshService.login()).resolves.toBeUndefined();
    await expect(freshService.logout()).resolves.toBeUndefined();
    expect(freshService.getToken()).toBeUndefined();
    await expect(freshService.refreshToken()).resolves.toBe(false);
  });
});
