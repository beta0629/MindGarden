/**
 * Operator 돈 기록 — 카테고리·세부 피커 상수 (Clinic-OS)
 *
 * 부모/자식 옵션은 API EXPENSE_/INCOME_ SSOT 만 사용한다.
 * 고정 칩·demoted-under-OTHER 등 display-only 맵 금지.
 *
 * @author CoreSolution
 * @since 2026-08-28
 */

/** @typedef {'INCOME'|'EXPENSE'} FinancialTransactionType */

/** 세부 피커 value 접두사 — BadgeSelect 단일 value로 category/sub 구분 */
export const FM_TX_SUB_PICK_PREFIX = 'sub:';
/** @deprecated demoted-under-OTHER 제거 후 신규 옵션에 사용하지 않음. 파서 하위호환만 유지 */
export const FM_TX_CAT_PICK_PREFIX = 'cat:';

/** 장부 필터·피커 공통 — 「전체」옵션 value */
export const FM_TX_CATEGORY_FILTER_ALL = 'ALL';

/** 장부 필터 「전체」라벨 */
export const FM_TX_CATEGORY_FILTER_ALL_LABEL = '전체';
