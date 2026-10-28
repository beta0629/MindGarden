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

/** 내담자 알림·메시지 목록 page size (r2 스펙) */
export const CLIENT_NOTIFICATION_LIST_PAGE_SIZE = 6;

/** 내담자 결제 내역 UI 한 페이지 행 수 (MGPagination · in-memory) */
export const CLIENT_PAYMENT_HISTORY_PAGE_SIZE = 10;

/** 온라인 주문 목록 서버 page size 상한(백엔드 listMyOrders 최대 50) */
export const CLIENT_PAYMENT_SHOP_ORDERS_FETCH_SIZE = 50;

/** 온라인 주문 끝까지 읽기 안전 상한 (무한 루프 방지) */
export const CLIENT_PAYMENT_SHOP_ORDERS_MAX_PAGES = 20;

/** usePagedList — 더 보기(append) / 페이지 교체(replace) */
export const PAGED_LIST_MODE = Object.freeze({
  APPEND: 'append',
  REPLACE: 'replace'
});

/** 무한 스크롤: 목록 끝에서 이 거리(px) 안에 들어오면 다음 페이지를 부른다 */
export const INFINITE_SCROLL_END_THRESHOLD_PX = 24;

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
