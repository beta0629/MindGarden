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
  KPI_NEW_CLIENTS: '신규 내담',
  UNIT_SESSION: '건',
  UNIT_MESSAGE: '건',
  UNIT_CLIENT: '명',
  PENDING_BANNER: (count: number) => `미작성 일지 ${count}건이 있습니다.`,
  PENDING_BANNER_CTA: '바로가기 >',
  PENDING_BANNER_A11Y: (count: number) => `미작성 일지 ${count}건`,
  URGENT_CLIENT_BANNER: (name: string, riskLabel: string) =>
    `긴급: ${name} 님 (${riskLabel})`,
  URGENT_CLIENT_BANNER_A11Y: (name: string, riskLabel: string) =>
    `긴급 내담자 ${name} 님, ${riskLabel}`,
  riskLevelLabel: (riskLevel: string): string => {
    const u = String(riskLevel ?? '').toUpperCase();
    if (u === 'CRITICAL') return '위험';
    if (u === 'HIGH') return '고위험';
    if (u === 'MEDIUM') return '주의';
    return '확인 필요';
  },
  NEXT_SESSION_TITLE: '다음 상담',
  NEXT_SESSION_BADGE_TODAY: '오늘',
  NEXT_SESSION_BADGE_TOMORROW: '내일',
  NEXT_SESSION_RECORD_CTA: '상담일지 작성',
  NEXT_SESSION_DETAIL_CTA: '상세 보기',
  NEXT_SESSION_A11Y: (clientName: string, timeRange: string) =>
    `다음 상담 ${clientName} 님, ${timeRange}`,
  SNAPSHOT_MESSAGE_TITLE: '최근 메시지',
  SNAPSHOT_MESSAGE_PREVIEW: (partnerName: string, preview: string) =>
    `${partnerName}: ${preview}`,
  SNAPSHOT_MESSAGE_A11Y: (partnerName: string) => `${partnerName} 메시지 스레드`,
  SNAPSHOT_SALARY_TITLE: '급여 정산',
  SNAPSHOT_SALARY_PREVIEW: (period: string, net: string) => `${period} · ${net}`,
  SNAPSHOT_SALARY_EMPTY: '정산 내역 없음',
  SNAPSHOT_SALARY_A11Y: (period: string) => `급여 정산 ${period}`,
  SCHEDULE_SECTION_TITLE: '오늘의 스케줄',
  SCHEDULE_VIEW_ALL: '전체 보기',
  SCHEDULE_VIEW_ALL_A11Y: '오늘 스케줄 전체 보기',
  QUICK_ACTIONS_TITLE: '빠른 액션',
  /** 웹 SSOT: CONSULTANT_DASHBOARD_QUICK_ACTIONS 「일정 확인」(create-schedule 없음) */
  QUICK_ACTION_SCHEDULE: '일정 확인',
  QUICK_ACTION_AVAILABILITY: '근무 설정',
  QUICK_ACTION_MESSAGES: '메시지',
  QUICK_ACTION_RECORDS: '일지',
  QUICK_ACTION_SALARY: '급여',
  EMPTY_SCHEDULE_TITLE: '오늘 예정된 상담이 없습니다',
  EMPTY_SCHEDULE_DESCRIPTION: '오늘은 예정된 상담이 없습니다.',
  EMPTY_SCHEDULE_ACTION: '스케줄 보기',
  NOTIFICATIONS_A11Y: '알림 센터',
} as const;

/**
 * 상담사 커버 홈 v4 — 일정·진행·기록만. 금액·결제·미결제 문구를 두지 않는다
 * (`consultantCoverCopy.test` 로 회귀 고정).
 */
export const CONSULTANT_COVER_COPY = {
  ROLE_LABEL: '상담사',
  NAME_FALLBACK: '상담사',
  nameLabel: (name: string) => `${name} 상담사`,
  todaySummary: (total: number, completed: number, inProgress: number, scheduled: number) =>
    `오늘 ${total}건 · 완료 ${completed} · 진행 ${inProgress} · 예정 ${scheduled}`,
  TODAY_SUMMARY_ZERO: '오늘 예정된 상담이 없어요',
  clientLabel: (name: string) => `${name} 님`,
  ENTRY_CTA: '다음 상담 입장',
  ENTRY_CTA_A11Y: '다음 상담 상세 보기',
  HERO_EMPTY_TITLE: '남은 상담이 없어요',
  HERO_EMPTY_DESCRIPTION: '새 일정이 확정되면 이곳에 표시돼요.',
  HERO_EMPTY_ACTION: '일정 확인',
  missingJournalRow: (count: number) => `일지 미작성 ${count}건`,
  urgentClientRow: (name: string, riskLabel: string) => `${name} 님 확인 필요 · ${riskLabel}`,
  IN_PROGRESS_TITLE: '지금 진행 중',
  IN_PROGRESS_LEAD: '현재',
  durationLabel: (minutes: number) => `${minutes}분 상담`,
  UPCOMING_TITLE: '이후 일정',
  upcomingCount: (count: number) => `오늘 ${count}`,
  UPCOMING_EMPTY: '오늘 남은 일정이 없어요',
  UPCOMING_EMPTY_ACTION: '일정 확인',
  RECORDS_TITLE: '상담 기록',
  recordsCount: (count: number) => `작성할 일지 ${count}건`,
  RECORDS_PROMPT: '상담을 마친 후 일지를 기록하세요',
  RECORDS_EMPTY: '작성할 일지가 없어요',
  RECORDS_EMPTY_ACTION: '기록 확인',
  RECORDS_A11Y: '상담 기록 보기',
  TODAY_LABEL: '오늘',
  LANDSCAPE_FOOTNOTE: '일정과 상담 기록만 표시',
} as const;

export const CONSULTANT_HOME_ROUTES = {
  NOTIFICATIONS: '/(consultant)/(more)/notifications',
  SCHEDULE: '/(consultant)/(schedule)/',
  AVAILABILITY: '/(consultant)/(more)/availability',
  RECORDS: '/(consultant)/(records)/',
  MESSAGES: '/(consultant)/(more)/messages',
  SALARY: '/(consultant)/(more)/salary-settlement',
  CLIENTS: '/(consultant)/(clients)/',
  CLIENT_DETAIL: (clientId: number | string) =>
    `/(consultant)/(clients)/${encodeURIComponent(String(clientId))}`,
  scheduleDetail: (scheduleId: number | string) =>
    `/(consultant)/(schedule)/${encodeURIComponent(String(scheduleId))}`,
  recordCreate: (scheduleId: number | string) =>
    `/(consultant)/(records)/create/${encodeURIComponent(String(scheduleId))}`,
} as const;
