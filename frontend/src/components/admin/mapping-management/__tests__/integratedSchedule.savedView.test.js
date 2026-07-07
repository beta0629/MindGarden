/**
 * Seq 28g — integrated-schedule Saved View named views UI
 */
import { act, renderHook } from '@testing-library/react';
import {
  buildSavedViewStorageKey,
  useSavedViewPreference
} from '../../../../hooks/useSavedViewPreference';
import {
  INTEGRATED_SCHEDULE_SAVED_VIEW_PAGE_ID,
  buildIntegratedScheduleDefaultSavedView
} from '../../../../constants/integratedScheduleSavedViewConstants';

const SCOPE = { tenantId: 'tenant-test', userId: 'user-test' };
const DEFAULT_SAVED_VIEW = buildIntegratedScheduleDefaultSavedView();

describe('통합 스케줄 savedView (28g integrated-schedule UI)', () => {
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

  it('pageId storageKey가 admin.integrated-schedule.sidebar를 사용한다', () => {
    const savedViewKey = buildSavedViewStorageKey(SCOPE, INTEGRATED_SCHEDULE_SAVED_VIEW_PAGE_ID);

    expect(savedViewKey).toContain(INTEGRATED_SCHEDULE_SAVED_VIEW_PAGE_ID);
  });

  it('named view 저장·복원 시 filters·density를 유지한다', () => {
    const { result } = renderHook(() =>
      useSavedViewPreference({
        pageId: INTEGRATED_SCHEDULE_SAVED_VIEW_PAGE_ID,
        defaultView: DEFAULT_SAVED_VIEW,
        namedViews: true
      })
    );

    let viewId;
    act(() => {
      viewId = result.current.saveNamedView('진행중 매칭', {
        viewMode: 'integrated',
        filters: {
          viewFilter: 'remaining',
          statusFilter: 'PENDING_PAYMENT',
          selectedClientIds: [101, 202]
        },
        sort: {},
        density: 'compact'
      });
    });

    expect(result.current.views.some((view) => view.id === viewId)).toBe(true);

    act(() => {
      result.current.loadNamedView(viewId);
    });

    expect(result.current.savedView.filters).toEqual({
      viewFilter: 'remaining',
      statusFilter: 'PENDING_PAYMENT',
      selectedClientIds: [101, 202]
    });
    expect(result.current.savedView.density).toBe('compact');
  });

  it('기본값 reset 시 default filters로 복원한다', () => {
    const { result } = renderHook(() =>
      useSavedViewPreference({
        pageId: INTEGRATED_SCHEDULE_SAVED_VIEW_PAGE_ID,
        defaultView: DEFAULT_SAVED_VIEW,
        namedViews: true
      })
    );

    act(() => {
      result.current.saveNamedView('임시 뷰', {
        viewMode: 'integrated',
        filters: {
          viewFilter: 'all',
          statusFilter: '',
          selectedClientIds: [9]
        },
        sort: {},
        density: 'compact'
      });
    });

    act(() => {
      result.current.resetToDefaultView();
    });

    expect(result.current.savedView).toEqual(DEFAULT_SAVED_VIEW);
    expect(result.current.activeViewId).toBe('default');
  });
});
