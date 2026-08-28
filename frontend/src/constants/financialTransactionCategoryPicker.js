/**
 * Operator 돈 기록 — 고정 카테고리·세부 카테고리 피커 SSOT (Clinic-OS)
 *
 * API 공통코드(codeValue)와 정렬·라벨·기타 그룹만 프론트에서 정의한다.
 * 세부 항목 추가는 FIXED_SUBCATEGORY_CODES / *_DEMOTED_UNDER_OTHER 만 확장하면 된다.
 *
 * @author CoreSolution
 * @since 2026-08-28
 */

/** @typedef {'INCOME'|'EXPENSE'} FinancialTransactionType */

/** 유형 선택 후 1행에 항상 노출할 codeValue (API 존재 시만 칩 렌더) */
export const FM_TX_FIXED_CATEGORY_CODES = {
  INCOME: ['CONSULTATION', 'OTHER'],
  EXPENSE: ['RENT', 'SALARY', 'UTILITY', 'TAX', 'MEAL', 'OTHER']
};

/** 1행 고정 칩에 두지 않고, 기타(OTHER) 세부 행에서만 노출할 codeValue */
export const FM_TX_DEMOTED_UNDER_OTHER = {
  INCOME: ['PACKAGE'],
  EXPENSE: ['OFFICE_SUPPLIES', 'MARKETING', 'EQUIPMENT', 'SOFTWARE', 'CONSULTING']
};

/**
 * 고정 카테고리별 세부 codeValue 화이트리스트 (API parent와 무관하게 허용).
 * 비어 있거나 키 없음 → API parentCodeValue 일치 항목만 사용.
 */
export const FM_TX_FIXED_SUBCATEGORY_CODES = {
  RENT: ['OFFICE_RENT']
};

/** Clinic-OS 표시 라벨 (API codeLabel 대체) */
export const FM_TX_CATEGORY_LABEL_OVERRIDE = {
  OTHER: '기타'
};

/** 세부 피커 value 접두사 — BadgeSelect 단일 value로 category/sub 구분 */
export const FM_TX_SUB_PICK_PREFIX = 'sub:';
export const FM_TX_CAT_PICK_PREFIX = 'cat:';
