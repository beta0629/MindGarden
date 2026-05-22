/**
 * 상담사 홈 화면 문구·라우트
 *
 * @author MindGarden
 * @since 2026-05-22
 */
export const CONSULTANT_HOME_COPY = {
  TOP_BAR_TITLE: '홈',
  GREETING: (name: string) => `안녕하세요, ${name}님!`,
  GREETING_FALLBACK_NAME: '선생',
  TODAY_SUMMARY_ZERO: '오늘 예정된 상담이 없어요.',
  KPI_SECTION_TITLE: '핵심 지표',
  KPI_TODAY_SESSIONS: '오늘 상담',
  KPI_UNREAD_MESSAGES: '안읽은 메시지',
  UNIT_SESSION: '건',
  UNIT_MESSAGE: '건',
  PENDING_BANNER: (count: number) => `미작성 일지 ${count}건이 있습니다.`,
  PENDING_BANNER_CTA: '바로가기 >',
  PENDING_BANNER_A11Y: (count: number) => `미작성 일지 ${count}건`,
  SCHEDULE_SECTION_TITLE: '오늘의 스케줄',
  SCHEDULE_VIEW_ALL: '전체 보기',
  SCHEDULE_VIEW_ALL_A11Y: '오늘 스케줄 전체 보기',
  QUICK_ACTIONS_TITLE: '빠른 액션',
  QUICK_ACTION_SCHEDULE: '일정 추가',
  QUICK_ACTION_AVAILABILITY: '근무 설정',
  EMPTY_SCHEDULE_TITLE: '오늘 예정된 상담이 없습니다',
  EMPTY_SCHEDULE_DESCRIPTION: '새로운 상담 일정을 추가해보세요.',
  EMPTY_SCHEDULE_ACTION: '일정 추가',
  NOTIFICATIONS_A11Y: '알림 센터',
} as const;

export const CONSULTANT_HOME_ROUTES = {
  NOTIFICATIONS: '/(consultant)/(more)/notifications',
  SCHEDULE: '/(consultant)/(schedule)/',
  AVAILABILITY: '/(consultant)/(more)/availability',
  RECORDS: '/(consultant)/(records)/',
  MESSAGES: '/(consultant)/(more)/messages',
} as const;
