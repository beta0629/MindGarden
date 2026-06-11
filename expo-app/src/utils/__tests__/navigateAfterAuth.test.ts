jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));

jest.mock('@/stores/useAuthStore', () => ({
  useAuthStore: { getState: jest.fn() },
}));

jest.mock('@/services/NotificationService', () => ({
  NotificationService: { registerToken: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock('@/lib/getMmkv', () => ({
  createZustandMmkvPersistStorage: () => ({
    getItem: async () => null,
    setItem: async () => undefined,
    removeItem: async () => undefined,
  }),
}));

jest.mock('@/stores/useEulaConsentStore', () => ({
  shouldShowEulaGateFromCache: jest.fn(() => false),
  useEulaConsentStore: {
    getState: jest.fn(() => ({ setRecord: jest.fn() })),
  },
}));

jest.mock('@/services/eulaConsentService', () => ({
  fetchEulaConsentStatus: jest.fn(async () => ({
    currentVersion: '1.0.0',
    acceptedVersion: '1.0.0',
    acceptedAt: '2026-06-11T00:00:00Z',
    marketingConsent: false,
    requiresReconsent: false,
  })),
}));

import { router } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { NotificationService } from '@/services/NotificationService';
import {
  shouldShowEulaGateFromCache,
  useEulaConsentStore,
} from '@/stores/useEulaConsentStore';
import { fetchEulaConsentStatus } from '@/services/eulaConsentService';
import {
  EULA_CONSENT_HREF,
  navigateAfterAuthenticated,
  resolvePostAuthHomeHref,
} from '../navigateAfterAuth';
import {
  POST_AUTH_HOME_ADMIN,
  POST_AUTH_HOME_CLIENT,
  POST_AUTH_HOME_CONSULTANT,
} from '../resolvePostAuthHomeHref';

function fakeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.sig`;
}

describe('navigateAfterAuthenticated', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (shouldShowEulaGateFromCache as jest.Mock).mockReturnValue(false);
    (useEulaConsentStore.getState as jest.Mock).mockReturnValue({ setRecord: jest.fn() });
    (fetchEulaConsentStatus as jest.Mock).mockResolvedValue({
      currentVersion: '1.0.0',
      acceptedVersion: '1.0.0',
      acceptedAt: '2026-06-11T00:00:00Z',
      marketingConsent: false,
      requiresReconsent: false,
    });
  });

  it('prefers JWT admin role over stale client store role', async () => {
    const adminToken = fakeJwt({ role: 'ADMIN' });
    (useAuthStore.getState as jest.Mock).mockReturnValue({
      role: 'client',
      accessToken: adminToken,
      user: { id: 1 },
    });

    await navigateAfterAuthenticated();

    expect(router.replace).toHaveBeenCalledWith(POST_AUTH_HOME_ADMIN);
    expect(NotificationService.registerToken).toHaveBeenCalled();
  });

  it('falls back to store role when JWT has no role claims', async () => {
    const bareToken = fakeJwt({ sub: '1', tenantId: 't1' });
    (useAuthStore.getState as jest.Mock).mockReturnValue({
      role: 'staff',
      accessToken: bareToken,
      user: { id: 2 },
    });

    await navigateAfterAuthenticated();

    expect(router.replace).toHaveBeenCalledWith(POST_AUTH_HOME_ADMIN);
  });

  it('Apple G1.2 — EULA 캐시 미스 + BE requiresReconsent true 면 EULA 화면으로 이동', async () => {
    (shouldShowEulaGateFromCache as jest.Mock).mockReturnValue(true);
    (fetchEulaConsentStatus as jest.Mock).mockResolvedValueOnce({
      currentVersion: '1.0.0',
      acceptedVersion: null,
      acceptedAt: null,
      marketingConsent: false,
      requiresReconsent: true,
    });
    (useAuthStore.getState as jest.Mock).mockReturnValue({
      role: 'client',
      accessToken: fakeJwt({ role: 'CLIENT' }),
      user: { id: 9 },
    });

    await navigateAfterAuthenticated();

    expect(router.replace).toHaveBeenCalledWith(EULA_CONSENT_HREF);
    expect(NotificationService.registerToken).not.toHaveBeenCalled();
  });

  it('Apple G1.2 — skipEulaGate=true 면 EULA 검사 없이 홈으로', async () => {
    (shouldShowEulaGateFromCache as jest.Mock).mockReturnValue(true);
    (useAuthStore.getState as jest.Mock).mockReturnValue({
      role: 'client',
      accessToken: fakeJwt({ role: 'CLIENT' }),
      user: { id: 10 },
    });

    await navigateAfterAuthenticated({ skipEulaGate: true });

    expect(fetchEulaConsentStatus).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith(POST_AUTH_HOME_CLIENT);
  });
});

describe('resolvePostAuthHomeHref', () => {
  it('routes admin and staff to admin home', () => {
    expect(resolvePostAuthHomeHref('admin')).toBe(POST_AUTH_HOME_ADMIN);
    expect(resolvePostAuthHomeHref('staff')).toBe(POST_AUTH_HOME_ADMIN);
  });

  it('routes consultant to consultant home', () => {
    expect(resolvePostAuthHomeHref('consultant')).toBe(POST_AUTH_HOME_CONSULTANT);
  });

  it('routes client and unknown roles to client home', () => {
    expect(resolvePostAuthHomeHref('client')).toBe(POST_AUTH_HOME_CLIENT);
    expect(resolvePostAuthHomeHref(null)).toBe(POST_AUTH_HOME_CLIENT);
    expect(resolvePostAuthHomeHref(undefined)).toBe(POST_AUTH_HOME_CLIENT);
  });
});
