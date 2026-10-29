/**
 * 상담사 웹 태블릿 일지 목록·상세 P1 — 클래스·필터·테스트 id 상수
 * 시안: tobe-journal-list / tobe-journal-detail · shell-outline soft-sheet
 *
 * @author CoreSolution
 * @since 2026-10-28
 */

/** 상담사 셸 Desktop LNB 게이트와 동일 — 미만이면 태블릿 일지 UI */
export const CONSULTANT_JOURNAL_TABLET_MAX_WIDTH = 1023;

export const CONSULTANT_JOURNAL_TABLET_MEDIA = `(max-width: ${CONSULTANT_JOURNAL_TABLET_MAX_WIDTH}px)`;

export const CONSULTANT_JOURNAL_TABLET_CLASS = {
  ROOT: 'consultant-journal-tablet',
  CHIPS: 'consultant-journal-tablet__chips',
  CHIP: 'consultant-journal-tablet__chip',
  CHIP_ON: 'consultant-journal-tablet__chip--on',
  LIST: 'consultant-journal-tablet__list',
  ROW: 'consultant-journal-tablet__row',
  ROW_MAIN: 'consultant-journal-tablet__row-main',
  ROW_NAME: 'consultant-journal-tablet__row-name',
  ROW_META: 'consultant-journal-tablet__row-meta',
  PILL: 'consultant-journal-tablet__pill',
  PILL_OPEN: 'consultant-journal-tablet__pill--open',
  PILL_DONE: 'consultant-journal-tablet__pill--done',
  EMPTY: 'consultant-journal-tablet__empty',
  EMPTY_TITLE: 'consultant-journal-tablet__empty-title',
  EMPTY_CAP: 'consultant-journal-tablet__empty-cap',
  EMPTY_ACTION: 'consultant-journal-tablet__empty-action',
  DETAIL: 'consultant-journal-tablet-detail',
  DETAIL_STAGE: 'consultant-journal-tablet-detail__stage',
  DETAIL_LAYOUT: 'consultant-journal-tablet-detail__layout',
  DETAIL_SUMMARY: 'consultant-journal-tablet-detail__summary',
  DETAIL_NAME: 'consultant-journal-tablet-detail__name',
  DETAIL_META: 'consultant-journal-tablet-detail__meta',
  DETAIL_BODY: 'consultant-journal-tablet-detail__body',
  DETAIL_SEC_TITLE: 'consultant-journal-tablet-detail__sec-title',
  DETAIL_BLOCK: 'consultant-journal-tablet-detail__block',
  DETAIL_LAB: 'consultant-journal-tablet-detail__lab',
  DETAIL_RO: 'consultant-journal-tablet-detail__ro',
  DETAIL_STATUS: 'consultant-journal-tablet-detail__status',
  DETAIL_ACTIONS: 'consultant-journal-tablet-detail__actions',
  DETAIL_BTN: 'consultant-journal-tablet-detail__btn',
  DETAIL_BTN_LIST: 'consultant-journal-tablet-detail__btn--list',
  DETAIL_BTN_EDIT: 'consultant-journal-tablet-detail__btn--edit'
};

export const CONSULTANT_JOURNAL_TABLET_TEST_ID = {
  LIST: 'consultant-journal-tablet-list',
  ROW: 'consultant-journal-tablet-row',
  DETAIL: 'consultant-journal-tablet-detail',
  STATUS_CHIPS: 'consultant-journal-tablet-status-chips'
};

/** 작성 상태 필터 칩 — API status(done/pending/'')와 1:1 */
export const CONSULTANT_JOURNAL_STATUS_CHIP = {
  ALL: 'all',
  PENDING: 'pending',
  DONE: 'done'
};
