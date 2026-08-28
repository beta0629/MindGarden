/**
 * Operator 돈 기록 — 카테고리·세부 카테고리 피커 옵션 빌더
 *
 * @author CoreSolution
 * @since 2026-08-28
 */

import {
  FM_TX_FIXED_CATEGORY_CODES,
  FM_TX_DEMOTED_UNDER_OTHER,
  FM_TX_FIXED_SUBCATEGORY_CODES,
  FM_TX_CATEGORY_LABEL_OVERRIDE,
  FM_TX_SUB_PICK_PREFIX,
  FM_TX_CAT_PICK_PREFIX
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
 * @param {Array<object>} rows
 * @returns {Map<string, object>}
 */
const indexByCodeValue = (rows) => {
  const map = new Map();
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const value = codeValueOf(row);
    if (value) {
      map.set(value, row);
    }
  });
  return map;
};

/**
 * @param {string} codeValue
 * @param {Map<string, object>} categoryByValue
 * @returns {string}
 */
const resolveCategoryLabel = (codeValue, categoryByValue) => {
  const override = FM_TX_CATEGORY_LABEL_OVERRIDE[codeValue];
  if (override) {
    return override;
  }
  const fromApi = categoryByValue.get(codeValue);
  const apiLabel = codeLabelOf(fromApi);
  if (apiLabel) {
    return apiLabel;
  }
  return codeValue;
};

/**
 * @param {'INCOME'|'EXPENSE'} transactionType
 * @param {string} category
 * @returns {boolean}
 */
export const isOtherGroupCategory = (transactionType, category) => {
  const trimmed = String(category ?? '').trim();
  if (!trimmed) {
    return false;
  }
  if (trimmed === 'OTHER') {
    return true;
  }
  const demoted = FM_TX_DEMOTED_UNDER_OTHER[transactionType] || [];
  return demoted.includes(trimmed);
};

/**
 * 1행 고정 칩 highlight value (기타 그룹이면 OTHER)
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
 * @param {'INCOME'|'EXPENSE'} transactionType
 * @param {Array<object>} apiCategories
 * @returns {Array<{ value: string, label: string }>}
 */
export const buildFixedCategoryOptions = (transactionType, apiCategories) => {
  const fixedCodes = FM_TX_FIXED_CATEGORY_CODES[transactionType] || [];
  const categoryByValue = indexByCodeValue(apiCategories);

  const options = [];
  fixedCodes.forEach((codeValue) => {
    if (!categoryByValue.has(codeValue)) {
      return;
    }
    options.push({
      value: codeValue,
      label: resolveCategoryLabel(codeValue, categoryByValue)
    });
  });
  return options;
};

/**
 * @param {string} category
 * @param {Array<object>} apiSubcategories
 * @param {Map<string, object>} subcategoryByValue
 * @returns {Array<{ value: string, label: string }>}
 */
const buildNativeSubcategoryOptions = (category, apiSubcategories, subcategoryByValue) => {
  const configured = FM_TX_FIXED_SUBCATEGORY_CODES[category];
  const options = [];
  const seen = new Set();

  if (Array.isArray(configured)) {
    configured.forEach((codeValue) => {
      const row = subcategoryByValue.get(codeValue);
      if (!row) {
        return;
      }
      seen.add(codeValue);
      options.push({
        value: `${FM_TX_SUB_PICK_PREFIX}${codeValue}`,
        label: codeLabelOf(row) || codeValue
      });
    });
  }

  (Array.isArray(apiSubcategories) ? apiSubcategories : []).forEach((row) => {
    if (row?.parentCodeValue !== category) {
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
 * @param {'INCOME'|'EXPENSE'} transactionType
 * @param {string} category
 * @param {Array<object>} apiCategories
 * @param {Array<object>} apiSubcategories
 * @returns {Array<{ value: string, label: string }>}
 */
export const buildSubcategoryPickerOptions = (
  transactionType,
  category,
  apiCategories,
  apiSubcategories
) => {
  const trimmedCategory = String(category ?? '').trim();
  if (!trimmedCategory) {
    return [];
  }

  const categoryByValue = indexByCodeValue(apiCategories);
  const subcategoryByValue = indexByCodeValue(apiSubcategories);

  if (isOtherGroupCategory(transactionType, trimmedCategory)) {
    const options = [];
    const demoted = FM_TX_DEMOTED_UNDER_OTHER[transactionType] || [];
    demoted.forEach((codeValue) => {
      const row = categoryByValue.get(codeValue);
      if (!row) {
        return;
      }
      options.push({
        value: `${FM_TX_CAT_PICK_PREFIX}${codeValue}`,
        label: codeLabelOf(row) || codeValue
      });
    });
    buildNativeSubcategoryOptions('OTHER', apiSubcategories, subcategoryByValue).forEach((opt) => {
      options.push(opt);
    });
    return options;
  }

  return buildNativeSubcategoryOptions(trimmedCategory, apiSubcategories, subcategoryByValue);
};

/**
 * @param {'INCOME'|'EXPENSE'} transactionType
 * @param {string} category
 * @param {string} subcategory
 * @returns {string}
 */
export const resolveSubcategoryPickerValue = (transactionType, category, subcategory) => {
  const subTrim = String(subcategory ?? '').trim();
  if (subTrim) {
    return `${FM_TX_SUB_PICK_PREFIX}${subTrim}`;
  }
  const catTrim = String(category ?? '').trim();
  const demoted = FM_TX_DEMOTED_UNDER_OTHER[transactionType] || [];
  if (demoted.includes(catTrim)) {
    return `${FM_TX_CAT_PICK_PREFIX}${catTrim}`;
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
