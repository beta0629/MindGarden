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

const DEFAULT_NAMED_VIEW_ID = 'default';
const DEFAULT_NAMED_VIEW_LABEL = '기본값';

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

const isLegacyFlatSavedView = (parsed) =>
  parsed != null
  && typeof parsed === 'object'
  && !Array.isArray(parsed)
  && 'viewMode' in parsed
  && !('views' in parsed);

const isNamedViewCollection = (parsed) =>
  parsed != null
  && typeof parsed === 'object'
  && Array.isArray(parsed.views);

const buildDefaultNamedViewCollection = (defaultView) => {
  const payload = mergeSavedView(null, defaultView);
  return {
    activeViewId: DEFAULT_NAMED_VIEW_ID,
    views: [{
      id: DEFAULT_NAMED_VIEW_ID,
      label: DEFAULT_NAMED_VIEW_LABEL,
      payload,
      updatedAt: new Date().toISOString(),
      isReadonly: true
    }]
  };
};

const migrateLegacyToNamedCollection = (legacy, defaultView) => {
  const collection = buildDefaultNamedViewCollection(defaultView);
  collection.views[0].payload = mergeSavedView(legacy, defaultView);
  collection.views[0].updatedAt = new Date().toISOString();
  return collection;
};

const normalizeNamedViewCollection = (parsed, defaultView) => {
  if (isNamedViewCollection(parsed) && parsed.views.length > 0) {
    const activeViewId = parsed.activeViewId ?? DEFAULT_NAMED_VIEW_ID;
    const hasActive = parsed.views.some((view) => view.id === activeViewId);
    return {
      activeViewId: hasActive ? activeViewId : DEFAULT_NAMED_VIEW_ID,
      views: parsed.views.map((view) => ({
        id: view.id,
        label: view.label,
        payload: mergeSavedView(view.payload, defaultView),
        updatedAt: view.updatedAt ?? new Date().toISOString(),
        ...(view.isReadonly ? { isReadonly: true } : {})
      }))
    };
  }

  if (isLegacyFlatSavedView(parsed)) {
    return migrateLegacyToNamedCollection(parsed, defaultView);
  }

  return buildDefaultNamedViewCollection(defaultView);
};

const getActiveNamedViewPayload = (collection, defaultView) => {
  const activeView = collection.views.find((view) => view.id === collection.activeViewId);
  return mergeSavedView(activeView?.payload, defaultView);
};

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
    if (isNamedViewCollection(parsed)) {
      return getActiveNamedViewPayload(normalizeNamedViewCollection(parsed, defaultView), defaultView);
    }
    return mergeSavedView(parsed, defaultView);
  } catch {
    return mergeSavedView(null, defaultView);
  }
};

const readStoredNamedViewCollection = (storageKey, defaultView) => {
  if (typeof window === 'undefined' || !storageKey) {
    return buildDefaultNamedViewCollection(defaultView);
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw == null) {
      return buildDefaultNamedViewCollection(defaultView);
    }
    const parsed = JSON.parse(raw);
    return normalizeNamedViewCollection(parsed, defaultView);
  } catch {
    return buildDefaultNamedViewCollection(defaultView);
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

const buildNamedViewId = () => `view_${Date.now()}`;

/**
 * 필터·정렬·viewMode 조합을 localStorage에 영속화하는 stub hook.
 * tenantId 없으면 read/write/clear no-op.
 *
 * @param {object} params
 * @param {string} params.pageId - 화면 식별자
 * @param {object} [params.defaultView] - 저장값 없음·필드 누락 시 병합 기본값
 * @param {boolean} [params.namedViews=false] - named views 배열 스키마(v1) 사용 여부
 * @returns {object} savedView API (+ namedViews 모드 시 views·loadNamedView 등)
 * @author CoreSolution
 * @since 2026-07-06
 */
export function useSavedViewPreference({ pageId, defaultView, namedViews = false }) {
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
    namedViews
      ? getActiveNamedViewPayload(readStoredNamedViewCollection(storageKey, defaultView), defaultView)
      : readStoredSavedView(storageKey, defaultView)
  );

  const [namedViewCollection, setNamedViewCollection] = useState(() =>
    namedViews ? readStoredNamedViewCollection(storageKey, defaultView) : null
  );

  useEffect(() => {
    if (namedViews) {
      const collection = readStoredNamedViewCollection(storageKey, defaultView);
      setNamedViewCollection(collection);
      setSavedViewState(getActiveNamedViewPayload(collection, defaultView));
      return;
    }
    setSavedViewState(readStoredSavedView(storageKey, defaultView));
  }, [storageKey, defaultView, namedViews]);

  const persistNamedCollection = useCallback((collection) => {
    setNamedViewCollection(collection);
    setSavedViewState(getActiveNamedViewPayload(collection, defaultView));
    writeStoredSavedView(storageKey, collection);
  }, [storageKey, defaultView]);

  const setSavedView = useCallback((next) => {
    if (namedViews) {
      const merged = mergeSavedView(next, defaultView);
      setNamedViewCollection((prev) => {
        const base = prev ?? buildDefaultNamedViewCollection(defaultView);
        const activeViewId = base.activeViewId ?? DEFAULT_NAMED_VIEW_ID;
        const nextCollection = {
          ...base,
          views: base.views.map((view) => (
            view.id === activeViewId
              ? { ...view, payload: merged, updatedAt: new Date().toISOString() }
              : view
          ))
        };
        setSavedViewState(merged);
        writeStoredSavedView(storageKey, nextCollection);
        return nextCollection;
      });
      return;
    }

    const merged = mergeSavedView(next, defaultView);
    setSavedViewState(merged);
    writeStoredSavedView(storageKey, merged);
  }, [storageKey, defaultView, namedViews]);

  const clearSavedView = useCallback(() => {
    if (namedViews) {
      const nextCollection = buildDefaultNamedViewCollection(defaultView);
      persistNamedCollection(nextCollection);
      return;
    }

    setSavedViewState(mergedDefault);
    clearStoredSavedView(storageKey);
  }, [storageKey, mergedDefault, namedViews, defaultView, persistNamedCollection]);

  const saveNamedView = useCallback((label, payload) => {
    if (!namedViews) {
      return null;
    }

    const trimmedLabel = String(label ?? '').trim();
    if (!trimmedLabel) {
      return null;
    }

    const mergedPayload = mergeSavedView(payload, defaultView);
    const newView = {
      id: buildNamedViewId(),
      label: trimmedLabel,
      payload: mergedPayload,
      updatedAt: new Date().toISOString()
    };

    let createdId = newView.id;
    setNamedViewCollection((prev) => {
      const base = prev ?? buildDefaultNamedViewCollection(defaultView);
      const nextCollection = {
        activeViewId: newView.id,
        views: [...base.views, newView]
      };
      createdId = newView.id;
      setSavedViewState(mergedPayload);
      writeStoredSavedView(storageKey, nextCollection);
      return nextCollection;
    });

    return createdId;
  }, [namedViews, defaultView, storageKey]);

  const loadNamedView = useCallback((viewId) => {
    if (!namedViews) {
      return mergedDefault;
    }

    const collection = namedViewCollection ?? buildDefaultNamedViewCollection(defaultView);
    const target = collection.views.find((view) => view.id === viewId);
    if (!target) {
      return getActiveNamedViewPayload(collection, defaultView);
    }

    const nextCollection = { ...collection, activeViewId: viewId };
    const payload = mergeSavedView(target.payload, defaultView);
    persistNamedCollection(nextCollection);
    return payload;
  }, [namedViews, namedViewCollection, defaultView, mergedDefault, persistNamedCollection]);

  const resetToDefaultView = useCallback(() => {
    if (!namedViews) {
      setSavedViewState(mergedDefault);
      clearStoredSavedView(storageKey);
      return mergedDefault;
    }

    const collection = namedViewCollection ?? buildDefaultNamedViewCollection(defaultView);
    const nextCollection = {
      ...collection,
      activeViewId: DEFAULT_NAMED_VIEW_ID,
      views: collection.views.map((view) => (
        view.id === DEFAULT_NAMED_VIEW_ID
          ? {
            ...view,
            payload: mergedDefault,
            updatedAt: new Date().toISOString()
          }
          : view
      ))
    };
    persistNamedCollection(nextCollection);
    return mergedDefault;
  }, [
    namedViews,
    mergedDefault,
    storageKey,
    namedViewCollection,
    defaultView,
    persistNamedCollection
  ]);

  const deleteNamedView = useCallback((viewId) => {
    if (!namedViews) {
      return null;
    }

    const normalizedViewId = String(viewId ?? '').trim();
    if (!normalizedViewId || normalizedViewId === DEFAULT_NAMED_VIEW_ID) {
      return null;
    }

    const collection = namedViewCollection ?? buildDefaultNamedViewCollection(defaultView);
    const target = collection.views.find((view) => view.id === normalizedViewId);
    if (!target || target.isReadonly) {
      return null;
    }

    const wasActive = collection.activeViewId === normalizedViewId;
    const nextCollection = {
      activeViewId: wasActive ? DEFAULT_NAMED_VIEW_ID : collection.activeViewId,
      views: collection.views.filter((view) => view.id !== normalizedViewId)
    };

    persistNamedCollection(nextCollection);
    return wasActive ? getActiveNamedViewPayload(nextCollection, defaultView) : null;
  }, [namedViews, namedViewCollection, defaultView, persistNamedCollection]);

  const views = namedViews ? (namedViewCollection?.views ?? []) : [];
  const activeViewId = namedViews
    ? (namedViewCollection?.activeViewId ?? DEFAULT_NAMED_VIEW_ID)
    : null;

  return {
    savedView,
    setSavedView,
    clearSavedView,
    ...(namedViews ? {
      views,
      activeViewId,
      saveNamedView,
      loadNamedView,
      resetToDefaultView,
      deleteNamedView
    } : {})
  };
}

export {
  DEFAULT_NAMED_VIEW_ID,
  DEFAULT_NAMED_VIEW_LABEL,
  buildDefaultNamedViewCollection,
  isLegacyFlatSavedView,
  isNamedViewCollection,
  migrateLegacyToNamedCollection,
  normalizeNamedViewCollection
};
