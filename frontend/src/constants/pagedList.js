/**
 * 공통 목록 페이징 상수 — 관리자 목록(adminListFetch)과 같은 page/size 기준.
 * 서버 page 는 0부터, 화면 페이지 번호는 1부터.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

/** 서버 첫 페이지 (Spring Pageable 0-base) */
export const PAGED_LIST_FIRST_PAGE = 0;

/** 내담자 목록 기본 page size */
export const CLIENT_LIST_PAGE_SIZE = 20;

/** 목록 배열을 찾을 응답 키 (앞에서부터) */
export const PAGED_LIST_ITEM_KEYS = Object.freeze([
  'content',
  'items',
  'list',
  'notifications',
  'messages',
  'data'
]);

export const PAGED_LIST_COPY = Object.freeze({
  LOAD_MORE: '더 보기',
  LOADING_MORE: '불러오는 중…',
  COUNT_SEPARATOR: ' / ',
  VIEW_ALL: '전체 보기'
});

export const PAGED_LIST_TEST_IDS = Object.freeze({
  LOAD_MORE: 'paged-list-load-more',
  LOAD_MORE_BUTTON: 'paged-list-load-more-button',
  COUNT: 'paged-list-count'
});
