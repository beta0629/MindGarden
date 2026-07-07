/**
 * Seq 28g Phase 5D — consultation-logs saved view named views UI
 */
import { act, renderHook } from '@testing-library/react';
import {
  buildSavedViewStorageKey,
  useSavedViewPreference
} from '../../../hooks/useSavedViewPreference';
import {
  CONSULTATION_LOG_VIEW_DEFAULT_VIEW_MODE,
  CONSULTATION_LOG_VIEW_SAVED_VIEW_PAGE_ID,
  buildConsultationLogViewDefaultSavedView
} from '../../../constants/consultationLogViewSavedViewConstants';
import {
  USER_MANAGEMENT_SAVED_VIEW_DEFAULT_ID
} from '../../../constants/userManagementSavedViewConstants';

const PAGE_ID = CONSULTATION_LOG_VIEW_SAVED_VIEW_PAGE_ID;
const SCOPE = { tenantId: 'tenant-test', userId: 'user-test' };
const DEFAULT_DATE_RANGE = { startDate: '2026-06-01', endDate: '2026-07-31' };
const DEFAULT_SAVED_VIEW = buildConsultationLogViewDefaultSavedView(
  CONSULTATION_LOG_VIEW_DEFAULT_VIEW_MODE,
  DEFAULT_DATE_RANGE
);

describe('Consultation log view saved view (28g Phase 5D)', () => {
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

  it('pageId storageKey가 admin.consultation-logs를 사용한다', () => {
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

    const storedFilters = {
      consultantId: 12,
      clientId: 34,
      startDate: '2026-05-01',
      endDate: '2026-05-31'
    };

    let viewId;
    act(() => {
      viewId = result.current.saveNamedView('5월 상담사 필터', {
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
        pageId: PAGE_ID,
        defaultView: DEFAULT_SAVED_VIEW,
        namedViews: true
      })
    );

    act(() => {
      result.current.saveNamedView('임시 뷰', {
        viewMode: 'calendar',
        filters: {
          consultantId: 1,
          clientId: 2,
          startDate: '2026-01-01',
          endDate: '2026-01-31'
        },
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
        filters: {
          consultantId: 5,
          clientId: null,
          startDate: DEFAULT_DATE_RANGE.startDate,
          endDate: DEFAULT_DATE_RANGE.endDate
        }
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
