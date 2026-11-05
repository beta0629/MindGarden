/**
 * 통합 스케줄 — 관리자 회기권 패키지 만료 임박 알림 SSOT
 *
 * 상담 시작 전 특이사항 알림과 동일 시간 창을 쓰되, 문구·제목은 분리한다.
 * 타기관 연계·바우처·당일카드는 회기권이 아니므로 대상이 아니다.
 *
 * 임계: 백엔드 {@code ScheduleServiceImpl} 회기 임박 푸시
 * {@code rem > 0 && rem <= 2} 와 동일.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */

import {
  SCHEDULE_NOTES_REMINDER_LEAD_MS,
  SCHEDULE_NOTES_REMINDER_POLL_MS
} from './scheduleNotesReminderConstants';

/** 상담 시작 5분 전부터 시작 시각까지 — 특이사항 알림과 동일 창 */
export const PACKAGE_EXPIRY_REMINDER_LEAD_MS = SCHEDULE_NOTES_REMINDER_LEAD_MS;

/** 스케줄 이벤트 폴링 간격 — 특이사항 알림과 동일 */
export const PACKAGE_EXPIRY_REMINDER_POLL_MS = SCHEDULE_NOTES_REMINDER_POLL_MS;

/** 회기 임박 최소 잔여(1회). 0은 이미 소진 */
export const PACKAGE_EXPIRY_REMINDER_MIN_REMAINING_SESSIONS = 1;

/**
 * 회기 임박 최대 잔여.
 * 백엔드 {@code dispatchSessionLow}: remaining 1~2회.
 */
export const PACKAGE_EXPIRY_REMINDER_MAX_REMAINING_SESSIONS = 2;

/** 이 슬라이스에 두지 않는 바우처 paymentTiming — 회기권 알림에서 제외 */
export const PACKAGE_EXPIRY_EXCLUDED_VOUCHER_TIMING = 'VOUCHER';

/** 타기관 연계 paymentTiming — 회기 만료 알림 대상 아님 */
export const PACKAGE_EXPIRY_EXCLUDED_INSTITUTION_LINK_TIMING = 'INSTITUTION_LINK';

export const PACKAGE_EXPIRY_REMINDER_TITLE = '회기권 패키지 만료 임박';

export const PACKAGE_EXPIRY_REMINDER_LEAD =
  '상담 시작 전입니다. 이 내담자의 회기권 패키지 잔여 회기가 얼마 남지 않았습니다.';

export const PACKAGE_EXPIRY_REMINDER_SECTION_TITLE = '회기권 잔여';

export const PACKAGE_EXPIRY_REMINDER_CONFIRM_LABEL = '확인했습니다';

export const PACKAGE_EXPIRY_REMINDER_LAST_SESSION_HINT =
  '이번 상담이 회기권의 마지막 회기입니다. 연장·재계약을 확인해 주세요.';

export const PACKAGE_EXPIRY_REMINDER_LOW_SESSIONS_HINT =
  '남은 회기가 얼마 없습니다. 연장·재계약을 확인해 주세요.';
