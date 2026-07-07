/**
 * Seq 28g — ERP Financial Saved View named views UI
 */
import { act, renderHook } from '@testing-library/react';
import {
  buildSavedViewStorageKey,
  useSavedViewPreference
} from '../../../hooks/useSavedViewPreference';
import {
  FM_SAVED_VIEW_PAGE_ID,
  buildFinancialManagementDefaultSavedView
} from '../../../constants/financialManagementSavedViewConstants';
import { FM_TRANSACTION_DEFAULT_VIEW_MODE } from '../../../constants/financialManagementStrings';

const SCOPE = { tenantId: 'tenant-test', userId: 'user-test' };
const DEFAULT_SAVED_VIEW = buildFinancialManagementDefaultSavedView(
  FM_TRANSACTION_DEFAULT_VIEW_MODE
);

describe('ERP Financial savedView named views (28g-p8)', () => {
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

  it('pageId storageKey가 erp.financial.transactions를 사용한다', () => {
    const savedViewKey = buildSavedViewStorageKey(SCOPE, FM_SAVED_VIEW_PAGE_ID);

    expect(savedViewKey).toContain(FM_SAVED_VIEW_PAGE_ID);
  });

  it('named view 저장·복원 시 filters·viewMode를 유지한다', () => {
    const { result } = renderHook(() =>
      useSavedViewPreference({
        pageId: FM_SAVED_VIEW_PAGE_ID,
        defaultView: DEFAULT_SAVED_VIEW,
        namedViews: true
      })
    );

    const storedFilters = {
      transactionType: 'INCOME',
      category: 'CONSULTATION',
      dateRange: 'MONTH',
      monthYm: '2026-07',
      startDate: '',
      endDate: '',
      searchText: '김내담'
    };

    let viewId;
    act(() => {
      viewId = result.current.saveNamedView('7월 수입', {
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
        pageId: FM_SAVED_VIEW_PAGE_ID,
        defaultView: DEFAULT_SAVED_VIEW,
        namedViews: true
      })
    );

    act(() => {
      result.current.saveNamedView('임시 뷰', {
        viewMode: 'card',
        filters: { transactionType: 'EXPENSE' },
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
});
