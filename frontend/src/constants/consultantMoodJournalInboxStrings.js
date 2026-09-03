/**
 * 상담사 감정 일기 수신함 — 라우트·카피 (Expo consultantMoodJournalInboxCopy 정합)
 *
 * @author MindGarden
 * @since 2026-09-03
 */

/** 더보기 하위 진입 경로 (App·허브·LNB·AppShell 제목 공통) */
export const CONSULTANT_MOOD_JOURNAL_INBOX_ROUTE = '/consultant/more/mood-journal-inbox';

export const CONSULTANT_MOOD_JOURNAL_INBOX_STRINGS = {
  PAGE_TITLE: '감정 일기 수신함',
  PAGE_SUBTITLE: '내담자가 직접 공유 동의한 일기만 보여요.',
  ARIA_MAIN: '감정 일기 수신함 본문',
  MENU_TITLE: '감정 일기 수신함',
  MENU_SUBTITLE: '내담자가 공유한 감정 일기',
  LOADING: '수신함을 불러오는 중입니다…',
  EMPTY: '아직 공유받은 일기가 없어요.',
  EMPTY_HINT: '내담자가 공유 동의를 켜면 이 화면에 일기가 도착해요.',
  ERROR_FALLBACK: '감정 일기 수신함을 불러오지 못했습니다.',
  RETRY: '다시 시도',
  CARD_META: '작성일',
  LABEL_CLIENT: '내담자',
  CLIENT_HEADLINE_ID_PREFIX: '내담자 #',
  LABEL_MOOD: '오늘의 기분',
  LABEL_TAGS: '태그',
  LABEL_MEMO: '메모'
};
