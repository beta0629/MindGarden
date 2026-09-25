/**
 * 내담자 쇼핑 체크아웃 — 상담 매핑 피커 표시·초기 선택 SSOT
 *
 * @author MindGarden
 * @since 2026-09-19
 */

import { SHOP_CATALOG_CATEGORY } from '../constants/clientShopConstants';

/**
 * @typedef {object} ShopConsultantMappingOption
 * @property {number|string} mappingId
 * @property {number|string} [consultantId]
 * @property {string} [consultantDisplayName]
 * @property {string|null} [label]
 * @property {boolean} [preselected]
 */

/**
 * @param {ReadonlyArray<{ skuCode?: string, title?: string }>|null|undefined} cartLines
 * @param {ReadonlyArray<{ skuCode?: string, catalogCategory?: string }>|null|undefined} catalog
 * @returns {string[]}
 */
export const collectCartConsultationTitles = (cartLines, catalog) => {
  const consultationCodes = new Set(
    (catalog || [])
      .filter((row) => row.catalogCategory === SHOP_CATALOG_CATEGORY.CONSULTATION)
      .map((row) => row.skuCode)
  );
  const titles = [];
  for (const line of cartLines || []) {
    if (!line?.skuCode || !consultationCodes.has(line.skuCode)) {
      continue;
    }
    const title = line.title != null ? String(line.title).trim() : '';
    if (title) {
      titles.push(title);
    }
  }
  return titles;
};

/**
 * @param {ShopConsultantMappingOption|null|undefined} row
 * @returns {string}
 */
export const distinctConsultantKey = (row) => {
  if (!row) {
    return '';
  }
  if (row.consultantId != null && row.consultantId !== '') {
    return String(row.consultantId);
  }
  const name = row.consultantDisplayName != null ? String(row.consultantDisplayName).trim() : '';
  if (name) {
    return `name:${name}`;
  }
  return row.mappingId != null ? `m:${row.mappingId}` : '';
};

/**
 * @param {ReadonlyArray<ShopConsultantMappingOption>|null|undefined} mappings
 * @returns {number}
 */
export const countDistinctConsultants = (mappings) => {
  const list = Array.isArray(mappings) ? mappings : [];
  const keys = new Set();
  for (const row of list) {
    const key = distinctConsultantKey(row);
    if (key) {
      keys.add(key);
    }
  }
  return keys.size;
};

/**
 * @param {ShopConsultantMappingOption} row
 * @param {ReadonlyArray<string>} cartTitles
 * @returns {number}
 */
const packageTitleMatchScore = (row, cartTitles) => {
  const label = row?.label != null ? String(row.label).trim() : '';
  if (!label || !cartTitles?.length) {
    return 0;
  }
  const pkgLower = label.toLowerCase();
  for (const raw of cartTitles) {
    const title = raw != null ? String(raw).trim() : '';
    if (!title) {
      continue;
    }
    if (label.localeCompare(title, undefined, { sensitivity: 'accent' }) === 0) {
      return 3;
    }
    const titleLower = title.toLowerCase();
    if (pkgLower.includes(titleLower) || titleLower.includes(pkgLower)) {
      return 2;
    }
  }
  return 0;
};

/**
 * @param {ReadonlyArray<ShopConsultantMappingOption>} forConsultant
 * @param {ReadonlyArray<string>} [cartTitles]
 * @returns {ShopConsultantMappingOption|null}
 */
export const resolveBestMappingRowForConsultant = (forConsultant, cartTitles = []) => {
  const list = Array.isArray(forConsultant) ? forConsultant.filter(Boolean) : [];
  if (list.length === 0) {
    return null;
  }
  const titles = cartTitles ?? [];
  let best = list[0];
  let bestScore = -1;
  for (const row of list) {
    const score = packageTitleMatchScore(row, titles);
    const preselectedBoost = row.preselected === true ? 1 : 0;
    const combined = score * 10 + preselectedBoost;
    if (combined > bestScore) {
      bestScore = combined;
      best = row;
    } else if (combined === bestScore && best && row.mappingId != null && best.mappingId != null) {
      if (Number(row.mappingId) > Number(best.mappingId)) {
        best = row;
      }
    }
  }
  return best;
};

/**
 * @param {ReadonlyArray<ShopConsultantMappingOption>|null|undefined} mappings
 * @param {ReadonlyArray<string>} [cartTitles]
 * @returns {ReadonlyArray<{ value: string, label: string }>}
 */
export const buildConsultantPickerOptions = (mappings, cartTitles = []) => {
  const list = Array.isArray(mappings) ? mappings : [];
  const byKey = new Map();
  for (const row of list) {
    const key = distinctConsultantKey(row);
    if (!key) {
      continue;
    }
    const bucket = byKey.get(key) ?? [];
    bucket.push(row);
    byKey.set(key, bucket);
  }
  const options = [];
  for (const bucket of byKey.values()) {
    const best = resolveBestMappingRowForConsultant(bucket, cartTitles);
    if (!best || best.mappingId == null) {
      continue;
    }
    options.push({
      value: String(best.mappingId),
      label: best.consultantDisplayName || ''
    });
  }
  return options;
};

/**
 * eligible 목록에서 preselected===true 가 정확히 1건이면 그 옵션, 아니면 null.
 *
 * @param {ReadonlyArray<ShopConsultantMappingOption>|null|undefined} mappings
 * @returns {ShopConsultantMappingOption|null}
 */
export const findUniquePreselectedMapping = (mappings) => {
  const list = Array.isArray(mappings) ? mappings : [];
  const preselected = list.filter((row) => row && row.preselected === true);
  if (preselected.length === 1) {
    return preselected[0];
  }
  return null;
};

/**
 * 초기 selectedMappingId (문자열).
 *
 * @param {ReadonlyArray<ShopConsultantMappingOption>|null|undefined} mappings
 * @param {ReadonlyArray<string>} [cartTitles]
 * @returns {string}
 */
export const resolveInitialMappingId = (mappings, cartTitles = []) => {
  const list = Array.isArray(mappings) ? mappings : [];
  if (list.length === 0) {
    return '';
  }
  const distinct = countDistinctConsultants(list);
  if (distinct === 1) {
    const key = distinctConsultantKey(list[0]);
    const bucket = list.filter((row) => distinctConsultantKey(row) === key);
    const best = resolveBestMappingRowForConsultant(bucket, cartTitles);
    return best && best.mappingId != null ? String(best.mappingId) : '';
  }
  if (distinct >= 2) {
    return '';
  }
  const unique = findUniquePreselectedMapping(list);
  if (unique && unique.mappingId != null) {
    return String(unique.mappingId);
  }
  return '';
};

/**
 * 상담사 선택 피커를 보여줄지 여부 — 서로 다른 상담사가 2명 이상일 때만 true.
 *
 * @param {ReadonlyArray<ShopConsultantMappingOption>|null|undefined} mappings
 * @returns {boolean}
 */
export const shouldShowConsultantMappingPicker = (mappings) =>
  countDistinctConsultants(mappings) >= 2;
