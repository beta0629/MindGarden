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
  NotificationService: {
    registerToken: jest.fn().mockResolvedValue(true),
    registerTokenWithClaimRetry: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('@/components/organisms/InAppNotificationToast', () => ({
  showInAppToast: jest.fn(),
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
      user: { id: 1, email: 'a@b.c', name: 'A', role: 'client' },
    });

    await navigateAfterAuthenticated();

    expect(router.replace).toHaveBeenCalledWith(POST_AUTH_HOME_ADMIN);
    expect(NotificationService.registerTokenWithClaimRetry).toHaveBeenCalledWith({
      notifyUser: false,
    });
  });

  it('routes dual admin (counselingEnabled) to admin home — operator wins', async () => {
    (useAuthStore.getState as jest.Mock).mockReturnValue({
      role: 'admin',
      accessToken: fakeJwt({ role: 'ADMIN' }),
      user: {
        id: 1,
        email: 'dual@test.c',
        name: 'Dual',
        role: 'admin',
        counselingEnabled: true,
        hasOperatorRole: true,
        hasCounselorRole: true,
      },
    });

    await navigateAfterAuthenticated();

    expect(router.replace).toHaveBeenCalledWith(POST_AUTH_HOME_ADMIN);
  });

  it('routes counselor-only to consultant home via capability', async () => {
    (useAuthStore.getState as jest.Mock).mockReturnValue({
      role: 'consultant',
      accessToken: fakeJwt({ role: 'CONSULTANT' }),
      user: { id: 2, email: 'c@b.c', name: 'C', role: 'consultant', hasCounselorRole: true },
    });

    await navigateAfterAuthenticated();

    expect(router.replace).toHaveBeenCalledWith(POST_AUTH_HOME_CONSULTANT);
  });

  it('awaits push claim even when register fails', async () => {
    (NotificationService.registerTokenWithClaimRetry as jest.Mock).mockResolvedValueOnce(false);
    (useAuthStore.getState as jest.Mock).mockReturnValue({
      role: 'consultant',
      accessToken: fakeJwt({ role: 'CONSULTANT' }),
      user: { id: 3, email: 'c2@b.c', name: 'C2', role: 'consultant' },
    });

    await navigateAfterAuthenticated();

    expect(router.replace).toHaveBeenCalledWith(POST_AUTH_HOME_CONSULTANT);
    expect(NotificationService.registerTokenWithClaimRetry).toHaveBeenCalledTimes(1);
  });

  it('falls back to store role when JWT has no role claims', async () => {
    const bareToken = fakeJwt({ sub: '1', tenantId: 't1' });
    (useAuthStore.getState as jest.Mock).mockReturnValue({
      role: 'staff',
      accessToken: bareToken,
      user: { id: 1, email: 's@b.c', name: 'S', role: 'staff' },
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

  it('routes dual admin user object to admin home (operator wins)', () => {
    expect(
      resolvePostAuthHomeHref({
        role: 'admin',
        counselingEnabled: true,
        hasOperatorRole: true,
        hasCounselorRole: true,
      }),
    ).toBe(POST_AUTH_HOME_ADMIN);
  });

  it('routes counselor-only user object to consultant home', () => {
    expect(
      resolvePostAuthHomeHref({
        role: 'consultant',
        hasCounselorRole: true,
        hasOperatorRole: false,
      }),
    ).toBe(POST_AUTH_HOME_CONSULTANT);
  });

  it('routes operator-only admin to admin home', () => {
    expect(
      resolvePostAuthHomeHref({
        role: 'admin',
        hasOperatorRole: true,
        hasCounselorRole: false,
      }),
    ).toBe(POST_AUTH_HOME_ADMIN);
  });
});
