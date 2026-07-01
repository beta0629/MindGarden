/**
 * 통합일정 사이드바 카드 밀도 — SSOT 상수·localStorage 키
 *
 * @author CoreSolution
 * @since 2026-07-01
 */

export const SCHEDULE_DENSITY_COMFORTABLE = 'comfortable';
export const SCHEDULE_DENSITY_COMPACT = 'compact';
export const SCHEDULE_DENSITY_DEFAULT = SCHEDULE_DENSITY_COMFORTABLE;

export const SCHEDULE_DENSITY_STORAGE_KEY_PREFIX = 'mg.integratedSchedule.density';

export const SCHEDULE_DENSITY_OPTIONS = [
  { value: SCHEDULE_DENSITY_COMFORTABLE, label: '표준' },
  { value: SCHEDULE_DENSITY_COMPACT, label: '촘촘' }
];

const VALID_DENSITY_VALUES = new Set([
  SCHEDULE_DENSITY_COMFORTABLE,
  SCHEDULE_DENSITY_COMPACT
]);

/**
 * 테넌트별 localStorage 키 (tenantId 없으면 default suffix)
 *
 * @param {string|number|null|undefined} tenantId
 * @returns {string}
 */
export const buildScheduleDensityStorageKey = (tenantId) => {
  const suffix = tenantId != null && String(tenantId) !== '' ? String(tenantId) : 'default';
  return `${SCHEDULE_DENSITY_STORAGE_KEY_PREFIX}.${suffix}`;
};

/**
 * @param {string} key
 * @returns {string|null}
 */
export const readStoredScheduleDensity = (key) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    return VALID_DENSITY_VALUES.has(raw) ? raw : null;
  } catch (e) {
    return null;
  }
};

/**
 * @param {string} key
 * @param {string} value
 */
export const writeStoredScheduleDensity = (key, value) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  if (!VALID_DENSITY_VALUES.has(value)) {
    return;
  }
  try {
    window.localStorage.setItem(key, value);
  } catch (e) {
    // Storage 비활성/quota 초과여도 UI 동작 유지
  }
};
