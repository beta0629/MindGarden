/**
 * Seq 28g Set E — ERP Refund Saved View named views
 */
import { act, renderHook } from '@testing-library/react';
import {
  buildSavedViewStorageKey,
  useSavedViewPreference
} from '../../../hooks/useSavedViewPreference';
import {
  RM_SAVED_VIEW_PAGE_ID,
  buildRefundManagementDefaultSavedView
} from '../../../constants/refundManagementSavedViewConstants';

const SCOPE = { tenantId: 'tenant-test', userId: 'user-test' };
const DEFAULT_SAVED_VIEW = buildRefundManagementDefaultSavedView();

describe('ERP Refund savedView named views (28g-set-e)', () => {
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

  it('pageId storageKey가 erp.refund.management를 사용한다', () => {
    const savedViewKey = buildSavedViewStorageKey(SCOPE, RM_SAVED_VIEW_PAGE_ID);

    expect(savedViewKey).toContain(RM_SAVED_VIEW_PAGE_ID);
  });

  it('named view 저장·복원 시 filters·viewMode를 유지한다', () => {
    const { result } = renderHook(() =>
      useSavedViewPreference({
        pageId: RM_SAVED_VIEW_PAGE_ID,
        defaultView: DEFAULT_SAVED_VIEW,
        namedViews: true
      })
    );

    const storedFilters = {
      selectedPeriod: 'quarter',
      selectedStatus: 'pending',
      refundViewMode: 'table'
    };

    let viewId;
    act(() => {
      viewId = result.current.saveNamedView('분기 대기', {
        viewMode: 'table',
        filters: storedFilters,
        sort: {},
        density: 'comfortable'
      });
    });

    expect(result.current.views.some((view) => view.id === viewId)).toBe(true);

    act(() => {
      result.current.loadNamedView(viewId);
    });

    expect(result.current.savedView.viewMode).toBe('table');
    expect(result.current.savedView.filters).toEqual(storedFilters);
  });

  it('기본값 reset 시 default payload로 복원한다', () => {
    const { result } = renderHook(() =>
      useSavedViewPreference({
        pageId: RM_SAVED_VIEW_PAGE_ID,
        defaultView: DEFAULT_SAVED_VIEW,
        namedViews: true
      })
    );

    act(() => {
      result.current.saveNamedView('임시 뷰', {
        viewMode: 'table',
        filters: {
          selectedPeriod: 'year',
          selectedStatus: 'completed',
          refundViewMode: 'table'
        },
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
        pageId: RM_SAVED_VIEW_PAGE_ID,
        defaultView: DEFAULT_SAVED_VIEW,
        namedViews: true
      })
    );

    let viewId;
    act(() => {
      viewId = result.current.saveNamedView('삭제 대상', {
        viewMode: 'table',
        filters: {
          selectedPeriod: 'week',
          selectedStatus: 'failed',
          refundViewMode: 'table'
        },
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
