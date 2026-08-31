/**
 * Operator 돈 기록 — 카테고리·세부 카테고리 피커 옵션 빌더
 * <p>부모 = API EXPENSE_CATEGORY/INCOME_CATEGORY 전체 활성 행.
 * 자식 = parentCodeValue === selected parent 만. display-only 고정/demote 맵 금지.</p>
 *
 * @author CoreSolution
 * @since 2026-08-28
 */

import {
  FM_TX_SUB_PICK_PREFIX,
  FM_TX_CAT_PICK_PREFIX,
  FM_TX_CATEGORY_FILTER_ALL,
  FM_TX_CATEGORY_FILTER_ALL_LABEL
} from '../constants/financialTransactionCategoryPicker';

/**
 * @param {object|null|undefined} row
 * @returns {string}
 */
const codeValueOf = (row) => String(row?.codeValue ?? '').trim();

/**
 * @param {object|null|undefined} row
 * @returns {string}
 */
const codeLabelOf = (row) => String(row?.codeLabel ?? '').trim();

/**
 * @param {object|null|undefined} row
 * @returns {number}
 */
const sortOrderOf = (row) => {
  const n = Number(row?.sortOrder);
  return Number.isFinite(n) ? n : 0;
};

/**
 * @param {Array<object>} rows
 * @returns {Array<object>}
 */
const activeSortedRows = (rows) => (
  (Array.isArray(rows) ? rows : [])
    .filter((row) => row && row.isActive !== false && codeValueOf(row))
    .slice()
    .sort((a, b) => {
      const byOrder = sortOrderOf(a) - sortOrderOf(b);
      if (byOrder !== 0) {
        return byOrder;
      }
      return codeLabelOf(a).localeCompare(codeLabelOf(b), 'ko');
    })
);

/**
 * OTHER 코드값 여부 (세부 행 표시 판단용 — demote 맵 없음).
 *
 * @param {'INCOME'|'EXPENSE'} _transactionType
 * @param {string} category
 * @returns {boolean}
 */
export const isOtherGroupCategory = (_transactionType, category) => {
  return String(category ?? '').trim() === 'OTHER';
};

/**
 * 1행 칩 highlight value
 *
 * @param {'INCOME'|'EXPENSE'} transactionType
 * @param {string} category
 * @returns {string}
 */
export const resolvePrimaryCategoryHighlight = (transactionType, category) => {
  if (isOtherGroupCategory(transactionType, category)) {
    return 'OTHER';
  }
  return String(category ?? '').trim();
};

/**
 * 부모 카테고리 칩 — API SSOT 전체 (고정 6칩/데모트 금지).
 *
 * @param {'INCOME'|'EXPENSE'} _transactionType
 * @param {Array<object>} apiCategories
 * @returns {Array<{ value: string, label: string }>}
 */
export const buildFixedCategoryOptions = (_transactionType, apiCategories) => (
  activeSortedRows(apiCategories).map((row) => ({
    value: codeValueOf(row),
    label: codeLabelOf(row) || codeValueOf(row)
  }))
);

/**
 * @param {string} category
 * @param {Array<object>} apiSubcategories
 * @returns {Array<{ value: string, label: string }>}
 */
const buildNativeSubcategoryOptions = (category, apiSubcategories) => {
  const options = [];
  const seen = new Set();

  activeSortedRows(apiSubcategories).forEach((row) => {
    if (String(row?.parentCodeValue ?? '').trim() !== category) {
      return;
    }
    const codeValue = codeValueOf(row);
    if (!codeValue || seen.has(codeValue)) {
      return;
    }
    seen.add(codeValue);
    options.push({
      value: `${FM_TX_SUB_PICK_PREFIX}${codeValue}`,
      label: codeLabelOf(row) || codeValue
    });
  });

  return options;
};

/**
 * 세부 옵션 — parentCodeValue === selected parent 만.
 *
 * @param {'INCOME'|'EXPENSE'} _transactionType
 * @param {string} category
 * @param {Array<object>} _apiCategories
 * @param {Array<object>} apiSubcategories
 * @returns {Array<{ value: string, label: string }>}
 */
export const buildSubcategoryPickerOptions = (
  _transactionType,
  category,
  _apiCategories,
  apiSubcategories
) => {
  const trimmedCategory = String(category ?? '').trim();
  if (!trimmedCategory) {
    return [];
  }
  return buildNativeSubcategoryOptions(trimmedCategory, apiSubcategories);
};

/**
 * @param {'INCOME'|'EXPENSE'} _transactionType
 * @param {string} category
 * @param {string} subcategory
 * @returns {string}
 */
export const resolveSubcategoryPickerValue = (_transactionType, category, subcategory) => {
  const subTrim = String(subcategory ?? '').trim();
  if (subTrim) {
    return `${FM_TX_SUB_PICK_PREFIX}${subTrim}`;
  }
  return '';
};

/**
 * @param {string} picked
 * @param {string} currentCategory
 * @returns {{ category?: string, subcategory?: string }}
 */
export const parseSubcategoryPickerValue = (picked, currentCategory) => {
  const raw = String(picked ?? '').trim();
  if (!raw) {
    return { category: currentCategory, subcategory: '' };
  }
  if (raw.startsWith(FM_TX_CAT_PICK_PREFIX)) {
    return {
      category: raw.slice(FM_TX_CAT_PICK_PREFIX.length),
      subcategory: ''
    };
  }
  if (raw.startsWith(FM_TX_SUB_PICK_PREFIX)) {
    return {
      category: currentCategory,
      subcategory: raw.slice(FM_TX_SUB_PICK_PREFIX.length)
    };
  }
  return { category: currentCategory, subcategory: '' };
};

/**
 * @param {'INCOME'|'EXPENSE'} transactionType
 * @param {string} category
 * @param {Array<object>} apiCategories
 * @param {Array<object>} apiSubcategories
 * @returns {boolean}
 */
export const shouldShowSubcategoryRow = (
  transactionType,
  category,
  apiCategories,
  apiSubcategories
) => {
  return buildSubcategoryPickerOptions(
    transactionType,
    category,
    apiCategories,
    apiSubcategories
  ).length > 0;
};

/**
 * 장부 목록 필터 칩 — 「전체」+ 수입/지출 API 부모 카테고리(중복 codeValue 제거).
 *
 * @param {Array<object>} incomeCategories
 * @param {Array<object>} expenseCategories
 * @returns {Array<{ value: string, label: string }>}
 */
export const buildLedgerFilterCategoryOptions = (incomeCategories, expenseCategories) => {
  const options = [{
    value: FM_TX_CATEGORY_FILTER_ALL,
    label: FM_TX_CATEGORY_FILTER_ALL_LABEL
  }];
  const seen = new Set();

  [...activeSortedRows(incomeCategories), ...activeSortedRows(expenseCategories)].forEach((row) => {
    const value = codeValueOf(row);
    if (!value || seen.has(value)) {
      return;
    }
    seen.add(value);
    options.push({
      value,
      label: codeLabelOf(row) || value
    });
  });

  return options;
};
