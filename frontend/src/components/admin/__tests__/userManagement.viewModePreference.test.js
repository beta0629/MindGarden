/**
 * Seq 28b — 사용자 관리 3탭 viewMode localStorage 영속화 pageId SSOT
 * Seq 28g Phase 2b — consultant·staff savedView silent persist
 * Seq 28g Phase 6 — consultant·staff named saved view UI
 */
import { USER_MANAGEMENT_DEFAULT_VIEW_MODE } from '../../common/ViewModeToggle';
import {
  buildViewModeStorageKey,
  useViewModePreference
} from '../../../hooks/useViewModePreference';
import {
  buildSavedViewStorageKey,
  useSavedViewPreference
} from '../../../hooks/useSavedViewPreference';
import {
  USER_MANAGEMENT_SAVED_VIEW_DEFAULT_ID,
  USER_MANAGEMENT_SAVED_VIEW_DEFAULT_LABEL,
  USER_MANAGEMENT_SAVED_VIEW_PAGE_IDS,
  buildUserManagementDefaultSavedView
} from '../../../constants/userManagementSavedViewConstants';
import { act, renderHook } from '@testing-library/react';

const USER_MANAGEMENT_ALLOWED_VIEW_MODES = ['largeCard', 'smallCard', 'list'];
const SCOPE = { tenantId: 'tenant-test', userId: 'user-test' };

const PAGE_IDS = {
  client: USER_MANAGEMENT_SAVED_VIEW_PAGE_IDS.client,
  consultant: USER_MANAGEMENT_SAVED_VIEW_PAGE_IDS.consultant,
  staff: USER_MANAGEMENT_SAVED_VIEW_PAGE_IDS.staff
};

const DEFAULT_SAVED_VIEW = buildUserManagementDefaultSavedView(
  USER_MANAGEMENT_DEFAULT_VIEW_MODE
);

describe('사용자 관리 viewMode 영속화 (28b)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('탭별 pageId가 서로 다른 storageKey를 생성한다', () => {
    const clientKey = buildViewModeStorageKey(SCOPE, PAGE_IDS.client);
    const consultantKey = buildViewModeStorageKey(SCOPE, PAGE_IDS.consultant);
    const staffKey = buildViewModeStorageKey(SCOPE, PAGE_IDS.staff);

    expect(clientKey).toContain(PAGE_IDS.client);
    expect(consultantKey).toContain(PAGE_IDS.consultant);
    expect(staffKey).toContain(PAGE_IDS.staff);
    expect(new Set([clientKey, consultantKey, staffKey]).size).toBe(3);
  });

  it.each([
    ['client', PAGE_IDS.client],
    ['consultant', PAGE_IDS.consultant],
    ['staff', PAGE_IDS.staff]
  ])('%s 탭은 저장된 viewMode를 복원한다', (_label, pageId) => {
    const storageKey = buildViewModeStorageKey(SCOPE, pageId);
    localStorage.setItem(storageKey, 'list');

    const { result } = renderHook(() =>
      useViewModePreference({
        storageKey,
        defaultMode: USER_MANAGEMENT_DEFAULT_VIEW_MODE,
        allowedModes: USER_MANAGEMENT_ALLOWED_VIEW_MODES
      })
    );

    expect(result.current.viewMode).toBe('list');

    act(() => {
      result.current.setViewMode('largeCard');
    });

    expect(localStorage.getItem(storageKey)).toBe('largeCard');
  });
});

describe('사용자 관리 savedView 영속화 (28g Phase 2b)', () => {
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

  it.each([
    ['consultant', USER_MANAGEMENT_SAVED_VIEW_PAGE_IDS.consultant],
    ['staff', USER_MANAGEMENT_SAVED_VIEW_PAGE_IDS.staff]
  ])('%s pageId는 viewMode·savedView storageKey가 동일 pageId를 공유한다', (_label, pageId) => {
    const viewModeKey = buildViewModeStorageKey(SCOPE, pageId);
    const savedViewKey = buildSavedViewStorageKey(SCOPE, pageId);

    expect(viewModeKey).toContain(pageId);
    expect(savedViewKey).toContain(pageId);
    expect(viewModeKey).not.toBe(savedViewKey);
  });

  it.each([
    ['consultant', USER_MANAGEMENT_SAVED_VIEW_PAGE_IDS.consultant, { status: 'ACTIVE' }],
    ['staff', USER_MANAGEMENT_SAVED_VIEW_PAGE_IDS.staff, {}]
  ])(
    '%s savedView는 저장된 filters·viewMode를 mount 시 복원하고 변경 시 persist한다',
    (_label, pageId, storedFilters) => {
      const storageKey = buildSavedViewStorageKey(SCOPE, pageId);
      const storedView = {
        ...DEFAULT_SAVED_VIEW,
        viewMode: 'list',
        filters: storedFilters
      };
      localStorage.setItem(storageKey, JSON.stringify(storedView));

      const { result } = renderHook(() =>
        useSavedViewPreference({ pageId, defaultView: DEFAULT_SAVED_VIEW })
      );

      expect(result.current.savedView.viewMode).toBe('list');
      expect(result.current.savedView.filters).toEqual(storedFilters);

      act(() => {
        result.current.setSavedView({
          viewMode: 'largeCard',
          filters: { status: 'PENDING' }
        });
      });

      expect(JSON.parse(localStorage.getItem(storageKey))).toEqual({
        ...DEFAULT_SAVED_VIEW,
        viewMode: 'largeCard',
        filters: { status: 'PENDING' }
      });
    }
  );
});

describe('사용자 관리 named savedView (28g-p6)', () => {
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

  it.each([
    ['consultant', USER_MANAGEMENT_SAVED_VIEW_PAGE_IDS.consultant, { status: 'ACTIVE' }],
    ['staff', USER_MANAGEMENT_SAVED_VIEW_PAGE_IDS.staff, {}]
  ])(
    '%s namedViews — legacy flat 객체를 배열 스키마로 마이그레이션한다',
    (_label, pageId, storedFilters) => {
      const storageKey = buildSavedViewStorageKey(SCOPE, pageId);
      const legacy = {
        ...DEFAULT_SAVED_VIEW,
        viewMode: 'list',
        filters: storedFilters
      };
      localStorage.setItem(storageKey, JSON.stringify(legacy));

      const { result } = renderHook(() =>
        useSavedViewPreference({
          pageId,
          defaultView: DEFAULT_SAVED_VIEW,
          namedViews: true
        })
      );

      expect(result.current.savedView.filters).toEqual(storedFilters);
      expect(result.current.activeViewId).toBe(USER_MANAGEMENT_SAVED_VIEW_DEFAULT_ID);
      expect(result.current.views[0]).toMatchObject({
        id: USER_MANAGEMENT_SAVED_VIEW_DEFAULT_ID,
        label: USER_MANAGEMENT_SAVED_VIEW_DEFAULT_LABEL,
        payload: expect.objectContaining({ filters: storedFilters })
      });
    }
  );

  it.each([
    ['consultant', USER_MANAGEMENT_SAVED_VIEW_PAGE_IDS.consultant, { status: 'PENDING' }],
    ['staff', USER_MANAGEMENT_SAVED_VIEW_PAGE_IDS.staff, {}]
  ])(
    '%s namedViews — save/load/reset 및 localStorage 스키마 v1',
    (_label, pageId, savedFilters) => {
      const storageKey = buildSavedViewStorageKey(SCOPE, pageId);

      const { result } = renderHook(() =>
        useSavedViewPreference({
          pageId,
          defaultView: DEFAULT_SAVED_VIEW,
          namedViews: true
        })
      );

      act(() => {
        result.current.saveNamedView('저장 뷰', {
          viewMode: 'largeCard',
          filters: savedFilters,
          sort: {},
          density: 'comfortable'
        });
      });

      const stored = JSON.parse(localStorage.getItem(storageKey));
      expect(stored.activeViewId).toMatch(/^view_/);
      expect(stored.views).toHaveLength(2);
      expect(stored.views.find((view) => view.label === '저장 뷰')).toMatchObject({
        id: expect.stringMatching(/^view_/),
        label: '저장 뷰',
        payload: {
          viewMode: 'largeCard',
          filters: savedFilters,
          sort: {},
          density: 'comfortable'
        },
        updatedAt: expect.any(String)
      });

      act(() => {
        result.current.loadNamedView(USER_MANAGEMENT_SAVED_VIEW_DEFAULT_ID);
      });

      expect(result.current.activeViewId).toBe(USER_MANAGEMENT_SAVED_VIEW_DEFAULT_ID);

      act(() => {
        result.current.resetToDefaultView();
      });

      expect(result.current.savedView).toEqual(DEFAULT_SAVED_VIEW);
      expect(result.current.activeViewId).toBe(USER_MANAGEMENT_SAVED_VIEW_DEFAULT_ID);
    }
  );

  it.each([
    ['consultant', USER_MANAGEMENT_SAVED_VIEW_PAGE_IDS.consultant],
    ['staff', USER_MANAGEMENT_SAVED_VIEW_PAGE_IDS.staff]
  ])('%s namedViews — deleteNamedView가 사용자 뷰를 제거하고 default는 보호한다', (_label, pageId) => {
    const storageKey = buildSavedViewStorageKey(SCOPE, pageId);

    const { result } = renderHook(() =>
      useSavedViewPreference({
        pageId,
        defaultView: DEFAULT_SAVED_VIEW,
        namedViews: true
      })
    );

    let savedViewId;
    act(() => {
      savedViewId = result.current.saveNamedView('삭제 대상', {
        ...DEFAULT_SAVED_VIEW,
        filters: { status: 'PENDING' }
      });
    });

    expect(result.current.views).toHaveLength(2);

    act(() => {
      expect(result.current.deleteNamedView(USER_MANAGEMENT_SAVED_VIEW_DEFAULT_ID)).toBeNull();
    });

    let fallbackPayload;
    act(() => {
      fallbackPayload = result.current.deleteNamedView(savedViewId);
    });

    expect(fallbackPayload).toEqual(DEFAULT_SAVED_VIEW);
    expect(result.current.views).toHaveLength(1);
    expect(result.current.views[0].id).toBe(USER_MANAGEMENT_SAVED_VIEW_DEFAULT_ID);

    const stored = JSON.parse(localStorage.getItem(storageKey));
    expect(stored.views).toHaveLength(1);
    expect(stored.activeViewId).toBe(USER_MANAGEMENT_SAVED_VIEW_DEFAULT_ID);
  });
});
