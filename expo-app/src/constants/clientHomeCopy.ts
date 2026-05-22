/**
 * 내담자 홈 화면 문구·라우트
 *
 * @author MindGarden
 * @since 2026-05-22
 */
export const CLIENT_HOME_COPY = {
  KPI_SECTION_TITLE: '핵심 지표',
  KPI_REMAINING_SESSIONS: '남은 회기',
  KPI_THIS_MONTH_SESSIONS: '이번 달 상담',
  KPI_UNREAD_MESSAGES: '읽지 않은 메시지',
  UNIT_SESSION: '회',
  UNIT_MESSAGE: '건',
} as const;

export const CLIENT_HOME_ROUTES = {
  SESSIONS_PAYMENT: '/(client)/(more)/sessions-payment',
  SESSIONS: '/(client)/(sessions)',
  MESSAGES: '/(client)/(more)/messages',
} as const;
