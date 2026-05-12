/**
 * 푸시 알림 시나리오 상수 정의 (12종)
 * 서버에서 전송하는 알림 type → 라우팅·아이콘·카테고리 매핑
 *
 * @author MindGarden
 * @since 2026-05-12
 * @see docs/project-management/CONSULTANT_CLIENT_APP_PLAN.md §3.7
 */

export type PushCategory =
  | 'booking'
  | 'session'
  | 'payment'
  | 'message'
  | 'wellness'
  | 'system';

export type NotificationSettingsCategory =
  | 'schedule'
  | 'payment'
  | 'message'
  | 'wellness'
  | 'system';

export interface PushScenario {
  readonly type: string;
  readonly title: string;
  readonly icon: string;
  readonly route: string;
  readonly category: PushCategory;
  readonly settingsCategory: NotificationSettingsCategory;
}

export const PUSH_SCENARIOS = {
  BOOKING_CONFIRMED: {
    type: 'booking_confirmed',
    title: '예약 확정',
    icon: 'Calendar',
    route: '/(client)/(sessions)/{id}',
    category: 'booking',
    settingsCategory: 'schedule',
  },
  BOOKING_CANCELLED: {
    type: 'booking_cancelled',
    title: '예약 취소',
    icon: 'CalendarX',
    route: '/(client)/(sessions)',
    category: 'booking',
    settingsCategory: 'schedule',
  },
  BOOKING_REMINDER: {
    type: 'booking_reminder',
    title: '상담 리마인더',
    icon: 'Bell',
    route: '/(consultant)/(schedule)/{id}',
    category: 'booking',
    settingsCategory: 'schedule',
  },
  SESSION_STARTED: {
    type: 'session_started',
    title: '상담 시작',
    icon: 'Play',
    route: '/(consultant)/(schedule)/{id}',
    category: 'session',
    settingsCategory: 'schedule',
  },
  SESSION_COMPLETED: {
    type: 'session_completed',
    title: '상담 완료',
    icon: 'CheckCircle',
    route: '/(client)/(sessions)/{id}',
    category: 'session',
    settingsCategory: 'schedule',
  },
  RECORD_SHARED: {
    type: 'record_shared',
    title: '상담일지 공유',
    icon: 'FileText',
    route: '/(client)/(sessions)/{id}',
    category: 'session',
    settingsCategory: 'schedule',
  },
  PAYMENT_COMPLETED: {
    type: 'payment_completed',
    title: '결제 완료',
    icon: 'CreditCard',
    route: '/(client)/(more)/sessions-payment/{id}',
    category: 'payment',
    settingsCategory: 'payment',
  },
  PAYMENT_REFUNDED: {
    type: 'payment_refunded',
    title: '환불 처리',
    icon: 'RefreshCw',
    route: '/(client)/(more)/sessions-payment/{id}',
    category: 'payment',
    settingsCategory: 'payment',
  },
  SESSION_LOW: {
    type: 'session_low',
    title: '회기 소진 임박',
    icon: 'AlertTriangle',
    route: '/(client)/(more)/sessions-payment',
    category: 'payment',
    settingsCategory: 'payment',
  },
  NEW_MESSAGE: {
    type: 'new_message',
    title: '새 메시지',
    icon: 'MessageCircle',
    route: '/(more)/messages/{id}',
    category: 'message',
    settingsCategory: 'message',
  },
  MOOD_REMINDER: {
    type: 'mood_reminder',
    title: '감정 일기 리마인더',
    icon: 'Heart',
    route: '/(client)/(wellness)/mood-journal',
    category: 'wellness',
    settingsCategory: 'wellness',
  },
  SYSTEM_NOTICE: {
    type: 'system_notice',
    title: '공지사항',
    icon: 'Info',
    route: '/(more)/notifications',
    category: 'system',
    settingsCategory: 'system',
  },
} as const satisfies Record<string, PushScenario>;

export type PushScenarioType =
  (typeof PUSH_SCENARIOS)[keyof typeof PUSH_SCENARIOS]['type'];

const SCENARIO_BY_TYPE = new Map<string, PushScenario>(
  Object.values(PUSH_SCENARIOS).map((s) => [s.type, s]),
);

/**
 * 서버 알림 type으로 시나리오 조회
 */
export function getScenarioByType(type: string): PushScenario | undefined {
  return SCENARIO_BY_TYPE.get(type);
}

/**
 * route 템플릿의 {id} 등 파라미터를 실제 값으로 치환
 */
export function resolveRoute(
  routeTemplate: string,
  params: Record<string, string | number>,
): string {
  let resolved = routeTemplate;
  for (const [key, value] of Object.entries(params)) {
    resolved = resolved.replace(`{${key}}`, String(value));
  }
  return resolved;
}

/**
 * 역할에 따라 route prefix 보정
 * consultant 전용 경로가 client에게 가거나 그 반대를 방지
 */
export function resolveRouteForRole(
  route: string,
  role: 'client' | 'consultant',
): string {
  if (role === 'client' && route.startsWith('/(consultant)')) {
    return route.replace('/(consultant)', '/(client)');
  }
  if (role === 'consultant' && route.startsWith('/(client)')) {
    return route.replace('/(client)', '/(consultant)');
  }
  if (route.startsWith('/(more)')) {
    return `/(${role})${route}`;
  }
  return route;
}
