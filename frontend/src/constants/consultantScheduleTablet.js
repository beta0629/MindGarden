/**
 * 상담사 태블릿 일정 v2 — 클래스·미디어·테스트 id (clinic-os / #1769)
 * SSOT: tobe-schedule-v2 · schedule-v2-notes · critique 2026-10-29
 *
 * @author CoreSolution
 * @since 2026-10-28
 */

/**
 * 세로·좁은 폭 — 일 아젠다 / 주 리스트 (타임그리드 금지).
 * 셸 태블릿 max(1279)와 정합 — 768–1279 portrait 포함.
 */
export const CONSULTANT_SCHEDULE_TABLET_PORTRAIT_MQ =
  '(max-width: 1279px) and (orientation: portrait)';

/**
 * 가로 — 주 타임그리드 허용(월 기본 금지).
 * true desktop(≥1280 + fine-pointer) month 기본은 보존:
 * landscape AND (폭≤1279 OR 터치/coarse).
 */
export const CONSULTANT_SCHEDULE_TABLET_LANDSCAPE_MQ =
  '(orientation: landscape) and ((max-width: 1279px) or (hover: none) or (pointer: coarse))';

export const CONSULTANT_SCHEDULE_TABLET_CLASS = {
  PANEL_ATTR: 'data-tablet-schedule-v2',
  VIEW_ROOT: 'mg-v2-schedule-calendar-view--consultant-tablet-v2',
  VIEW_AGENDA_ACTIVE: 'mg-v2-schedule-calendar-view--tablet-agenda-active',
  VIEW_LANDSCAPE: 'mg-v2-schedule-calendar-view--tablet-landscape',
  AGENDA: 'consultant-schedule-tablet-agenda',
  AGENDA_WEEK: 'consultant-schedule-tablet-agenda--week',
  DAY_GROUP: 'consultant-schedule-tablet-agenda__day',
  DAY_LABEL: 'consultant-schedule-tablet-agenda__day-label',
  ITEM: 'consultant-schedule-tablet-agenda__item',
  ITEM_NOW: 'consultant-schedule-tablet-agenda__item--now',
  ITEM_DONE: 'consultant-schedule-tablet-agenda__item--done',
  TIME: 'consultant-schedule-tablet-agenda__time',
  TIME_END: 'consultant-schedule-tablet-agenda__time-end',
  BODY: 'consultant-schedule-tablet-agenda__body',
  NAME: 'consultant-schedule-tablet-agenda__name',
  META: 'consultant-schedule-tablet-agenda__meta',
  CHIP: 'consultant-schedule-tablet-agenda__chip'
};

export const CONSULTANT_SCHEDULE_TABLET_TEST_ID = {
  AGENDA: 'consultant-schedule-tablet-agenda',
  ITEM: 'consultant-schedule-tablet-agenda-item'
};
