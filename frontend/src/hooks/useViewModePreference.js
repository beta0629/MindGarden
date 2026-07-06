import { useCallback, useEffect, useState } from 'react';

const VIEW_MODE_STORAGE_KEY_PREFIX = 'mg.viewMode';
const VIEW_MODE_STORAGE_VERSION = 1;

const normalizeScopePart = (value, fallback) => {
  if (value == null) {
    return fallback;
  }
  const trimmed = String(value).trim();
  return trimmed || fallback;
};

/**
 * session/tenant 컨텍스트에서 viewMode 저장 범위를 조회한다.
 * SSR 및 sessionManager 미존재 시 null 필드를 반환한다.
 *
 * @returns {{ tenantId: string|null, userId: string|null }}
 * @author CoreSolution
 * @since 2026-07-06
 */
export function resolveViewModeStorageScope() {
  if (typeof window === 'undefined') {
    return { tenantId: null, userId: null };
  }

  const sessionManager = window.sessionManager;
  if (!sessionManager?.getUser) {
    return { tenantId: null, userId: null };
  }

  const user = sessionManager.getUser();
  const tenantId = user?.tenantId != null ? String(user.tenantId).trim() : null;
  const userId = user?.id != null ? String(user.id).trim() : null;

  return {
    tenantId: tenantId || null,
    userId: userId || null
  };
}

/**
 * viewMode localStorage 키를 생성한다.
 *
 * 키 형식: `mg.viewMode.v{version}:{tenantId}:{userId}:{pageId}`
 * - tenantId·userId가 없으면 `anonymous`로 대체한다.
 * - pageId는 화면별 고유 식별자(예: `admin.user-management.client`).
 *
 * @param {{ tenantId?: string|null, userId?: string|number|null }} scope - 테넌트·사용자 범위
 * @param {string} pageId - 화면 식별자
 * @returns {string}
 * @author CoreSolution
 * @since 2026-07-06
 */
export function buildViewModeStorageKey(scope, pageId) {
  const pagePart = normalizeScopePart(pageId, '');
  if (!pagePart) {
    throw new Error('buildViewModeStorageKey: pageId is required');
  }

  const tenantPart = normalizeScopePart(scope?.tenantId, 'anonymous');
  const userPart = normalizeScopePart(scope?.userId, 'anonymous');

  return `${VIEW_MODE_STORAGE_KEY_PREFIX}.v${VIEW_MODE_STORAGE_VERSION}:${tenantPart}:${userPart}:${pagePart}`;
}

const resolveViewMode = (mode, allowedModes, defaultMode) => {
  if (typeof mode !== 'string') {
    return defaultMode;
  }

  const trimmed = mode.trim();
  if (!trimmed) {
    return defaultMode;
  }

  if (Array.isArray(allowedModes) && allowedModes.length > 0) {
    return allowedModes.includes(trimmed) ? trimmed : defaultMode;
  }

  return trimmed;
};

const readStoredViewMode = (storageKey, defaultMode, allowedModes) => {
  if (typeof window === 'undefined' || !storageKey) {
    return defaultMode;
  }

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored == null) {
      return defaultMode;
    }
    return resolveViewMode(stored, allowedModes, defaultMode);
  } catch {
    return defaultMode;
  }
};

const writeStoredViewMode = (storageKey, mode) => {
  if (typeof window === 'undefined' || !storageKey) {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, mode);
  } catch {
    // quota exceeded 등 — UI 상태만 유지
  }
};

/**
 * viewMode를 localStorage에 영속화하는 공통 hook.
 *
 * @param {object} params
 * @param {string} params.storageKey - `buildViewModeStorageKey`로 생성한 키
 * @param {string} params.defaultMode - 허용 목록 밖·저장값 없음 시 폴백
 * @param {string[]} [params.allowedModes] - 허용 viewMode 목록(없으면 저장 문자열 그대로 허용)
 * @returns {{ viewMode: string, setViewMode: (mode: string) => void }}
 * @author CoreSolution
 * @since 2026-07-06
 */
export function useViewModePreference({ storageKey, defaultMode, allowedModes }) {
  const allowedModesKey = Array.isArray(allowedModes) ? allowedModes.join('|') : '';

  const [viewMode, setViewModeState] = useState(() =>
    readStoredViewMode(storageKey, defaultMode, allowedModes)
  );

  useEffect(() => {
    setViewModeState(readStoredViewMode(storageKey, defaultMode, allowedModes));
  }, [storageKey, defaultMode, allowedModesKey]);

  const setViewMode = useCallback((nextMode) => {
    const resolved = resolveViewMode(nextMode, allowedModes, defaultMode);
    setViewModeState(resolved);
    writeStoredViewMode(storageKey, resolved);
  }, [storageKey, defaultMode, allowedModesKey]);

  return { viewMode, setViewMode };
}
