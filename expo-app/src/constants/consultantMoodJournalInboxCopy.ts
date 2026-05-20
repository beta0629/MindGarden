/**
 * 상담사 감정 일기 수신함 카피.
 *
 * @author MindGarden
 * @since 2026-05-21
 */

export const CONSULTANT_MOOD_JOURNAL_INBOX_FETCH_FAILED =
  '감정 일기 수신함을 불러오지 못했습니다.';

export const CONSULTANT_MOOD_JOURNAL_INBOX_SETUP_NO_TOKEN =
  '로그인 정보가 없어요. 다시 로그인해 주세요.';

export const CONSULTANT_MOOD_JOURNAL_INBOX_SETUP_NO_TENANT =
  '기관 정보를 확인하지 못했어요. 다시 로그인하거나 당겨서 새로고침해 주세요.';

export const CONSULTANT_MOOD_JOURNAL_INBOX_COPY = {
  PAGE_TITLE: '감정 일기 수신함',
  HEADER_TITLE: '내담자 감정 일기',
  HEADER_DESC:
    '내담자가 직접 공유 동의한 일기만 보여요. 일기 내용은 상담 참고용이며 의학적 진단이 아닙니다.',
  EMPTY_TITLE: '아직 공유받은 일기가 없어요',
  EMPTY_DESC_API:
    '서버에 공유된 일기가 없거나, 다른 기관·계정으로 조회 중일 수 있어요. 당겨서 새로고침하거나 다시 로그인해 보세요.',
  EMPTY_DESC_DEFAULT: '내담자가 공유 동의를 켜면 이 화면에 일기가 도착해요.',
  SETUP_ERROR_TITLE: '수신함을 준비하지 못했어요',
  FETCH_ERROR_TITLE: '수신함을 불러오지 못했어요',
  RETRY: '다시 시도',
  LABEL_MEMO: '메모',
  LABEL_TAGS: '태그',
  LABEL_MOOD: '오늘의 기분',
  MENU_TITLE: '감정 일기 수신함',
  MENU_SUBTITLE: '내담자가 공유한 감정 일기',
} as const;
