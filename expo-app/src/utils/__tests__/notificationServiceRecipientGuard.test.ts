/**
 * NotificationService — P0 푸시 사용자 격리 가드 단위 검증.
 *
 * 백엔드가 토큰 단위로 동봉한 data.recipientUserId 와 현재 로그인 사용자 PK 가 불일치하면
 * 포그라운드 토스트·라우팅·React Query invalidate 가 모두 dropped 되어야 한다.
 *
 * @author MindGarden
 * @since 2026-06-10
 */
const mockListenerRef: {
  received?: (n: unknown) => void;
  response?: (r: unknown) => void;
} = {};
const mockInvalidateQueries = jest.fn().mockResolvedValue(undefined);
const mockShowInAppToast = jest.fn();

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
  addNotificationReceivedListener: jest.fn((cb: (n: unknown) => void) => {
    mockListenerRef.received = cb;
    return { remove: jest.fn() };
  }),
  addNotificationResponseReceivedListener: jest.fn((cb: (r: unknown) => void) => {
    mockListenerRef.response = cb;
    return { remove: jest.fn() };
  }),
  AndroidImportance: { MAX: 5 },
}));

jest.mock('expo-device', () => ({
  isDevice: true,
  brand: 'Test',
  modelName: 'Test',
  osName: 'android',
  osVersion: '14',
}));

jest.mock('expo-constants', () => ({
  expoConfig: { extra: { eas: { projectId: 'test-project-id' } } },
}));

jest.mock('@/utils/notificationPermissionFlow', () => ({
  requestOsNotificationPermission: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/api/client', () => ({
  apiPost: jest.fn(),
}));

jest.mock('@/api/queryClient', () => ({
  queryClient: {
    invalidateQueries: (...args: unknown[]) => mockInvalidateQueries(...args),
  },
}));

jest.mock('@/stores/useAuthStore', () => ({
  useAuthStore: { getState: jest.fn() },
}));

jest.mock('@/stores/useNotificationSettingsStore', () => ({
  useNotificationSettingsStore: {
    getState: jest.fn(() => ({ isEnabled: () => true })),
  },
}));

jest.mock('@/components/organisms/InAppNotificationToast', () => ({
  showInAppToast: (...args: unknown[]) => mockShowInAppToast(...args),
}));

import { router } from 'expo-router';
import { NotificationService } from '@/services/NotificationService';
import { useAuthStore } from '@/stores/useAuthStore';

function buildNotification(data: Record<string, unknown>): unknown {
  return {
    date: Date.now(),
    request: {
      identifier: 'test',
      trigger: null,
      content: {
        title: '제목',
        body: '본문',
        data,
        subtitle: null,
        sound: null,
        launchImageName: null,
        badge: null,
        attachments: [],
        categoryIdentifier: null,
      },
    },
  };
}

function buildResponse(data: Record<string, unknown>): unknown {
  return {
    actionIdentifier: 'default',
    notification: buildNotification(data),
  };
}

describe('NotificationService recipient mismatch guard (P0)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListenerRef.received = undefined;
    mockListenerRef.response = undefined;
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    (useAuthStore.getState as jest.Mock).mockReturnValue({
      user: { id: 100 },
      role: 'consultant',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('foreground: drops toast and invalidate when recipientUserId !== currentUserId', () => {
    NotificationService.setupForegroundHandler();
    expect(mockListenerRef.received).toBeDefined();

    mockListenerRef.received!(
      buildNotification({
        type: 'BOOKING_REMINDER',
        recipientUserId: '999',
      }),
    );

    expect(mockInvalidateQueries).not.toHaveBeenCalled();
    expect(mockShowInAppToast).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      '[NotificationService] recipient mismatch — drop',
      expect.objectContaining({ currentUserId: 100, payloadUserId: 999 }),
    );
  });

  it('foreground: continues processing when recipientUserId matches currentUserId', () => {
    NotificationService.setupForegroundHandler();
    expect(mockListenerRef.received).toBeDefined();

    mockListenerRef.received!(
      buildNotification({
        type: 'BOOKING_REMINDER',
        recipientUserId: '100',
      }),
    );

    expect(mockInvalidateQueries).toHaveBeenCalledTimes(1);
    expect(mockShowInAppToast).toHaveBeenCalledTimes(1);
  });

  it('foreground: passes through when recipientUserId is absent (legacy payload)', () => {
    NotificationService.setupForegroundHandler();
    expect(mockListenerRef.received).toBeDefined();

    mockListenerRef.received!(
      buildNotification({
        type: 'BOOKING_REMINDER',
      }),
    );

    expect(mockInvalidateQueries).toHaveBeenCalledTimes(1);
    expect(mockShowInAppToast).toHaveBeenCalledTimes(1);
  });

  it('response: drops navigation and invalidate when recipientUserId mismatches', () => {
    NotificationService.setupResponseHandler();
    expect(mockListenerRef.response).toBeDefined();

    mockListenerRef.response!(
      buildResponse({
        type: 'BOOKING_REMINDER',
        recipientUserId: '777',
        scheduleId: 'sch-1',
      }),
    );

    expect(mockInvalidateQueries).not.toHaveBeenCalled();
    expect(router.push as jest.Mock).not.toHaveBeenCalled();
  });

  it('response: navigates normally when recipientUserId matches', () => {
    NotificationService.setupResponseHandler();
    expect(mockListenerRef.response).toBeDefined();

    mockListenerRef.response!(
      buildResponse({
        type: 'BOOKING_REMINDER',
        recipientUserId: '100',
        scheduleId: 'sch-1',
      }),
    );

    expect(mockInvalidateQueries).toHaveBeenCalledTimes(1);
    expect(router.push as jest.Mock).toHaveBeenCalled();
  });
});
