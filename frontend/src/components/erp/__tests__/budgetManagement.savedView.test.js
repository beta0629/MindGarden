/**
 * Seq 28g Set E — ERP Budget Saved View named views
 */
import { act, renderHook } from '@testing-library/react';
import {
  buildSavedViewStorageKey,
  useSavedViewPreference
} from '../../../hooks/useSavedViewPreference';
import {
  BM_SAVED_VIEW_PAGE_ID,
  buildBudgetManagementDefaultSavedView
} from '../../../constants/budgetManagementSavedViewConstants';

const SCOPE = { tenantId: 'tenant-test', userId: 'user-test' };
const DEFAULT_SAVED_VIEW = buildBudgetManagementDefaultSavedView();

describe('ERP Budget savedView named views (28g-set-e)', () => {
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

  it('pageId storageKey가 erp.budget.management를 사용한다', () => {
    const savedViewKey = buildSavedViewStorageKey(SCOPE, BM_SAVED_VIEW_PAGE_ID);

    expect(savedViewKey).toContain(BM_SAVED_VIEW_PAGE_ID);
  });

  it('named view 저장·복원 시 filters·activeTab을 유지한다', () => {
    const { result } = renderHook(() =>
      useSavedViewPreference({
        pageId: BM_SAVED_VIEW_PAGE_ID,
        defaultView: DEFAULT_SAVED_VIEW,
        namedViews: true
      })
    );

    const storedFilters = {
      activeTab: 'reports',
      category: 'MARKETING',
      status: 'ACTIVE'
    };

    let viewId;
    act(() => {
      viewId = result.current.saveNamedView('마케팅 활성', {
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

    expect(result.current.savedView.filters).toEqual(storedFilters);
  });

  it('기본값 reset 시 default payload로 복원한다', () => {
    const { result } = renderHook(() =>
      useSavedViewPreference({
        pageId: BM_SAVED_VIEW_PAGE_ID,
        defaultView: DEFAULT_SAVED_VIEW,
        namedViews: true
      })
    );

    act(() => {
      result.current.saveNamedView('임시 뷰', {
        viewMode: 'list',
        filters: { activeTab: 'categories', category: 'OPERATING', status: 'EXHAUSTED' },
        sort: {},
        density: 'comfortable'
      });
    });

    act(() => {
      result.current.resetToDefaultView();
    });

    expect(result.current.savedView).toEqual(DEFAULT_SAVED_VIEW);
    expect(result.current.activeViewId).toBe('default');
  });

  it('named view 삭제 시 active view가 default로 복귀한다', () => {
    const { result } = renderHook(() =>
      useSavedViewPreference({
        pageId: BM_SAVED_VIEW_PAGE_ID,
        defaultView: DEFAULT_SAVED_VIEW,
        namedViews: true
      })
    );

    let viewId;
    act(() => {
      viewId = result.current.saveNamedView('삭제 대상', {
        viewMode: 'list',
        filters: { activeTab: 'budgets', category: 'all', status: 'INACTIVE' },
        sort: {},
        density: 'comfortable'
      });
    });

    act(() => {
      result.current.loadNamedView(viewId);
    });

    act(() => {
      result.current.deleteNamedView(viewId);
    });

    expect(result.current.activeViewId).toBe('default');
    expect(result.current.views.some((view) => view.id === viewId)).toBe(false);
  });
});
