import { router } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { NotificationService } from '@/services/NotificationService';
import {
  navigateAfterAuthenticated,
  resolvePostAuthHomeHref,
} from '../navigateAfterAuth';
import {
  POST_AUTH_HOME_ADMIN,
  POST_AUTH_HOME_CLIENT,
  POST_AUTH_HOME_CONSULTANT,
} from '../resolvePostAuthHomeHref';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));

jest.mock('@/stores/useAuthStore', () => ({
  useAuthStore: { getState: jest.fn() },
}));

jest.mock('@/services/NotificationService', () => ({
  NotificationService: { registerToken: jest.fn().mockResolvedValue(undefined) },
}));

function fakeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.sig`;
}

describe('navigateAfterAuthenticated', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('prefers JWT admin role over stale client store role', async () => {
    const adminToken = fakeJwt({ role: 'ADMIN' });
    (useAuthStore.getState as jest.Mock).mockReturnValue({
      role: 'client',
      accessToken: adminToken,
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
    });

    await navigateAfterAuthenticated();

    expect(router.replace).toHaveBeenCalledWith(POST_AUTH_HOME_ADMIN);
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
