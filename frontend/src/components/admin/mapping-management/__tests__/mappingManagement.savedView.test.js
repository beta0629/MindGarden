/**
 * Seq 28g Phase 3 — mapping-management savedView (Clinic-OS TO-BE list|card)
 */
import {
  buildViewModeStorageKey,
  useViewModePreference
} from '../../../../hooks/useViewModePreference';
import {
  buildSavedViewStorageKey,
  useSavedViewPreference
} from '../../../../hooks/useSavedViewPreference';
import {
  MAPPING_LIST_ALLOWED_VIEW_MODES,
  MAPPING_LIST_DEFAULT_VIEW_MODE,
  MAPPING_MANAGEMENT_SAVED_VIEW_PAGE_ID,
  buildMappingManagementDefaultSavedView,
  normalizeMappingListViewMode
} from '../../../../constants/mappingManagementSavedViewConstants';
import { act, renderHook } from '@testing-library/react';

const SCOPE = { tenantId: 'tenant-test', userId: 'user-test' };
const DEFAULT_SAVED_VIEW = buildMappingManagementDefaultSavedView(
  MAPPING_LIST_DEFAULT_VIEW_MODE
);

describe('배정 관리 savedView 영속화 (28g Phase 3)', () => {
  const originalSessionManager = window.sessionManager;

  beforeEach(() => {
    localStorage.clear();
    window.sessionManager = {
      getUser: () => ({ id: 'user-test', tenantId: 'tenant-test' })
    };
  });

  afterEach(() => {
    window.sessionManager = originalSessionManager;
  });

  it('default viewMode는 list이며 allowedModes에 calendar/table 없음', () => {
    expect(MAPPING_LIST_DEFAULT_VIEW_MODE).toBe('list');
    expect(MAPPING_LIST_ALLOWED_VIEW_MODES).toEqual(['list', 'card']);
    expect(MAPPING_LIST_ALLOWED_VIEW_MODES).not.toContain('calendar');
    expect(MAPPING_LIST_ALLOWED_VIEW_MODES).not.toContain('table');
  });

  it('legacy table|calendar → list 정규화', () => {
    expect(normalizeMappingListViewMode('table')).toBe('list');
    expect(normalizeMappingListViewMode('calendar')).toBe('list');
    expect(normalizeMappingListViewMode('card')).toBe('card');
    expect(normalizeMappingListViewMode('list')).toBe('list');
  });

  it('viewMode·savedView storageKey가 동일 pageId를 공유한다', () => {
    const viewModeKey = buildViewModeStorageKey(SCOPE, MAPPING_MANAGEMENT_SAVED_VIEW_PAGE_ID);
    const savedViewKey = buildSavedViewStorageKey(SCOPE, MAPPING_MANAGEMENT_SAVED_VIEW_PAGE_ID);

    expect(viewModeKey).toContain(MAPPING_MANAGEMENT_SAVED_VIEW_PAGE_ID);
    expect(savedViewKey).toContain(MAPPING_MANAGEMENT_SAVED_VIEW_PAGE_ID);
    expect(viewModeKey).not.toBe(savedViewKey);
  });

  it('저장된 viewMode를 복원하고 legacy calendar는 list로 폴백한다', () => {
    const storageKey = buildViewModeStorageKey(SCOPE, MAPPING_MANAGEMENT_SAVED_VIEW_PAGE_ID);
    localStorage.setItem(storageKey, 'card');

    const { result } = renderHook(() =>
      useViewModePreference({
        storageKey,
        defaultMode: MAPPING_LIST_DEFAULT_VIEW_MODE,
        allowedModes: MAPPING_LIST_ALLOWED_VIEW_MODES
      })
    );

    expect(result.current.viewMode).toBe('card');

    act(() => {
      result.current.setViewMode('calendar');
    });

    expect(result.current.viewMode).toBe('list');
    expect(localStorage.getItem(storageKey)).toBe('list');
  });

  it('legacy table 저장값은 list로 복원한다', () => {
    const storageKey = buildViewModeStorageKey(SCOPE, MAPPING_MANAGEMENT_SAVED_VIEW_PAGE_ID);
    localStorage.setItem(storageKey, 'table');

    const { result } = renderHook(() =>
      useViewModePreference({
        storageKey,
        defaultMode: MAPPING_LIST_DEFAULT_VIEW_MODE,
        allowedModes: MAPPING_LIST_ALLOWED_VIEW_MODES
      })
    );

    expect(result.current.viewMode).toBe('list');
  });

  it('savedView는 저장된 filters·viewMode를 mount 시 복원하고 변경 시 persist한다', () => {
    const storageKey = buildSavedViewStorageKey(SCOPE, MAPPING_MANAGEMENT_SAVED_VIEW_PAGE_ID);
    const storedFilters = {
      filterStatus: 'ACTIVE',
      searchTerm: '김상담'
    };
    const storedView = {
      ...DEFAULT_SAVED_VIEW,
      viewMode: 'list',
      filters: storedFilters
    };
    localStorage.setItem(storageKey, JSON.stringify(storedView));

    const { result } = renderHook(() =>
      useSavedViewPreference({
        pageId: MAPPING_MANAGEMENT_SAVED_VIEW_PAGE_ID,
        defaultView: DEFAULT_SAVED_VIEW
      })
    );

    expect(result.current.savedView.viewMode).toBe('list');
    expect(result.current.savedView.filters).toEqual(storedFilters);

    act(() => {
      result.current.setSavedView({
        viewMode: 'card',
        filters: { filterStatus: 'PENDING_PAYMENT', searchTerm: '이내담' }
      });
    });

    expect(JSON.parse(localStorage.getItem(storageKey))).toEqual({
      ...DEFAULT_SAVED_VIEW,
      viewMode: 'card',
      filters: { filterStatus: 'PENDING_PAYMENT', searchTerm: '이내담' }
    });
  });
});

describe('배정 관리 savedView named views (28g-p7)', () => {
  const originalSessionManager = window.sessionManager;

  beforeEach(() => {
    localStorage.clear();
    window.sessionManager = {
      getUser: () => ({ id: 'user-test', tenantId: 'tenant-test' })
    };
  });

  afterEach(() => {
    window.sessionManager = originalSessionManager;
  });

  it('named view 저장·복원 시 filters·viewMode를 유지한다', () => {
    const { result } = renderHook(() =>
      useSavedViewPreference({
        pageId: MAPPING_MANAGEMENT_SAVED_VIEW_PAGE_ID,
        defaultView: DEFAULT_SAVED_VIEW,
        namedViews: true
      })
    );

    const storedFilters = {
      filterStatus: 'ACTIVE',
      searchTerm: '김상담'
    };

    let viewId;
    act(() => {
      viewId = result.current.saveNamedView('활성 배정', {
        viewMode: 'list',
        filters: storedFilters,
        sort: {},
        density: 'comfortable'
      });
    });

    expect(result.current.views.some((view) => view.id === viewId)).toBe(true);

    act(() => {
      result.current.loadNamedView(viewId);
    });

    expect(result.current.savedView.viewMode).toBe('list');
    expect(result.current.savedView.filters).toEqual(storedFilters);
  });

  it('deleteNamedView가 사용자 뷰를 제거하고 default payload로 복귀한다', () => {
    const storageKey = buildSavedViewStorageKey(SCOPE, MAPPING_MANAGEMENT_SAVED_VIEW_PAGE_ID);

    const { result } = renderHook(() =>
      useSavedViewPreference({
        pageId: MAPPING_MANAGEMENT_SAVED_VIEW_PAGE_ID,
        defaultView: DEFAULT_SAVED_VIEW,
        namedViews: true
      })
    );

    let savedViewId;
    act(() => {
      savedViewId = result.current.saveNamedView('삭제 대상', {
        viewMode: 'card',
        filters: { filterStatus: 'PENDING_PAYMENT', searchTerm: '' },
        sort: {},
        density: 'comfortable'
      });
    });

    let fallbackPayload;
    act(() => {
      fallbackPayload = result.current.deleteNamedView(savedViewId);
    });

    expect(fallbackPayload).toEqual(DEFAULT_SAVED_VIEW);
    expect(result.current.views).toHaveLength(1);

    const stored = JSON.parse(localStorage.getItem(storageKey));
    expect(stored.views).toHaveLength(1);
  });
});
