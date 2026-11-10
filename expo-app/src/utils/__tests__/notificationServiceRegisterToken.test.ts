jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  Linking: { openSettings: jest.fn() },
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  getDevicePushTokenAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  AndroidImportance: { MAX: 5 },
}));

/** jest.mock factory 에서 참조 가능하도록 mock* 접두사 유지 */
const mockDeviceState = { isDevice: true };

jest.mock('expo-device', () => ({
  get isDevice() {
    return mockDeviceState.isDevice;
  },
  brand: 'Test',
  modelName: 'Test',
  osName: 'android',
  osVersion: '14',
}));

jest.mock('expo-constants', () => ({
  expoConfig: { extra: { eas: { projectId: 'test-project-id' } } },
  executionEnvironment: 'standalone',
  ExecutionEnvironment: { StoreClient: 'storeClient', Standalone: 'standalone', Bare: 'bare' },
}));

jest.mock('@/lib/getMmkv', () => ({
  getMmkv: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
  isExpoGoApp: jest.fn(() => false),
  createZustandMmkvPersistStorage: jest.fn(),
}));

jest.mock('@/utils/notificationPermissionFlow', () => ({
  requestOsNotificationPermission: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/api/client', () => ({
  apiPost: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/stores/useAuthStore', () => ({
  useAuthStore: { getState: jest.fn() },
}));

jest.mock('@/stores/useTenantStore', () => ({
  useTenantStore: {
    getState: jest.fn(),
    setState: jest.fn(),
  },
}));

jest.mock('@/stores/useNotificationSettingsStore', () => ({
  useNotificationSettingsStore: {
    getState: jest.fn(() => ({ isEnabled: () => true })),
  },
}));

jest.mock('@/components/organisms/InAppNotificationToast', () => ({
  showInAppToast: jest.fn(),
}));

import * as Notifications from 'expo-notifications';
import { apiPost } from '@/api/client';
import { PUSH_API } from '@/api/endpoints';
import { PUSH_REGISTER_FAILURE_NOT_A_DEVICE } from '@/constants/pushPermissionNotify';
import { NotificationService } from '@/services/NotificationService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTenantStore } from '@/stores/useTenantStore';
import { requestOsNotificationPermission } from '@/utils/notificationPermissionFlow';

function fakeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.sig`;
}

function mockAuthedTenantUser(): void {
  const token = fakeJwt({ tenantId: 'tenant-from-jwt', sub: '42' });
  (useAuthStore.getState as jest.Mock).mockReturnValue({
    user: { id: 42, tenantId: 'tenant-from-jwt' },
    accessToken: token,
    _hasHydrated: true,
    isLoading: false,
    updateUser: jest.fn(),
  });
  (useTenantStore.getState as jest.Mock).mockReturnValue({
    tenantId: 'tenant-from-jwt',
    tenantCode: null,
    tenantName: null,
    recentTenants: [],
    _hasHydrated: true,
    setTenant: jest.fn(),
  });
}

describe('NotificationService.registerToken tenant resolution', () => {
  const getExpoPushTokenAsync = Notifications.getExpoPushTokenAsync as jest.Mock;
  const apiPostMock = apiPost as jest.Mock;
  const requestPermissionMock = requestOsNotificationPermission as jest.Mock;

  beforeAll(() => {
    (globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__ = false;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockDeviceState.isDevice = true;
    requestPermissionMock.mockResolvedValue(true);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    getExpoPushTokenAsync.mockResolvedValue({ data: 'ExponentPushToken[unit-test]' });
    apiPostMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('calls register API when store tenantId is empty but JWT has tenantId', async () => {
    const token = fakeJwt({ tenantId: 'tenant-from-jwt', sub: '42' });
    (useAuthStore.getState as jest.Mock).mockReturnValue({
      user: { id: 42, tenantId: '' },
      accessToken: token,
      _hasHydrated: true,
      isLoading: false,
      updateUser: jest.fn(),
    });
    (useTenantStore.getState as jest.Mock).mockReturnValue({
      tenantId: '',
      tenantCode: null,
      tenantName: null,
      recentTenants: [],
      _hasHydrated: true,
      setTenant: jest.fn(),
    });

    const ok = await NotificationService.registerToken();

    expect(ok).toBe(true);
    expect(apiPostMock).toHaveBeenCalledWith(PUSH_API.REGISTER_TOKEN, {
      userId: 42,
      tenantId: 'tenant-from-jwt',
      token: 'ExponentPushToken[unit-test]',
      platform: 'android',
      deviceInfo: expect.objectContaining({ osName: 'android' }),
    });
    expect(console.warn).toHaveBeenCalledWith(
      '[NotificationService] registerToken',
      expect.objectContaining({ outcome: 'ok', token: 'Exponent…' }),
    );
  });

  it('skips register API when store and JWT both lack tenantId', async () => {
    const token = fakeJwt({ sub: '42' });
    (useAuthStore.getState as jest.Mock).mockReturnValue({
      user: { id: 42, tenantId: '' },
      accessToken: token,
      _hasHydrated: true,
      isLoading: false,
      updateUser: jest.fn(),
    });
    (useTenantStore.getState as jest.Mock).mockReturnValue({
      tenantId: '',
      tenantCode: null,
      tenantName: null,
      recentTenants: [],
      _hasHydrated: true,
      setTenant: jest.fn(),
    });

    const ok = await NotificationService.registerToken();

    expect(ok).toBe(false);
    expect(apiPostMock).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      '[NotificationService] registerToken',
      expect.objectContaining({ outcome: 'failed', reason: 'auth_or_tenant_missing' }),
    );
  });

  it('registerTokenWithClaimRetry retries once without toast when first fail is API error', async () => {
    mockAuthedTenantUser();
    apiPostMock.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(undefined);

    const { showInAppToast } = jest.requireMock('@/components/organisms/InAppNotificationToast');
    const ok = await NotificationService.registerTokenWithClaimRetry();

    expect(ok).toBe(true);
    expect(apiPostMock).toHaveBeenCalledTimes(2);
    expect(showInAppToast).toHaveBeenCalledTimes(0);
  });

  it('simulator / not_a_device: claim-retry does not toast', async () => {
    mockDeviceState.isDevice = false;
    mockAuthedTenantUser();

    const { showInAppToast } = jest.requireMock('@/components/organisms/InAppNotificationToast');
    const ok = await NotificationService.registerTokenWithClaimRetry();

    expect(ok).toBe(false);
    expect(apiPostMock).not.toHaveBeenCalled();
    expect(showInAppToast).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      '[NotificationService] registerToken',
      expect.objectContaining({
        outcome: 'failed',
        reason: PUSH_REGISTER_FAILURE_NOT_A_DEVICE,
      }),
    );
  });

  it('permission denied on real device: claim-retry toasts when notifyUser true', async () => {
    mockDeviceState.isDevice = true;
    requestPermissionMock.mockResolvedValue(false);
    mockAuthedTenantUser();

    const { showInAppToast } = jest.requireMock('@/components/organisms/InAppNotificationToast');
    const ok = await NotificationService.registerTokenWithClaimRetry();

    expect(ok).toBe(false);
    expect(apiPostMock).not.toHaveBeenCalled();
    // first fail + final fail — both actionable permission denied
    expect(showInAppToast).toHaveBeenCalledTimes(2);
    expect(showInAppToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.any(String),
        body: expect.any(String),
        icon: 'AlertTriangle',
      }),
    );
  });

  it('API failure path: claim-retry does not toast (log only)', async () => {
    mockAuthedTenantUser();
    apiPostMock.mockRejectedValue(new Error('network'));

    const { showInAppToast } = jest.requireMock('@/components/organisms/InAppNotificationToast');
    const ok = await NotificationService.registerTokenWithClaimRetry();

    expect(ok).toBe(false);
    expect(apiPostMock).toHaveBeenCalledTimes(2);
    expect(showInAppToast).not.toHaveBeenCalled();
  });
});
