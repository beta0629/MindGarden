/**
 * 어드민 대시보드 시각화 — 목표 건수 localStorage 유틸
 *
 * 키: `mg.dashboard.vizTarget.v1:{tenantId}:{userId}`
 * 값: `{ mode: 'preset'|'ratio'|'custom', targetCompleted: number, updatedAt: ISOString }`
 *
 * tenantId·userId 없으면 저장/조회 no-op (anonymous 충돌 방지·테넌트 격리).
 * 범위 해석은 `resolveViewModeStorageScope` SSOT를 재사용한다.
 * UX는 preset/custom 중심. ratio 모드는 구 저장값 읽기 호환만 유지.
 *
 * @author CoreSolution
 * @since 2026-07-28
 */

import {
  DASHBOARD_VIZ_TARGET_COMPLETED,
  DASHBOARD_VIZ_TARGET_MAX_COMPLETED,
  DASHBOARD_VIZ_TARGET_MIN_COMPLETED,
  DASHBOARD_VIZ_TARGET_MODES
} from '../../../constants/charts';
import { resolveViewModeStorageScope } from '../../../hooks/useViewModePreference';
import { toSafeNumber } from '../../../utils/safeDisplay';

const STORAGE_KEY_PREFIX = 'mg.dashboard.vizTarget';
const STORAGE_VERSION = 1;

const ALLOWED_MODES = Object.freeze([
  DASHBOARD_VIZ_TARGET_MODES.PRESET,
  DASHBOARD_VIZ_TARGET_MODES.RATIO,
  DASHBOARD_VIZ_TARGET_MODES.CUSTOM
]);

/**
 * @param {unknown} value
 * @returns {string|null}
 */
function normalizeScopePart(value) {
  if (value == null) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed || null;
}

/**
 * tenantId·userId가 모두 있을 때만 영속화 가능.
 *
 * @param {{ tenantId?: string|null, userId?: string|number|null }} [scope]
 * @returns {boolean}
 */
export function canPersistVizTarget(scope) {
  const tenantId = normalizeScopePart(scope?.tenantId);
  const userId = normalizeScopePart(scope?.userId);
  return Boolean(tenantId && userId);
}

/**
 * localStorage 키 생성. 스코프 불완전 시 null (anonymous 키 생성 금지).
 *
 * @param {{ tenantId?: string|null, userId?: string|number|null }} scope
 * @returns {string|null}
 */
export function buildVizTargetStorageKey(scope) {
  const tenantId = normalizeScopePart(scope?.tenantId);
  const userId = normalizeScopePart(scope?.userId);
  if (!tenantId || !userId) {
    return null;
  }
  return `${STORAGE_KEY_PREFIX}.v${STORAGE_VERSION}:${tenantId}:${userId}`;
}

/**
 * @param {unknown} mode
 * @returns {string|null}
 */
function resolveMode(mode) {
  if (typeof mode !== 'string') {
    return null;
  }
  const trimmed = mode.trim();
  return ALLOWED_MODES.includes(trimmed) ? trimmed : null;
}

/**
 * @param {unknown} raw
 * @returns {{ mode: string, targetCompleted: number, updatedAt: string }|null}
 */
function parseStoredPreference(raw) {
  if (raw == null || raw === '') {
    return null;
  }
  let parsed;
  try {
    parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null;
  }
  const mode = resolveMode(parsed.mode);
  const targetCompleted = toSafeNumber(parsed.targetCompleted, 0);
  if (
    !mode
    || !Number.isFinite(targetCompleted)
    || targetCompleted < DASHBOARD_VIZ_TARGET_MIN_COMPLETED
    || targetCompleted > DASHBOARD_VIZ_TARGET_MAX_COMPLETED
  ) {
    return null;
  }
  const updatedAt = typeof parsed.updatedAt === 'string' && parsed.updatedAt.trim()
    ? parsed.updatedAt.trim()
    : null;
  if (!updatedAt) {
    return null;
  }
  return {
    mode,
    targetCompleted: Math.round(targetCompleted),
    updatedAt
  };
}

/**
 * @param {{ tenantId?: string|null, userId?: string|number|null }} [scope]
 * @returns {{ mode: string, targetCompleted: number, updatedAt: string }|null}
 */
export function readVizTargetPreference(scope) {
  const resolvedScope = scope || resolveViewModeStorageScope();
  const storageKey = buildVizTargetStorageKey(resolvedScope);
  if (!storageKey || typeof window === 'undefined') {
    return null;
  }
  try {
    return parseStoredPreference(window.localStorage.getItem(storageKey));
  } catch {
    return null;
  }
}

/**
 * @param {{ tenantId?: string|null, userId?: string|number|null }} scope
 * @param {{ mode: string, targetCompleted: number, updatedAt?: string }} preference
 * @returns {boolean} 저장 성공 여부
 */
export function writeVizTargetPreference(scope, preference) {
  const resolvedScope = scope || resolveViewModeStorageScope();
  if (!canPersistVizTarget(resolvedScope)) {
    return false;
  }
  const storageKey = buildVizTargetStorageKey(resolvedScope);
  const mode = resolveMode(preference?.mode);
  const targetCompleted = toSafeNumber(preference?.targetCompleted, 0);
  if (
    !storageKey
    || !mode
    || targetCompleted < DASHBOARD_VIZ_TARGET_MIN_COMPLETED
    || targetCompleted > DASHBOARD_VIZ_TARGET_MAX_COMPLETED
  ) {
    return false;
  }
  if (typeof window === 'undefined') {
    return false;
  }
  const payload = {
    mode,
    targetCompleted: Math.round(targetCompleted),
    updatedAt: typeof preference?.updatedAt === 'string' && preference.updatedAt.trim()
      ? preference.updatedAt.trim()
      : new Date().toISOString()
  };
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

/**
 * 저장된 목표 또는 기본 폴백.
 *
 * @param {{ tenantId?: string|null, userId?: string|number|null }} [scope]
 * @returns {number}
 */
export function resolveVizTargetCompleted(scope) {
  const preference = readVizTargetPreference(scope);
  if (preference) {
    return preference.targetCompleted;
  }
  return DASHBOARD_VIZ_TARGET_COMPLETED;
}

/**
 * 기준값 × 배수 목표 계산 (빠른 가산·구 ratio 호환).
 *
 * @param {number|null|undefined} baseValue
 * @param {number} multiplier
 * @returns {number|null} baseValue &lt;= 0 이거나 결과 범위 밖이면 null
 */
export function calcQuickAddTarget(baseValue, multiplier) {
  const base = toSafeNumber(baseValue, 0);
  const factor = Number(multiplier);
  if (base <= 0 || !Number.isFinite(factor) || factor <= 0) {
    return null;
  }
  const next = Math.round(base * factor);
  if (next < DASHBOARD_VIZ_TARGET_MIN_COMPLETED || next > DASHBOARD_VIZ_TARGET_MAX_COMPLETED) {
    return null;
  }
  return next;
}

/**
 * @deprecated calcQuickAddTarget 사용. 구 테스트·호출 호환용 별칭.
 * @param {number|null|undefined} previousCompleted
 * @param {number} multiplier
 * @returns {number|null}
 */
export function calcRatioTargetCompleted(previousCompleted, multiplier) {
  return calcQuickAddTarget(previousCompleted, multiplier);
}

/**
 * 직접 입력 문자열 → 양의 정수(1~99999). 유효하지 않으면 null.
 *
 * @param {unknown} raw
 * @returns {number|null}
 */
export function parseVizTargetCustomInput(raw) {
  if (raw == null) {
    return null;
  }
  const trimmed = String(raw).trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) {
    return null;
  }
  const value = Number(trimmed);
  if (
    !Number.isFinite(value)
    || value < DASHBOARD_VIZ_TARGET_MIN_COMPLETED
    || value > DASHBOARD_VIZ_TARGET_MAX_COMPLETED
  ) {
    return null;
  }
  return Math.round(value);
}
