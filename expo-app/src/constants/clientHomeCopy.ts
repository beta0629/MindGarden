/**
 * 내담자 홈 화면 문구·라우트
 *
 * @author MindGarden
 * @since 2026-05-22
 * @updated 2026-11-06 — 커버+챕터 v4 (CLIENT_COVER_COPY · CLIENT_SCHEDULE_CHAPTER_COPY)
 */
export const CLIENT_HOME_COPY = {
  KPI_SECTION_TITLE: '핵심 지표',
  KPI_REMAINING_SESSIONS: '남은 회기',
  KPI_THIS_MONTH_SESSIONS: '이번 달 상담',
  KPI_UNREAD_MESSAGES: '읽지 않은 메시지',
  UNIT_SESSION: '회',
  UNIT_MESSAGE: '건',
} as const;

/**
 * 내담자 커버 홈 v4 — 예약 CTA 없음. 미결제 문구는 「내 상담 회기」 블록에서만 사용한다.
 */
export const CLIENT_COVER_COPY = {
  NAME_FALLBACK: '내담자',
  greetingName: (name: string) => `${name} 님`,
  GREETING_SUB: '상담 일정과 입장 정보를 확인하세요.',
  LANDSCAPE_NAME_SUFFIX: ' · 상담',
  ENTRY_CTA: '상담실 입장',
  ENTRY_CTA_A11Y: '다음 상담 상세와 입장 정보 보기',
  consultantLabel: (name: string) => `${name} 상담사`,
  HERO_EMPTY_TITLE: '예정된 상담이 없어요',
  HERO_EMPTY_DESCRIPTION: '센터에서 일정을 확정하면 이곳에 표시돼요.',
  HERO_EMPTY_ACTION: '알림 확인',
  HERO_ERROR_TITLE: '일정을 불러오지 못했어요',
  HERO_ERROR_ACTION: '다시 시도',
  PROGRESS_TITLE: '내 상담 회기',
  progressRemainingUnit: (total: string) => `/ ${total}회 남음`,
  progressDetail: (used: number, nextSessionNumber: number | null) =>
    nextSessionNumber != null ? `${used}회 완료 · 다음 ${nextSessionNumber}회차` : `${used}회 완료`,
  PROGRESS_EMPTY: '이용 중인 회기가 없어요',
  PROGRESS_A11Y: '회기·결제 내역 보기',
  unpaidChip: (count: number) => `미결제 ${count}건`,
  UPCOMING_TITLE: '이후 일정',
  PAST_TITLE: '지난 상담',
  PAST_ACTION: '기록 확인',
  UPCOMING_EMPTY: '이후 예정된 상담이 없어요',
  PAST_EMPTY: '지난 상담 기록이 없어요',
  LANDSCAPE_FOOTNOTE: '센터에서 확정한 일정만 표시',
} as const;

/**
 * 내담자 일정 챕터(예약 탭) v4 — 배너·알림 섹션 없음, 예약 생성 CTA 없음.
 */
export const CLIENT_SCHEDULE_CHAPTER_COPY = {
  TITLE: '예약',
  SUBTITLE: '다음 일정부터 지난 상담 기록까지',
  remainingSummary: (remaining: string, total: string) => `잔여 ${remaining} / ${total}회`,
  UNPAID_CHIP: '미결제',
  upcomingCount: (count: number) => `예정 ${count}건`,
  UPCOMING_TITLE: '예정',
  UPCOMING_SORT: '날짜순',
  PAST_TITLE: '지난 상담',
  UPCOMING_EMPTY: '예정된 상담이 없어요',
  PAST_EMPTY: '완료된 상담이 없어요',
  LOAD_MORE: '이전 상담 더 보기',
  FOOTNOTE: '변경이 필요하면 센터로 문의해 주세요.',
  LIST_ERROR_TITLE: '상담 목록을 불러오지 못했어요',
  LIST_ERROR_ACTION: '다시 시도',
} as const;

export const CLIENT_HOME_ROUTES = {
  SESSIONS_PAYMENT: '/(client)/(more)/sessions-payment',
  SESSIONS: '/(client)/(sessions)',
  MESSAGES: '/(client)/(more)/messages',
  NOTIFICATIONS: '/(client)/(more)/notifications',
  sessionDetail: (id: number | string) => `/(client)/(sessions)/${encodeURIComponent(String(id))}`,
} as const;
