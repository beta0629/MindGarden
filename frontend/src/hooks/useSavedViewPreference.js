import { useCallback, useEffect, useMemo, useState } from 'react';
import { resolveViewModeStorageScope } from './useViewModePreference';

const SAVED_VIEW_STORAGE_KEY_PREFIX = 'mg.savedView';
const SAVED_VIEW_STORAGE_VERSION = 1;

const DEFAULT_SAVED_VIEW = {
  viewMode: 'list',
  filters: {},
  sort: {},
  density: 'comfortable'
};

const normalizeScopePart = (value, fallback) => {
  if (value == null) {
    return fallback;
  }
  const trimmed = String(value).trim();
  return trimmed || fallback;
};

/**
 * session/tenant 컨텍스트에서 saved view 저장 범위를 조회한다.
 * `resolveViewModeStorageScope`와 동일한 SSOT를 재사용한다.
 *
 * @returns {{ tenantId: string|null, userId: string|null }}
 * @author CoreSolution
 * @since 2026-07-06
 */
export function resolveSavedViewStorageScope() {
  return resolveViewModeStorageScope();
}

/**
 * saved view localStorage 키를 생성한다.
 *
 * 키 형식: `mg.savedView.v{version}:{tenantId}:{userId}:{pageId}`
 *
 * @param {{ tenantId?: string|null, userId?: string|number|null }} scope - 테넌트·사용자 범위
 * @param {string} pageId - 화면 식별자
 * @returns {string}
 * @author CoreSolution
 * @since 2026-07-06
 */
export function buildSavedViewStorageKey(scope, pageId) {
  const pagePart = normalizeScopePart(pageId, '');
  if (!pagePart) {
    throw new Error('buildSavedViewStorageKey: pageId is required');
  }

  const tenantPart = normalizeScopePart(scope?.tenantId, 'anonymous');
  const userPart = normalizeScopePart(scope?.userId, 'anonymous');

  return `${SAVED_VIEW_STORAGE_KEY_PREFIX}.v${SAVED_VIEW_STORAGE_VERSION}:${tenantPart}:${userPart}:${pagePart}`;
}

const mergeSavedView = (stored, defaultView) => ({
  viewMode: stored?.viewMode ?? defaultView?.viewMode ?? DEFAULT_SAVED_VIEW.viewMode,
  filters: stored?.filters ?? defaultView?.filters ?? DEFAULT_SAVED_VIEW.filters,
  sort: stored?.sort ?? defaultView?.sort ?? DEFAULT_SAVED_VIEW.sort,
  density: stored?.density ?? defaultView?.density ?? DEFAULT_SAVED_VIEW.density
});

const readStoredSavedView = (storageKey, defaultView) => {
  if (typeof window === 'undefined' || !storageKey) {
    return mergeSavedView(null, defaultView);
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw == null) {
      return mergeSavedView(null, defaultView);
    }
    const parsed = JSON.parse(raw);
    return mergeSavedView(parsed, defaultView);
  } catch {
    return mergeSavedView(null, defaultView);
  }
};

const writeStoredSavedView = (storageKey, savedView) => {
  if (typeof window === 'undefined' || !storageKey) {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(savedView));
  } catch {
    // quota exceeded 등 — UI 상태만 유지
  }
};

const clearStoredSavedView = (storageKey) => {
  if (typeof window === 'undefined' || !storageKey) {
    return;
  }

  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    // ignore
  }
};

/**
 * 필터·정렬·viewMode 조합을 localStorage에 영속화하는 stub hook.
 * tenantId 없으면 read/write/clear no-op.
 *
 * @param {object} params
 * @param {string} params.pageId - 화면 식별자
 * @param {object} [params.defaultView] - 저장값 없음·필드 누락 시 병합 기본값
 * @returns {{ savedView: object, setSavedView: (next: object) => void, clearSavedView: () => void }}
 * @author CoreSolution
 * @since 2026-07-06
 */
export function useSavedViewPreference({ pageId, defaultView }) {
  const scope = resolveSavedViewStorageScope();
  const storageKey = useMemo(() => {
    if (!scope.tenantId) {
      return null;
    }
    return buildSavedViewStorageKey(scope, pageId);
  }, [scope.tenantId, scope.userId, pageId]);

  const mergedDefault = useMemo(
    () => mergeSavedView(null, defaultView),
    [defaultView]
  );

  const [savedView, setSavedViewState] = useState(() =>
    readStoredSavedView(storageKey, defaultView)
  );

  useEffect(() => {
    setSavedViewState(readStoredSavedView(storageKey, defaultView));
  }, [storageKey, defaultView]);

  const setSavedView = useCallback((next) => {
    const merged = mergeSavedView(next, defaultView);
    setSavedViewState(merged);
    writeStoredSavedView(storageKey, merged);
  }, [storageKey, defaultView]);

  const clearSavedView = useCallback(() => {
    setSavedViewState(mergedDefault);
    clearStoredSavedView(storageKey);
  }, [storageKey, mergedDefault]);

  return { savedView, setSavedView, clearSavedView };
}
