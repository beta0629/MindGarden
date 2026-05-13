/**
 * NotificationService — expo-notifications 기반 푸시 알림 통합 서비스
 * 토큰 등록/해제 + 포그라운드 핸들러 + 탭 라우팅 + 설정 연동
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { apiPost } from '../api/client';
import { PUSH_API } from '../api/endpoints';
import { useAuthStore } from '../stores/useAuthStore';
import { useTenantStore } from '../stores/useTenantStore';
import { useNotificationSettingsStore } from '../stores/useNotificationSettingsStore';
import { colors } from '../theme/tokens';
import {
  getScenarioByType,
  resolveRoute,
  resolveRouteForRole,
  type PushScenario,
} from '../constants/pushScenarios';
import { showInAppToast } from '../components/organisms/InAppNotificationToast';

// TODO(expo-push): Spring에 `/api/v1/mobile/push-token/register`·설정 API가 없으면 4xx 무시·계약만 맞춤 — CONSULTANT_CLIENT_APP_PLAN.md Phase 3 항목 5

/**
 * 푸시 data에서 라우트 파라미터 추출 (id·scheduleId 등 서버 키 편차 흡수)
 */
function collectPushRouteParams(
  scenario: PushScenario,
  data: Record<string, unknown>,
): Record<string, string | number> {
  const firstString = (...vals: unknown[]): string | undefined => {
    for (const v of vals) {
      if (v != null && String(v).trim() !== '') {
        return String(v);
      }
    }
    return undefined;
  };

  const params: Record<string, string | number> = {};

  if (
    scenario.category === 'booking' ||
    scenario.category === 'session'
  ) {
    const sid = firstString(
      data.scheduleId,
      data.consultationId,
      data.id,
    );
    if (sid != null) {
      params.id = sid;
    }
  } else if (scenario.category === 'payment') {
    const pid = firstString(
      data.mappingId,
      data.consultantClientMappingId,
      data.paymentId,
      data.id,
    );
    if (pid != null) {
      params.id = pid;
    }
  } else {
    const oid = firstString(
      data.id,
      data.conversationId,
      data.threadId,
      data.userId,
    );
    if (oid != null) {
      params.id = oid;
    }
  }

  const scheduleExtra = firstString(data.scheduleId, data.consultationId);
  if (scheduleExtra != null && params.id == null) {
    params.scheduleId = scheduleExtra;
  }

  return params;
}

function resolvePushRouteWithFallback(
  scenario: PushScenario,
  route: string,
  role: 'client' | 'consultant',
): string {
  if (!/\{[^}]+\}/.test(route)) {
    return route;
  }
  if (scenario.route.includes('sessions-payment')) {
    return role === 'consultant'
      ? '/(consultant)/(more)'
      : '/(client)/(more)/sessions-payment';
  }
  if (scenario.route.includes('(sessions)')) {
    return role === 'consultant'
      ? '/(consultant)/(schedule)'
      : '/(client)/(sessions)';
  }
  if (scenario.route.includes('(schedule)')) {
    return '/(consultant)/(schedule)';
  }
  if (scenario.route.includes('notifications')) {
    return role === 'consultant'
      ? '/(consultant)/(more)/notifications'
      : '/(client)/(more)/notifications';
  }
  if (scenario.route.includes('messages')) {
    return role === 'consultant'
      ? '/(consultant)/(more)/messages'
      : '/(client)/(more)/messages';
  }
  return role === 'consultant'
    ? '/(consultant)/(home)'
    : '/(client)/(home)';
}

/**
 * 포그라운드 알림 핸들러:
 * 설정 카테고리가 on이면 알림 표시, off면 무시
 */
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const type = notification.request.content.data?.type as string | undefined;
    if (type) {
      const scenario = getScenarioByType(type);
      if (scenario) {
        const { isEnabled } = useNotificationSettingsStore.getState();
        if (!isEnabled(scenario.settingsCategory)) {
          return {
            shouldShowAlert: false,
            shouldPlaySound: false,
            shouldSetBadge: false,
            shouldShowBanner: false,
            shouldShowList: false,
          };
        }
      }
    }

    return {
      shouldShowAlert: false,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: false,
      shouldShowList: true,
    };
  },
});

function generateToastId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const NotificationService = {
  /**
   * 푸시 알림 권한 요청
   */
  async requestPermission(): Promise<boolean> {
    if (!Device.isDevice) {
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'MindGarden 알림',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: colors.consultant.primary,
      });
    }

    return true;
  },

  /**
   * 디바이스 푸시 토큰 획득
   */
  async getDeviceToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        return null;
      }

      const token = await Notifications.getDevicePushTokenAsync();
      return token.data as string;
    } catch {
      return null;
    }
  },

  /**
   * Expo 푸시 토큰 획득 (Expo Push Service 경유)
   */
  async getExpoPushToken(): Promise<string | null> {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) return null;

      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      return token.data;
    } catch {
      return null;
    }
  },

  /**
   * 푸시 토큰을 서버에 등록
   * POST /api/v1/mobile/push-token/register
   */
  async registerToken(): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) return false;

      const token = await this.getDeviceToken();
      if (!token) return false;

      const { user } = useAuthStore.getState();
      const { tenantId } = useTenantStore.getState();

      if (!user?.id || !tenantId) return false;

      await apiPost(PUSH_API.REGISTER_TOKEN, {
        userId: user.id,
        tenantId,
        token,
        platform: Platform.OS,
        deviceInfo: {
          brand: Device.brand,
          modelName: Device.modelName,
          osName: Device.osName,
          osVersion: Device.osVersion,
        },
      });

      return true;
    } catch {
      return false;
    }
  },

  /**
   * 푸시 토큰을 서버에서 해제
   * DELETE /api/v1/mobile/push-token/unregister
   */
  async unregisterToken(): Promise<boolean> {
    try {
      const token = await this.getDeviceToken();
      if (!token) return false;

      const { user } = useAuthStore.getState();
      const { tenantId } = useTenantStore.getState();

      if (!user?.id || !tenantId) return false;

      await apiPost(PUSH_API.UNREGISTER_TOKEN, {
        userId: user.id,
        tenantId,
        token,
        platform: Platform.OS,
      });

      return true;
    } catch {
      return false;
    }
  },

  /**
   * 포그라운드 알림 수신 리스너 등록
   * 설정 확인 → on이면 인앱 토스트 표시
   */
  setupForegroundHandler(): Notifications.EventSubscription {
    return Notifications.addNotificationReceivedListener((notification) => {
      const { title, body, data } = notification.request.content;
      const type = data?.type as string | undefined;

      if (type) {
        const scenario = getScenarioByType(type);
        if (scenario) {
          const { isEnabled } = useNotificationSettingsStore.getState();
          if (!isEnabled(scenario.settingsCategory)) return;
        }
      }

      const scenario = type ? getScenarioByType(type) : undefined;

      showInAppToast({
        id: generateToastId(),
        title: title ?? scenario?.title ?? '알림',
        body: body ?? '',
        icon: scenario?.icon,
        onPress: () => {
          if (type && data) {
            this.navigateToScreen(type, data as Record<string, unknown>);
          }
        },
      });
    });
  },

  /**
   * 알림 탭 핸들러 (백그라운드/종료 → 앱 오픈 시)
   * data.type에 따라 PUSH_SCENARIOS에서 route 찾아서 이동
   */
  setupResponseHandler(): Notifications.EventSubscription {
    return Notifications.addNotificationResponseReceivedListener((response) => {
      const { data } = response.notification.request.content;
      const type = data?.type as string | undefined;

      if (type) {
        this.navigateToScreen(type, data as Record<string, unknown>);
      }
    });
  },

  /**
   * 알림 type + data 기반 화면 이동
   */
  navigateToScreen(type: string, data: Record<string, unknown>): void {
    const scenario = getScenarioByType(type);
    if (!scenario) return;

    const { role } = useAuthStore.getState();
    if (!role) return;

    const params = collectPushRouteParams(scenario, data);
    let route = resolveRoute(scenario.route, params);
    route = resolveRouteForRole(route, role);
    route = resolvePushRouteWithFallback(scenario, route, role);

    try {
      router.push(route as Href);
    } catch {
      // 잘못된 경로 무시 — 홈으로 fallback
    }
  },

  /**
   * 포그라운드 + 탭 핸들러 모두 등록
   * 루트 레이아웃에서 한 번 호출
   */
  setupAllHandlers(): {
    foreground: Notifications.EventSubscription;
    response: Notifications.EventSubscription;
  } {
    return {
      foreground: this.setupForegroundHandler(),
      response: this.setupResponseHandler(),
    };
  },

  /**
   * 알림 수신 리스너 등록 (하위 호환)
   */
  addForegroundListener(
    callback: (notification: Notifications.Notification) => void,
  ): Notifications.EventSubscription {
    return Notifications.addNotificationReceivedListener(callback);
  },

  /**
   * 알림 터치 리스너 등록 (하위 호환)
   */
  addResponseListener(
    callback: (response: Notifications.NotificationResponse) => void,
  ): Notifications.EventSubscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  },
};
