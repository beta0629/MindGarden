/**
 * 내담자 쇼핑 체크아웃 — 상담 매핑 피커 표시·초기 선택 SSOT
 *
 * @author MindGarden
 * @since 2026-09-19
 */

/**
 * @typedef {object} ShopConsultantMappingOption
 * @property {number|string} mappingId
 * @property {string} [consultantDisplayName]
 * @property {string|null} [label]
 * @property {boolean} [preselected]
 */

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
 * 초기 selectedMappingId (문자열). 0건 → ''; 1건 → 그 id; unique preselected → 그 id; 그 외 → ''.
 *
 * @param {ReadonlyArray<ShopConsultantMappingOption>|null|undefined} mappings
 * @returns {string}
 */
export const resolveInitialMappingId = (mappings) => {
  const list = Array.isArray(mappings) ? mappings : [];
  if (list.length === 0) {
    return '';
  }
  if (list.length === 1) {
    const only = list[0];
    return only && only.mappingId != null ? String(only.mappingId) : '';
  }
  const unique = findUniquePreselectedMapping(list);
  if (unique && unique.mappingId != null) {
    return String(unique.mappingId);
  }
  return '';
};

/**
 * 상담사 선택 피커를 보여줄지 여부.
 * length&lt;2 → false; length≥2 이고 unique preselected 있으면 false; 그 외 true.
 *
 * @param {ReadonlyArray<ShopConsultantMappingOption>|null|undefined} mappings
 * @returns {boolean}
 */
export const shouldShowConsultantMappingPicker = (mappings) => {
  const list = Array.isArray(mappings) ? mappings : [];
  if (list.length < 2) {
    return false;
  }
  return findUniquePreselectedMapping(list) == null;
};
