/**
 * Seq 28g Phase 6 — Consultant saved view named views UI
 */
import { act, renderHook } from '@testing-library/react';
import {
  buildSavedViewStorageKey,
  useSavedViewPreference
} from '../../../hooks/useSavedViewPreference';
import {
  USER_MANAGEMENT_SAVED_VIEW_DEFAULT_ID,
  USER_MANAGEMENT_SAVED_VIEW_PAGE_IDS,
  buildUserManagementDefaultSavedView
} from '../../../constants/userManagementSavedViewConstants';
import { USER_MANAGEMENT_DEFAULT_VIEW_MODE } from '../../common/ViewModeToggle';

const PAGE_ID = USER_MANAGEMENT_SAVED_VIEW_PAGE_IDS.consultant;
const SCOPE = { tenantId: 'tenant-test', userId: 'user-test' };
const DEFAULT_SAVED_VIEW = buildUserManagementDefaultSavedView(USER_MANAGEMENT_DEFAULT_VIEW_MODE);

describe('Consultant saved view named views (28g-p6)', () => {
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

  it('pageId storageKey가 admin.user-management.consultant를 사용한다', () => {
    const savedViewKey = buildSavedViewStorageKey(SCOPE, PAGE_ID);

    expect(savedViewKey).toContain(PAGE_ID);
  });

  it('named view 저장·복원 시 filters·viewMode를 유지한다', () => {
    const { result } = renderHook(() =>
      useSavedViewPreference({
        pageId: PAGE_ID,
        defaultView: DEFAULT_SAVED_VIEW,
        namedViews: true
      })
    );

    const storedFilters = { status: 'ACTIVE' };

    let viewId;
    act(() => {
      viewId = result.current.saveNamedView('활성 상담사', {
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

  it('기본값 reset 시 default payload로 복원한다', () => {
    const { result } = renderHook(() =>
      useSavedViewPreference({
        pageId: PAGE_ID,
        defaultView: DEFAULT_SAVED_VIEW,
        namedViews: true
      })
    );

    act(() => {
      result.current.saveNamedView('임시 뷰', {
        viewMode: 'largeCard',
        filters: { status: 'PENDING' },
        sort: {},
        density: 'comfortable'
      });
    });

    act(() => {
      result.current.resetToDefaultView();
    });

    expect(result.current.savedView).toEqual(DEFAULT_SAVED_VIEW);
    expect(result.current.activeViewId).toBe(USER_MANAGEMENT_SAVED_VIEW_DEFAULT_ID);
  });

  it('deleteNamedView가 사용자 뷰를 제거하고 default는 보호한다', () => {
    const storageKey = buildSavedViewStorageKey(SCOPE, PAGE_ID);

    const { result } = renderHook(() =>
      useSavedViewPreference({
        pageId: PAGE_ID,
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
