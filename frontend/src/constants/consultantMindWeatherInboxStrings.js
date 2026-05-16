/**
 * 상담사 마음 날씨 수신함 — 라우트·카피
 *
 * @author MindGarden
 * @since 2026-05-16
 */

/** 더보기 하위 진입 경로 (App·허브·AppShell 제목 공통) */
export const CONSULTANT_MIND_WEATHER_INBOX_ROUTE = '/consultant/more/mind-weather-inbox';

export const CONSULTANT_MIND_WEATHER_INBOX_STRINGS = {
  PAGE_TITLE: '마음 날씨 수신함',
  PAGE_SUBTITLE: '내담자가 상담사에게 공유한 마음 날씨 카드를 확인합니다.',
  ARIA_MAIN: '마음 날씨 수신함 본문',
  MENU_TITLE: '마음 날씨 수신함',
  MENU_SUBTITLE: '공유된 카드·요약·키워드',
  LOADING: '수신함을 불러오는 중입니다…',
  EMPTY: '아직 공유된 마음 날씨가 없습니다.',
  ERROR_FALLBACK: '수신함을 불러오지 못했습니다.',
  RETRY: '다시 시도',
  CARD_META: '등록',
  LABEL_CLIENT: '내담자',
  /** `clientName` 비어 있을 때 카드 제목 — 회원 식별 */
  CLIENT_HEADLINE_ID_PREFIX: '내담자 #',
  LABEL_TONE: '톤',
  LABEL_SOURCE: '출처',
  LABEL_SUMMARY: '요약',
  LABEL_TEXT: '원문',
  LABEL_KEYWORDS: '키워드',
  SHARE_SCOPE: '공유 범위',
  SHARE_SUMMARY_ONLY: '요약만',
  SHARE_ORIGINAL_ONLY: '원문만',
  SHARE_BOTH: '요약·원문',
  SHARE_NONE: '—'
};
