/**
 * NotificationService — OTP 푸시(`data.type === 'otp_delivery'`) 분기 통합 검증.
 *
 * <p>표준화 v2 Phase 1 / Slot ③ / E3 — PR #227 NCP SENS 후속, expo-app 클라이언트
 * 핸들러에서 OTP 푸시 수신 시 `/(otp)/current` 라우트로 분기되는지 검증한다.
 * 평문 OTP 는 페이로드에 들어오지 않으므로 화면 진입 후 별도 API 호출이 일어난다.</p>
 *
 * @author MindGarden
 * @since 2026-06-12
 */
import { router } from 'expo-router';
import { NotificationService } from '@/services/NotificationService';
import { useAuthStore } from '@/stores/useAuthStore';
import { OTP_CURRENT_ROUTE, OTP_DELIVERY_PUSH_TYPE } from '@/utils/pushOtpRouting';

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
  apiGet: jest.fn(),
}));

jest.mock('@/api/queryClient', () => ({
  queryClient: {
    invalidateQueries: (...args: unknown[]) => mockInvalidateQueries(...args),
  },
}));

jest.mock('@/stores/useAuthStore', () => ({
  useAuthStore: { getState: jest.fn() },
}));

/**
 * 카테고리 isEnabled() 가 항상 false 를 반환하도록 모킹 —
 * OTP 푸시는 사용자 설정과 무관하게 처리되어야 함을 강제로 검증.
 */
jest.mock('@/stores/useNotificationSettingsStore', () => ({
  useNotificationSettingsStore: {
    getState: jest.fn(() => ({ isEnabled: () => false })),
  },
}));

jest.mock('@/components/organisms/InAppNotificationToast', () => ({
  showInAppToast: (...args: unknown[]) => mockShowInAppToast(...args),
}));

function buildNotification(data: Record<string, unknown>): unknown {
  return {
    date: Date.now(),
    request: {
      identifier: 'test-otp',
      trigger: null,
      content: {
        title: '인증번호',
        body: '앱에서 인증번호를 확인하세요.',
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

describe('NotificationService — otp_delivery 분기 (E3)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListenerRef.received = undefined;
    mockListenerRef.response = undefined;
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    (useAuthStore.getState as jest.Mock).mockReturnValue({
      user: { id: 100 },
      role: 'client',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('response: type=otp_delivery → /(otp)/current 로 라우팅하며 otpToken·purpose 전달', () => {
    NotificationService.setupResponseHandler();
    expect(mockListenerRef.response).toBeDefined();

    mockListenerRef.response!(
      buildResponse({
        type: OTP_DELIVERY_PUSH_TYPE,
        otpToken: 'tok-otp-1234',
        purpose: 'phone_change',
        tenantId: 'tenant-a',
        recipientUserId: '100',
      }),
    );

    expect(router.push as jest.Mock).toHaveBeenCalledTimes(1);
    const arg = (router.push as jest.Mock).mock.calls[0][0];
    expect(arg).toMatchObject({
      pathname: OTP_CURRENT_ROUTE,
      params: { otpToken: 'tok-otp-1234', purpose: 'phone_change' },
    });
  });

  it('response: purpose 만 OTP 인 alias 페이로드도 /(otp)/current 로 라우팅', () => {
    NotificationService.setupResponseHandler();
    expect(mockListenerRef.response).toBeDefined();

    mockListenerRef.response!(
      buildResponse({
        purpose: 'OTP',
        otpToken: 'tok-otp-9',
        recipientUserId: '100',
      }),
    );

    expect(router.push as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: OTP_CURRENT_ROUTE,
      }),
    );
  });

  it('response: 사용자 카테고리 설정이 모두 off 여도 OTP 라우팅은 진행 (의무 통지)', () => {
    NotificationService.setupResponseHandler();
    expect(mockListenerRef.response).toBeDefined();

    mockListenerRef.response!(
      buildResponse({
        type: OTP_DELIVERY_PUSH_TYPE,
        otpToken: 'tok-otp-cat',
        purpose: 'login_verification',
        recipientUserId: '100',
      }),
    );

    expect(router.push as jest.Mock).toHaveBeenCalledTimes(1);
  });

  it('response: recipientUserId 가 현재 사용자와 다르면 OTP 라우팅도 드랍 (P0 격리)', () => {
    NotificationService.setupResponseHandler();
    expect(mockListenerRef.response).toBeDefined();

    mockListenerRef.response!(
      buildResponse({
        type: OTP_DELIVERY_PUSH_TYPE,
        otpToken: 'tok-otp-other',
        purpose: 'phone_change',
        recipientUserId: '999',
      }),
    );

    expect(router.push as jest.Mock).not.toHaveBeenCalled();
  });

  it('foreground: OTP in-app 토스트는 카테고리 off 여도 항상 표시', () => {
    NotificationService.setupForegroundHandler();
    expect(mockListenerRef.received).toBeDefined();

    mockListenerRef.received!(
      buildNotification({
        type: OTP_DELIVERY_PUSH_TYPE,
        otpToken: 'tok-otp-fg',
        purpose: 'login_verification',
        recipientUserId: '100',
      }),
    );

    expect(mockShowInAppToast).toHaveBeenCalledTimes(1);
    const toastArg = mockShowInAppToast.mock.calls[0][0] as { onPress?: () => void };
    expect(typeof toastArg.onPress).toBe('function');

    toastArg.onPress?.();
    expect(router.push as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: OTP_CURRENT_ROUTE }),
    );
  });

  it('foreground: otpToken 없는 OTP 페이로드도 토스트는 표시 (탭 시 폴백 화면)', () => {
    NotificationService.setupForegroundHandler();
    expect(mockListenerRef.received).toBeDefined();

    mockListenerRef.received!(
      buildNotification({
        type: OTP_DELIVERY_PUSH_TYPE,
        purpose: 'generic',
        recipientUserId: '100',
      }),
    );

    expect(mockShowInAppToast).toHaveBeenCalledTimes(1);
  });
});
