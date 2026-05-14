/**
 * 푸시 알림 시나리오 상수 (`CONSULTANT_CLIENT_APP_PLAN.md` 표 3.7절 P1–P12).
 * 서버 `data.type` 문자열과 매핑. 레거시·타 백엔드 표기는 `PUSH_TYPE_ALIASES`로 정규화.
 * `payment_refunded`·`record_shared`는 P1–P12 외 확장 타입으로 동일 맵에 등록됨.
 *
 * **역할 분담** (`EXPO_NATIVE_APP_PLAN.md` 11.1 푸시 행 + **Expo Phase 4** 푸시 파트):
 * - 본 모듈: 12종+확장에 대한 **클라이언트 계약**(type·카테고리·딥링크 템플릿) 고정.
 * - **미포함(Phase 4 본구현)**: 서버에서 12종을 **언제 보낼지** 스케줄링, 발송 파이프라인,
 *   토큰 갱신 배치 등 — 기획서 P1–P12 **본구현**은 Expo Phase 4·백엔드 트랙에서 진행.
 *
 * @author MindGarden
 * @since 2026-05-12
 * @see docs/project-management/CONSULTANT_CLIENT_APP_PLAN.md (3.7절 푸시 알림 시나리오 상세)
 */

export type PushCategory =
  | 'booking'
  | 'session'
  | 'payment'
  | 'message'
  | 'wellness'
  | 'system'
  | 'record';

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
  /** 단일 수신 역할 또는 공통 기본 경로(하위 호환) */
  readonly route: string;
  /** 내담자 전용 템플릿 — 있으면 role=client일 때 우선 */
  readonly routeClient?: string;
  /** 상담사 전용 템플릿 — 있으면 role=consultant일 때 우선 */
  readonly routeConsultant?: string;
  readonly category: PushCategory;
  readonly settingsCategory: NotificationSettingsCategory;
}

/**
 * 3.7절 P1–P12 서버 type (snake_case) — 각 1행
 */
export const PUSH_SCENARIOS = {
  /** P1 예약 리마인더 — 상담사·내담자 */
  BOOKING_REMINDER: {
    type: 'booking_reminder',
    title: '상담 리마인더',
    icon: 'Bell',
    route: '/(client)/(sessions)/{id}',
    routeClient: '/(client)/(sessions)/{id}',
    routeConsultant: '/(consultant)/(schedule)/{id}',
    category: 'booking',
    settingsCategory: 'schedule',
  },
  /** P2 예약 확정 — 내담자 */
  BOOKING_CONFIRMED: {
    type: 'booking_confirmed',
    title: '예약 확정',
    icon: 'Calendar',
    route: '/(client)/(sessions)/{id}',
    category: 'booking',
    settingsCategory: 'schedule',
  },
  /** P3 예약 취소 — 상담사·내담자 */
  BOOKING_CANCELLED: {
    type: 'booking_cancelled',
    title: '예약 취소',
    icon: 'CalendarX',
    route: '/(client)/(sessions)',
    routeClient: '/(client)/(sessions)',
    routeConsultant: '/(consultant)/(schedule)',
    category: 'booking',
    settingsCategory: 'schedule',
  },
  /** P4 상담 시작 — 내담자 */
  SESSION_STARTED: {
    type: 'session_started',
    title: '상담 시작',
    icon: 'Play',
    route: '/(client)/(sessions)/{id}',
    category: 'session',
    settingsCategory: 'schedule',
  },
  /** P5 상담 완료·평가 요청 — 내담자 */
  SESSION_COMPLETED: {
    type: 'session_completed',
    title: '상담 완료',
    icon: 'CheckCircle',
    route: '/(client)/(sessions)/review/{id}',
    category: 'session',
    settingsCategory: 'schedule',
  },
  /** P6 결제 확인 — 내담자 */
  PAYMENT_COMPLETED: {
    type: 'payment_completed',
    title: '결제 완료',
    icon: 'CreditCard',
    route: '/(client)/(more)/sessions-payment/{id}',
    category: 'payment',
    settingsCategory: 'payment',
  },
  /** P7 결제 실패 — 내담자 */
  PAYMENT_FAILED: {
    type: 'payment_failed',
    title: '결제 실패',
    icon: 'XCircle',
    route: '/(client)/(more)/sessions-payment',
    category: 'payment',
    settingsCategory: 'payment',
  },
  /** P8 회기 소진 임박 — 내담자 */
  SESSION_LOW: {
    type: 'session_low',
    title: '회기 소진 임박',
    icon: 'AlertTriangle',
    route: '/(client)/(more)/sessions-payment',
    category: 'payment',
    settingsCategory: 'payment',
  },
  /** P9 미작성 일지 독촉 — 상담사 */
  CONSULTATION_RECORD_REMINDER: {
    type: 'consultation_record_reminder',
    title: '상담일지 작성',
    icon: 'ClipboardList',
    route: '/(consultant)/(records)/create/{scheduleId}',
    category: 'record',
    settingsCategory: 'schedule',
  },
  /** P10 새 메시지 — 상담사·내담자 */
  NEW_MESSAGE: {
    type: 'new_message',
    title: '새 메시지',
    icon: 'MessageCircle',
    route: '/(more)/messages/{id}',
    category: 'message',
    settingsCategory: 'message',
  },
  /** P11 웰니스 리마인드 — 내담자 */
  MOOD_REMINDER: {
    type: 'mood_reminder',
    title: '감정 일기',
    icon: 'Heart',
    route: '/(client)/(wellness)/mood-journal',
    category: 'wellness',
    settingsCategory: 'wellness',
  },
  /** P12 시스템 공지 — 전체 */
  SYSTEM_NOTICE: {
    type: 'system_notice',
    title: '공지',
    icon: 'Info',
    route: '/(more)/notifications',
    category: 'system',
    settingsCategory: 'system',
  },
} as const satisfies Record<string, PushScenario>;

/** 레거시·별칭 서버 type → `PUSH_SCENARIOS` canonical `type` 문자열 */
export const PUSH_TYPE_ALIASES: Readonly<Record<string, string>> = {
  wellness_reminder: 'mood_reminder',
  mood_journal_reminder: 'mood_reminder',
  record_pending: 'consultation_record_reminder',
  consultation_record_due: 'consultation_record_reminder',
  missing_record_reminder: 'consultation_record_reminder',
  appointment_reminder: 'booking_reminder',
  reservation_reminder: 'booking_reminder',
  schedule_reminder: 'booking_reminder',
  consultation_reminder: 'booking_reminder',
  appointment_confirmed: 'booking_confirmed',
  booking_created: 'booking_confirmed',
  reservation_confirmed: 'booking_confirmed',
  appointment_cancelled: 'booking_cancelled',
  schedule_cancelled: 'booking_cancelled',
  reservation_cancelled: 'booking_cancelled',
  consultation_started: 'session_started',
  session_start: 'session_started',
  session_complete: 'session_completed',
  review_request: 'session_completed',
  payment_success: 'payment_completed',
  payment_error: 'payment_failed',
  payment_declined: 'payment_failed',
  low_balance: 'session_low',
  sessions_low: 'session_low',
  session_balance_low: 'session_low',
  chat_message: 'new_message',
  message_received: 'new_message',
  admin_notice: 'system_notice',
  maintenance_notice: 'system_notice',
  service_notice: 'system_notice',
};

/** 표준 12종(P1–P12)을 기획서 순서대로 — UI·검증용 */
export const PUSH_SCENARIOS_P1_TO_P12_ORDERED: readonly PushScenario[] = [
  PUSH_SCENARIOS.BOOKING_REMINDER,
  PUSH_SCENARIOS.BOOKING_CONFIRMED,
  PUSH_SCENARIOS.BOOKING_CANCELLED,
  PUSH_SCENARIOS.SESSION_STARTED,
  PUSH_SCENARIOS.SESSION_COMPLETED,
  PUSH_SCENARIOS.PAYMENT_COMPLETED,
  PUSH_SCENARIOS.PAYMENT_FAILED,
  PUSH_SCENARIOS.SESSION_LOW,
  PUSH_SCENARIOS.CONSULTATION_RECORD_REMINDER,
  PUSH_SCENARIOS.NEW_MESSAGE,
  PUSH_SCENARIOS.MOOD_REMINDER,
  PUSH_SCENARIOS.SYSTEM_NOTICE,
];

/** 3.7절 기준 12종 type 목록 (검증·문서용) */
export const PUSH_SCENARIO_SERVER_TYPES: readonly string[] = PUSH_SCENARIOS_P1_TO_P12_ORDERED.map(
  (s) => s.type,
);

export type PushScenarioType = (typeof PUSH_SCENARIOS)[keyof typeof PUSH_SCENARIOS]['type'];

/** 서버가 보낼 수 있는 추가 type — 동일 카테고리·라우팅 유지 */
const PAYMENT_REFUNDED_SCENARIO: PushScenario = {
  type: 'payment_refunded',
  title: '환불 처리',
  icon: 'RefreshCw',
  route: '/(client)/(more)/sessions-payment/{id}',
  category: 'payment',
  settingsCategory: 'payment',
};

const RECORD_SHARED_SCENARIO: PushScenario = {
  type: 'record_shared',
  title: '상담일지 공유',
  icon: 'FileText',
  route: '/(client)/(sessions)/{id}',
  category: 'session',
  settingsCategory: 'schedule',
};

/** 서버에서 온 `data.type`을 `PUSH_SCENARIOS`의 canonical type으로 정규화 */
export function resolveCanonicalPushType(type: string): string {
  return PUSH_TYPE_ALIASES[type] ?? type;
}

const SCENARIO_BY_TYPE = new Map<string, PushScenario>();

for (const s of Object.values(PUSH_SCENARIOS)) {
  SCENARIO_BY_TYPE.set(s.type, s);
}
SCENARIO_BY_TYPE.set('payment_refunded', PAYMENT_REFUNDED_SCENARIO);
SCENARIO_BY_TYPE.set('record_shared', RECORD_SHARED_SCENARIO);

/**
 * 서버 알림 type으로 시나리오 조회 (별칭·추가 type 포함)
 */
export function getScenarioByType(type: string): PushScenario | undefined {
  return SCENARIO_BY_TYPE.get(resolveCanonicalPushType(type));
}

/**
 * 역할별 라우트 템플릿 선택
 */
export function getRouteTemplateForRole(
  scenario: PushScenario,
  role: 'client' | 'consultant',
): string {
  if (role === 'client' && scenario.routeClient) {
    return scenario.routeClient;
  }
  if (role === 'consultant' && scenario.routeConsultant) {
    return scenario.routeConsultant;
  }
  return scenario.route;
}

/**
 * route 템플릿의 {id}·{scheduleId} 등을 실제 값으로 치환
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
 * (more) 그룹에 역할 프리픽스 부여
 */
export function prefixRoleForMoreRoute(route: string, role: 'client' | 'consultant'): string {
  if (!route.startsWith('/(more)')) {
    return route;
  }
  const group = role === 'consultant' ? '(consultant)' : '(client)';
  return `/${group}${route}`;
}

/**
 * 경로가 현재 역할과 호환되는지 (잘못된 탭 딥링크 방지)
 */
export function routeMatchesRole(route: string, role: 'client' | 'consultant'): boolean {
  if (route.startsWith('/(client)') && role === 'client') {
    return true;
  }
  if (route.startsWith('/(consultant)') && role === 'consultant') {
    return true;
  }
  return false;
}

/**
 * @deprecated prefixRoleForMoreRoute + routeMatchesRole 조합 사용
 */
export function resolveRouteForRole(route: string, role: 'client' | 'consultant'): string {
  let r = route;
  if (role === 'client' && r.startsWith('/(consultant)')) {
    r = r.replace('/(consultant)', '/(client)');
  } else if (role === 'consultant' && r.startsWith('/(client)')) {
    r = r.replace('/(client)', '/(consultant)');
  }
  if (r.startsWith('/(more)')) {
    const group = role === 'consultant' ? '(consultant)' : '(client)';
    r = `/${group}${r}`;
  }
  return r;
}
