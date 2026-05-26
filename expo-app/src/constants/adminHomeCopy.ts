/**
 * 어드민·스태프 모바일 홈 문구·라우트
 *
 * @author MindGarden
 * @since 2026-05-22
 */
export const ADMIN_MOBILE_HOME_COPY = {
  TITLE: '관리 홈',
  GREETING: '안녕하세요',
  TENANT_LABEL: '테넌트',
  UNREAD_NOTIFICATIONS: '읽지 않은 알림',
  TODAY_SCHEDULES: '오늘 일정',
  KPI_SECTION_TITLE: '운영 지표',
  SUMMARY_TODAY_SCHEDULES: '오늘 {count}건의 일정',
  SUMMARY_PENDING_OPS: '{count}건의 처리 대기',
  SUMMARY_CONNECTOR: ', ',
  TODAY_SCHEDULE_PREVIEW_TITLE: '오늘 일정',
  VIEW_ALL: '전체 보기',
  EMPTY_TODAY_SCHEDULE: '오늘 예정된 일정이 없습니다',
  QUICK_LINKS_TITLE: '빠른 액션',
  QUICK_CREATE_SCHEDULE: '일정 등록',
  QUICK_SCHEDULE: '스케줄',
  QUICK_MESSAGES: '메시지',
  UNIT_COUNT: '건',
  /** 레거시 바로가기 — P0 QuickActionBar에서 미사용 */
  LINK_MESSAGES: '메시지',
  LINK_OPERATION: '운영',
  LINK_MORE: '더보기',
  LINK_NOTIFICATIONS: '알림 센터',
} as const;

export const ADMIN_HOME_ROUTES = {
  CREATE_SCHEDULE: '/(admin)/(operation)/schedule/create',
  SCHEDULE: '/(admin)/(operation)/schedule',
  MESSAGES: '/(admin)/(messages)',
  NOTIFICATION_CENTER: '/(admin)/(more)/notifications',
  NOTIFICATION_SETTINGS: '/(admin)/(more)/notification-settings',
} as const;
