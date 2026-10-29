/**
 * Clinic-OS Cover+Chapter — 상담사 홈 상수
 *
 * @author CoreSolution
 * @since 2026-10-29
 */

export const COVER_CHAPTER_ROOT_CLASS = 'consultant-cover-chapter';
export const COVER_CHAPTER_TEST_ID = 'consultant-cover-chapter-home';
export const COVER_CHAPTER_NEXT_SHEET_TEST_ID = 'consultant-home-next-sheet';
export const COVER_CHAPTER_SCHEDULE_TEST_ID = 'consultant-home-schedule-chapter';
export const COVER_CHAPTER_GUIDE_TEST_ID = 'consultant-home-guide-chapter';

export const COVER_CHAPTER_BRAND_FALLBACK = '마인드가든';
export const COVER_CHAPTER_KICKER_PREFIX = '상담실';
export const COVER_CHAPTER_CONSULTANT_SUFFIX = '상담사';

export const COVER_CHAPTER_NEXT_LABEL = '다음 상담';
export const COVER_CHAPTER_BADGE_CONFIRMED = '확정';
export const COVER_CHAPTER_BADGE_NONE = '없음';

export const COVER_CHAPTER_CTA_OPEN_CONSULTATION = '상담 열기';
export const COVER_CHAPTER_CTA_SCHEDULE = '일정';
export const COVER_CHAPTER_CTA_OPEN_SCHEDULE = '일정 열기';
export const COVER_CHAPTER_WEEKLY_SCHEDULE_LINK = '주간 일정 보기';
export const COVER_CHAPTER_VIEW_ALL = '전체';

export const COVER_CHAPTER_ZERO_DOM = '0';
export const COVER_CHAPTER_ZERO_UNIT = '건';
export const COVER_CHAPTER_ZERO_BODY = '오늘 일정이 비어 있어요';
export const COVER_CHAPTER_ZERO_META = '주간 일정에서 배정·확인을 이어가세요';
export const COVER_CHAPTER_ZERO_COVER_SUB = '오늘은 예정된 상담이 없어요';

export const COVER_CHAPTER_EMPTY_TITLE = '오늘 일정이 없어요';
export const COVER_CHAPTER_EMPTY_DESC = '다음 상담이 잡히면 여기에 시간순으로 모입니다';

export const COVER_CHAPTER_CHAP_SCHEDULE_NUM = '01';
export const COVER_CHAPTER_CHAP_SCHEDULE_TITLE = '일정';
export const COVER_CHAPTER_CHAP_GUIDE_NUM = '02';
export const COVER_CHAPTER_CHAP_GUIDE_TITLE = '안내';

export const COVER_CHAPTER_GUIDE_DEFAULT_TITLE = '센터 공지';
export const COVER_CHAPTER_GUIDE_EMPTY = '새 안내가 없습니다';
export const COVER_CHAPTER_INCOMPLETE_HINT = (count) => (
  `미작성 일지 ${count}건 · 당일 작성 권장`
);

export const COVER_CHAPTER_PILL_NEXT = '다음';
export const COVER_CHAPTER_PILL_DONE = '완료';
export const COVER_CHAPTER_PILL_WAIT = '대기';

export const COVER_CHAPTER_CHIP_TODAY = '오늘';
export const COVER_CHAPTER_CHIP_DONE = '완료';
export const COVER_CHAPTER_CHIP_REMAINING = '남은';

export const COVER_CHAPTER_MODE_FACE = '대면';
export const COVER_CHAPTER_MODE_VIDEO = '화상';

export const COVER_CHAPTER_GUIDE_MORE_ARIA = '안내 더보기';

/** Cover SVG — split 좌커버(세로) / stack 전폭(가로, ipad-p) */
export const COVER_CHAPTER_SVG_VARIANT_PORTRAIT = 'portrait';
export const COVER_CHAPTER_SVG_VARIANT_LANDSCAPE = 'landscape';

/**
 * 「다음 대기」 후보 상태 — 01 일정 매퍼 wait/확정 계열과 정합
 * COMPLETED·CANCELLED·NO_SHOW 등은 제외
 */
export const COVER_CHAPTER_NEXT_WAITING_STATUSES = Object.freeze([
  'PENDING',
  'WAITING',
  'CONFIRMED',
  'IN_PROGRESS',
  'BOOKED',
  'SCHEDULED'
]);

/**
 * @deprecated 레이아웃 SSOT는 COVER_CHAPTER_TABLET_SPLIT_MQ.
 * 과거 ≥1280+fine-pointer → stack 강제에 쓰였으나 폐기(시안 web=split).
 */
export const COVER_CHAPTER_DESKTOP_SHELL_MQ =
  '(min-width: 1280px) and (hover: hover) and (pointer: fine)';

/**
 * Cover+Chapter 레이아웃 SSOT — ≥1024 항상 split(좌커버|우시트+챕터).
 * 데스크톱 1280·1440·1920 · 태블릿 가로 1180 포함. <1024 → stack.
 */
export const COVER_CHAPTER_TABLET_SPLIT_MQ = '(min-width: 1024px)';
