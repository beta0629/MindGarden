/**
 * 통합 스케줄 — 상담 시작 전 특이사항 알림 SSOT
 *
 * @author CoreSolution
 * @since 2026-09-02
 */

/** 기본 OFF — 운영자가 명시적으로 켤 때만 알림 */
export const SCHEDULE_NOTES_REMINDER_OFF = 'off';

/** 알림 ON */
export const SCHEDULE_NOTES_REMINDER_ON = 'on';

export const SCHEDULE_NOTES_REMINDER_MODES = [
  SCHEDULE_NOTES_REMINDER_OFF,
  SCHEDULE_NOTES_REMINDER_ON
];

/** `useViewModePreference` pageId */
export const SCHEDULE_NOTES_REMINDER_PAGE_ID = 'admin.integrated-schedule.notes-reminder';

export const SCHEDULE_NOTES_REMINDER_DEFAULT_MODE = SCHEDULE_NOTES_REMINDER_OFF;

/** 상담 시작 5분 전부터 시작 시각까지 알림 윈도우 */
export const SCHEDULE_NOTES_REMINDER_LEAD_MS = 5 * 60 * 1000;

/** 스케줄 이벤트 폴링 간격 */
export const SCHEDULE_NOTES_REMINDER_POLL_MS = 30 * 1000;
