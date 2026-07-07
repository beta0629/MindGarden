/**
 * Seq 28g Phase 4 — FinancialManagement savedView silent persist
 */
import {
  FM_TRANSACTION_DEFAULT_VIEW_MODE,
  FM_TRANSACTION_VIEW_MODE_OPTIONS
} from '../../../constants/financialManagementStrings';
import {
  FM_SAVED_VIEW_PAGE_ID,
  buildFinancialManagementDefaultSavedView
} from '../../../constants/financialManagementSavedViewConstants';
import {
  buildViewModeStorageKey,
  useViewModePreference
} from '../../../hooks/useViewModePreference';
import {
  buildSavedViewStorageKey,
  useSavedViewPreference
} from '../../../hooks/useSavedViewPreference';
import { act, renderHook } from '@testing-library/react';

const SCOPE = { tenantId: 'tenant-test', userId: 'user-test' };
const FM_TRANSACTION_ALLOWED_MODES = FM_TRANSACTION_VIEW_MODE_OPTIONS.map((opt) => opt.value);
const DEFAULT_SAVED_VIEW = buildFinancialManagementDefaultSavedView(
  FM_TRANSACTION_DEFAULT_VIEW_MODE
);

describe('재무 관리 savedView 영속화 (28g Phase 4)', () => {
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

  it('viewMode·savedView storageKey가 동일 pageId를 공유한다', () => {
    const viewModeKey = buildViewModeStorageKey(SCOPE, FM_SAVED_VIEW_PAGE_ID);
    const savedViewKey = buildSavedViewStorageKey(SCOPE, FM_SAVED_VIEW_PAGE_ID);

    expect(viewModeKey).toContain(FM_SAVED_VIEW_PAGE_ID);
    expect(savedViewKey).toContain(FM_SAVED_VIEW_PAGE_ID);
    expect(viewModeKey).not.toBe(savedViewKey);
  });

  it('저장된 viewMode를 복원한다', () => {
    const storageKey = buildViewModeStorageKey(SCOPE, FM_SAVED_VIEW_PAGE_ID);
    localStorage.setItem(storageKey, 'card');

    const { result } = renderHook(() =>
      useViewModePreference({
        storageKey,
        defaultMode: FM_TRANSACTION_DEFAULT_VIEW_MODE,
        allowedModes: FM_TRANSACTION_ALLOWED_MODES
      })
    );

    expect(result.current.viewMode).toBe('card');

    act(() => {
      result.current.setViewMode('compact');
    });

    expect(localStorage.getItem(storageKey)).toBe('compact');
  });

  it('savedView는 저장된 filters·viewMode를 mount 시 복원하고 변경 시 persist한다', () => {
    const storageKey = buildSavedViewStorageKey(SCOPE, FM_SAVED_VIEW_PAGE_ID);
    const storedFilters = {
      transactionType: 'INCOME',
      category: 'CONSULTATION',
      dateRange: 'MONTH',
      monthYm: '2026-06',
      startDate: '',
      endDate: '',
      searchText: '김상담'
    };
    const storedView = {
      ...DEFAULT_SAVED_VIEW,
      viewMode: 'table',
      filters: storedFilters
    };
    localStorage.setItem(storageKey, JSON.stringify(storedView));

    const { result } = renderHook(() =>
      useSavedViewPreference({
        pageId: FM_SAVED_VIEW_PAGE_ID,
        defaultView: DEFAULT_SAVED_VIEW
      })
    );

    expect(result.current.savedView.viewMode).toBe('table');
    expect(result.current.savedView.filters).toEqual(storedFilters);

    act(() => {
      result.current.setSavedView({
        viewMode: 'card',
        filters: {
          transactionType: 'EXPENSE',
          category: 'ALL',
          dateRange: 'WEEK',
          monthYm: '2026-07',
          startDate: '',
          endDate: '',
          searchText: '임대료'
        }
      });
    });

    expect(JSON.parse(localStorage.getItem(storageKey))).toEqual({
      ...DEFAULT_SAVED_VIEW,
      viewMode: 'card',
      filters: {
        transactionType: 'EXPENSE',
        category: 'ALL',
        dateRange: 'WEEK',
        monthYm: '2026-07',
        startDate: '',
        endDate: '',
        searchText: '임대료'
      }
    });
  });
});
