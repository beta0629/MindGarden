/**
 * 내담자 홈 「다음 한 장」로비 문구·라우트
 *
 * @author MindGarden
 * @since 2026-05-22
 */
export const CLIENT_HOME_COPY = {
  TOP_BAR_TITLE: '홈',
  GREETING: (name: string) => `안녕하세요, ${name} 님`,
  NO_UPCOMING_META: '예정된 상담 없음',
  NO_UPCOMING_SHEET_META: '센터에서 일정을 준비하면 여기에 표시됩니다.',
  UPCOMING_TODAY_META: '오늘 상담이 있어요',
  daysUntilMeta: (days: number) => `다음 상담까지 ${days}일`,
  NEXT_SHEET_TITLE: '다가오는 상담',
  NEXT_SHEET_CTA: '자세히 보기',
  NEXT_SHEET_NOTE:
    '센터에서 준비한 일정입니다. 변경이 필요하시면 센터로 문의해 주세요.',
  CHIP_NEXT_LABEL: '다음 예약',
  CHIP_NEXT_NONE: '없음',
  CHIP_REMAINING_LABEL: '남은 회기',
  CHIP_COUNSELOR_LABEL: '담당',
  CHIP_PAYMENT_LABEL: '결제',
  CHIP_PACKAGE_BADGE: '패키지',
  UNIT_SESSION_PACKAGE: '회기',
  FALLBACK_MUTE: '—',
  FALLBACK_CONSULTANT: '담당 상담사',
  FALLBACK_CONSULTANT_SHORT: '—',
  TIP_FALLBACK: '마음 한 줄 · 호흡을 한번 고르고 오세요',
  TIP_PREFIX: '마음 한 줄 · ',
} as const;

export const CLIENT_HOME_ROUTES = {
  SESSIONS_PAYMENT: '/(client)/(more)/sessions-payment',
  SESSIONS: '/(client)/(sessions)',
  MESSAGES: '/(client)/(more)/messages',
  NOTIFICATIONS: '/(client)/(more)/notifications',
} as const;
