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
} from '../constants/pushScenarios';
import { showInAppToast } from '../components/organisms/InAppNotificationToast';

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

    const params: Record<string, string | number> = {};
    if (data.id) params.id = data.id as string | number;
    if (data.scheduleId) params.scheduleId = data.scheduleId as string | number;

    let route = resolveRoute(scenario.route, params);
    route = resolveRouteForRole(route, role);

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
