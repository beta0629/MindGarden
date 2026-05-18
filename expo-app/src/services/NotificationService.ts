/**
 * NotificationService — expo-notifications 기반 푸시 알림 통합 서비스
 * 토큰 등록/해제 + 포그라운드 핸들러 + 탭 라우팅 + 설정 연동
 *
 * 역할 분담(문서 고정, 본 파일은 계약·클라이언트 수신측만 유지):
 * - `docs/project-management/EXPO_NATIVE_APP_PLAN.md` **11.1** 게이트 표의 **푸시** 행:
 *   `NotificationService`·푸시 토큰 API 계약을 Phase 3 잔여로 명시하고,
 *   **Expo Phase 4(푸시+오프라인)** 본 트랙과의 경계를 둔다.
 * - 동 문서 **Phase 4: 푸시 알림 완성 + 오프라인 지원**(`core-coder`):
 *   12종 시나리오 **서버 발화·스케줄링**, FCM/토큰 **주기 갱신**(expo-background-task),
 *   오프라인·동기화·캐시 정리 등은 Phase 4 배치에서 다룬다.
 *   웹 기획서 `CONSULTANT_CLIENT_APP_PLAN.md`의 **Phase 4** 번호는
 *   「마음 날씨·마음 정원」(3-F·3-G) 의미로 **본 Expo Phase 4와 다름**(문서 주석 참고).
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { apiPost } from '../api/client';
import { PUSH_API } from '../api/endpoints';
import { useAuthStore } from '../stores/useAuthStore';
import { useTenantStore } from '../stores/useTenantStore';
import { useNotificationSettingsStore } from '../stores/useNotificationSettingsStore';
import {
  getScenarioByType,
  getRouteTemplateForRole,
  prefixRoleForMoreRoute,
  resolveRoute,
  routeMatchesRole,
  type PushScenario,
} from '../constants/pushScenarios';
import { showInAppToast } from '../components/organisms/InAppNotificationToast';
import { stripHtmlToPlainText } from '../utils/safeDisplay';
import {
  isAdminMobileShellRole,
  toClientConsultantMessagingRole,
  type AppAuthRole,
} from '@/utils/adminRole';
import { requestOsNotificationPermission } from '@/utils/notificationPermissionFlow';

/**
 * 푸시 백엔드 계약(프론트·Expo 공통, 웹 `PushNotificationService` 동일 경로):
 * - `POST /api/v1/mobile/push-token/register` · `POST .../unregister` — 바디에 tenantId 포함(멀티테넌트).
 * - `GET|PUT /api/v1/mobile/push-settings` — 카테고리별 boolean 5종; 이 저장소에는 아직 Java 매핑이 없을 수 있음(404 시 무시).
 *
 * Spring에 위 API가 없으면 등록은 4xx로 실패할 수 있음 — 앱은 `registerToken` 실패를 삼키고
 * 로컬 알림 설정(MMKV)만 유지한다. 서버 푸시·스케줄러는 별도 백엔드 배치에서 구현한다.
 * (`CONSULTANT_CLIENT_APP_PLAN.md` 8절, `EXPO_NATIVE_APP_PLAN.md` Expo Phase 4 본 트랙)
 *
 * @see `expo-app/src/api/endpoints.ts` 의 PUSH_API 주석
 */
function navigateToSystemNotifications(role: AppAuthRole): void {
  if (isAdminMobileShellRole(role)) {
    try {
      router.push('/(admin)/(more)' as Href);
    } catch {
      // 잘못된 경로 무시
    }
    return;
  }
  const shellRole = toClientConsultantMessagingRole(role);
  const path =
    shellRole === 'consultant'
      ? '/(consultant)/(more)/notifications'
      : '/(client)/(more)/notifications';
  try {
    router.push(path as Href);
  } catch {
    // 잘못된 경로 무시
  }
}

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

  if (scenario.category === 'record') {
    const sid = firstString(data.scheduleId, data.consultationId, data.id);
    if (sid != null) {
      params.scheduleId = sid;
    }
    return params;
  }

  if (scenario.category === 'booking' || scenario.category === 'session') {
    const sid = firstString(data.scheduleId, data.consultationId, data.id);
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
    const oid = firstString(data.id, data.conversationId, data.threadId, data.userId);
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
  if (route.includes('sessions)/review')) {
    return role === 'consultant' ? '/(consultant)/(schedule)' : '/(client)/(sessions)';
  }
  if (route.includes('records)/create')) {
    return '/(consultant)/(records)';
  }
  if (scenario.route.includes('sessions-payment')) {
    return role === 'consultant' ? '/(consultant)/(more)' : '/(client)/(more)/sessions-payment';
  }
  if (scenario.route.includes('(sessions)')) {
    return role === 'consultant' ? '/(consultant)/(schedule)' : '/(client)/(sessions)';
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
    return role === 'consultant' ? '/(consultant)/(more)/messages' : '/(client)/(more)/messages';
  }
  return role === 'consultant' ? '/(consultant)/(home)' : '/(client)/(home)';
}

/**
 * 포그라운드 알림 핸들러:
 * 설정 카테고리 off면 OS 표시·사운드 억제.
 * on이면 OS 배너·리스트 없이 사운드·뱃지만 — 본문은 `setupForegroundHandler` 인앱 토스트.
 * 백그라운드 수신은 OS 알림 트레이(시스템).
 */
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const type = notification.request.content.data?.type as string | undefined;
    if (type) {
      const scenario = getScenarioByType(type);
      const category = scenario?.settingsCategory ?? 'system';
      const { isEnabled } = useNotificationSettingsStore.getState();
      if (!isEnabled(category)) {
        return {
          shouldShowAlert: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
          shouldShowBanner: false,
          shouldShowList: false,
        };
      }
    }

    /** OS 배너·리스트 없음 — 인앱 토스트만(`setupForegroundHandler`). 백그라운드는 OS 트레이. */
    return {
      shouldShowAlert: false,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: false,
      shouldShowList: false,
    };
  },
});

function generateToastId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export type NotificationPermissionSnapshot = {
  granted: boolean;
  status: Notifications.PermissionStatus;
  canAskAgain: boolean;
};

/**
 * OS 알림 권한 상태 조회 (채널 생성 없음).
 */
export async function getNotificationPermissionSnapshot(): Promise<NotificationPermissionSnapshot> {
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  return {
    granted: status === 'granted',
    status,
    canAskAgain: canAskAgain ?? true,
  };
}

/**
 * 거절·「다시 묻지 않음」 등으로 시스템 설정 이동이 필요할 때.
 */
export async function openNotificationSettings(): Promise<void> {
  await Linking.openSettings();
}

export const NotificationService = {
  /**
   * 푸시 알림 권한 요청 — Android는 채널을 먼저 만든 뒤 권한을 요청한다.
   */
  async requestPermission(): Promise<boolean> {
    if (!Device.isDevice) {
      return false;
    }

    return requestOsNotificationPermission();
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
   * 백엔드·Expo Push API `to` 필드에 맞는 토큰을 한 경로로 해석.
   * EAS `projectId`가 있으면 `ExponentPushToken[...]`(`getExpoPushTokenAsync`)를 우선하고,
   * 없거나 실패 시에만 `getDevicePushTokenAsync` 네이티브 토큰으로 폴백한다.
   *
   * @returns 서버 `push_token`에 저장되는 문자열, 또는 null
   */
  async resolveBackendPushToken(): Promise<string | null> {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (projectId) {
      const expoToken = await this.getExpoPushToken();
      if (expoToken) return expoToken;
    }
    return this.getDeviceToken();
  },

  /**
   * 푸시 토큰을 서버에 등록
   * `POST /api/v1/mobile/push-token/register` — Spring 미구현 시 실패·false 반환(앱은 계속 동작).
   * 서버에는 `resolveBackendPushToken` 결과(통상 `ExponentPushToken[...]`, 폴백 시 네이티브 디바이스 토큰)가 저장된다.
   */
  async registerToken(): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) return false;

      const token = await this.resolveBackendPushToken();
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
   * 해제 바디의 `token`은 등록 시와 동일하게 `resolveBackendPushToken`을 사용한다.
   */
  async unregisterToken(): Promise<boolean> {
    try {
      const token = await this.resolveBackendPushToken();
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

      if (!type) {
        return;
      }

      const scenario = getScenarioByType(type);
      const { isEnabled } = useNotificationSettingsStore.getState();
      if (scenario) {
        if (!isEnabled(scenario.settingsCategory)) return;
      } else if (!isEnabled('system')) {
        return;
      }

      const activeScenario = scenario;

      showInAppToast({
        id: generateToastId(),
        title: stripHtmlToPlainText(title ?? activeScenario?.title ?? '알림'),
        body: stripHtmlToPlainText(body ?? ''),
        icon: activeScenario?.icon,
        onPress: () => {
          const role = useAuthStore.getState().role;
          if (!role) return;
          if (!data) return;
          if (scenario) {
            this.navigateToScreen(type, data as Record<string, unknown>);
          } else {
            navigateToSystemNotifications(role);
          }
        },
      });
    });
  },

  /**
   * 알림 탭 핸들러 (백그라운드/종료 → 앱 오픈 시)
   * data.type에 따라 라우팅 — 설정 off면 무시
   */
  setupResponseHandler(): Notifications.EventSubscription {
    return Notifications.addNotificationResponseReceivedListener((response) => {
      const { data } = response.notification.request.content;
      const type = data?.type as string | undefined;
      const role = useAuthStore.getState().role;

      if (!role) return;

      if (!type) {
        navigateToSystemNotifications(role);
        return;
      }

      const scenario = getScenarioByType(type);
      const { isEnabled } = useNotificationSettingsStore.getState();
      if (scenario) {
        if (!isEnabled(scenario.settingsCategory)) return;
      } else if (!isEnabled('system')) {
        return;
      }

      this.navigateToScreen(type, data as Record<string, unknown>);
    });
  },

  /**
   * 알림 type + data 기반 화면 이동
   * 미등록 type → 시스템 알림(알림 센터) 화면
   */
  navigateToScreen(type: string, data: Record<string, unknown>): void {
    const { role } = useAuthStore.getState();
    if (!role) return;

    const scenario = getScenarioByType(type);
    if (!scenario) {
      navigateToSystemNotifications(role);
      return;
    }

    const shellRole = toClientConsultantMessagingRole(role);
    const params = collectPushRouteParams(scenario, data);
    const template = getRouteTemplateForRole(scenario, shellRole);
    let route = resolveRoute(template, params);
    route = prefixRoleForMoreRoute(route, shellRole);

    if (!routeMatchesRole(route, shellRole)) {
      navigateToSystemNotifications(role);
      return;
    }

    route = resolvePushRouteWithFallback(scenario, route, shellRole);

    try {
      router.push(route as Href);
    } catch {
      navigateToSystemNotifications(role);
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
