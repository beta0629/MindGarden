/**
 * Seq 28g Phase 5 — Client saved view UI (named views pilot)
 */
import React, { useCallback, useState } from 'react';
import { act, fireEvent, render, screen, renderHook } from '@testing-library/react';
import SavedViewControls from '../ClientComprehensiveManagement/molecules/SavedViewControls';
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
import { USER_MANAGEMENT_DEFAULT_VIEW_MODE } from '../../common/ViewModeToggle';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key) => key
  }),
  initReactI18next: { type: '3rdParty', init: jest.fn() }
}));

jest.mock('../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, title, children, actions }) => (
    isOpen ? (
      <div data-testid="save-view-modal">
        <h2>{title}</h2>
        {children}
        <div>{actions}</div>
      </div>
    ) : null
  )
}));

const PAGE_ID = USER_MANAGEMENT_SAVED_VIEW_PAGE_IDS.client;
const SCOPE = { tenantId: 'tenant-a', userId: 'user-a' };
const STORAGE_KEY = buildSavedViewStorageKey(SCOPE, PAGE_ID);
const DEFAULT_VIEW = buildUserManagementDefaultSavedView(USER_MANAGEMENT_DEFAULT_VIEW_MODE);

const SavedViewHarness = ({
  initialViews = [{ id: USER_MANAGEMENT_SAVED_VIEW_DEFAULT_ID, label: USER_MANAGEMENT_SAVED_VIEW_DEFAULT_LABEL }],
  initialActiveViewId = USER_MANAGEMENT_SAVED_VIEW_DEFAULT_ID
}) => {
  const [views, setViews] = useState(initialViews);
  const [activeViewId, setActiveViewId] = useState(initialActiveViewId);
  const [filters, setFilters] = useState({});

  const handleSelectView = useCallback((viewId) => {
    setActiveViewId(viewId);
    if (viewId === 'view_saved') {
      setFilters({ status: 'PENDING' });
    }
  }, []);

  const handleSaveView = useCallback((label) => {
    const id = `view_${Date.now()}`;
    setViews((prev) => [...prev, { id, label }]);
    setActiveViewId(id);
  }, []);

  const handleReset = useCallback(() => {
    setActiveViewId(USER_MANAGEMENT_SAVED_VIEW_DEFAULT_ID);
    setFilters({});
  }, []);

  return (
    <div>
      <SavedViewControls
        views={views}
        activeViewId={activeViewId}
        onSelectView={handleSelectView}
        onSaveView={handleSaveView}
        onResetToDefault={handleReset}
      />
      <div data-testid="active-filters">{JSON.stringify(filters)}</div>
    </div>
  );
};

describe('Client saved view UI (28g-p5)', () => {
  const originalSessionManager = window.sessionManager;

  beforeEach(() => {
    localStorage.clear();
    window.sessionManager = {
      getUser: () => ({ id: 'user-a', tenantId: 'tenant-a' })
    };
  });

  afterEach(() => {
    window.sessionManager = originalSessionManager;
  });

  it('SavedViewControls — 기본값 Chip이 활성 상태로 렌더링된다', () => {
    render(<SavedViewHarness />);

    expect(screen.getByTestId('saved-view-controls')).toBeInTheDocument();
    expect(screen.getByTestId('saved-view-chip-default')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('saved-view-save-btn')).toHaveTextContent('현재 뷰 저장');
  });

  it('SavedViewControls — 저장 모달에서 이름 입력 후 Chip이 추가된다', () => {
    render(<SavedViewHarness />);

    fireEvent.click(screen.getByTestId('saved-view-save-btn'));
    expect(screen.getByTestId('save-view-modal')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('saved-view-label-input'), {
      target: { value: '미결제 내담자' }
    });
    fireEvent.click(screen.getByTestId('saved-view-save-confirm'));

    expect(screen.getByTestId(/^saved-view-chip-view_/)).toHaveTextContent('미결제 내담자');
  });

  it('SavedViewControls — Chip 클릭 시 payload가 반영된다', () => {
    render(
      <SavedViewHarness
        initialViews={[
          { id: USER_MANAGEMENT_SAVED_VIEW_DEFAULT_ID, label: USER_MANAGEMENT_SAVED_VIEW_DEFAULT_LABEL },
          { id: 'view_saved', label: '대기 중' }
        ]}
        initialActiveViewId="view_saved"
      />
    );

    fireEvent.click(screen.getByTestId('saved-view-chip-view_saved'));
    expect(screen.getByTestId('active-filters')).toHaveTextContent('PENDING');
  });

  it('SavedViewControls — 기본값 클릭 시 필터가 초기화된다', () => {
    render(
      <SavedViewHarness
        initialViews={[
          { id: USER_MANAGEMENT_SAVED_VIEW_DEFAULT_ID, label: USER_MANAGEMENT_SAVED_VIEW_DEFAULT_LABEL },
          { id: 'view_saved', label: '대기 중' }
        ]}
        initialActiveViewId="view_saved"
      />
    );

    fireEvent.click(screen.getByTestId('saved-view-chip-default'));
    expect(screen.getByTestId('saved-view-chip-default')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('active-filters')).toHaveTextContent('{}');
  });

  it('useSavedViewPreference namedViews — legacy flat 객체를 배열 스키마로 마이그레이션한다', () => {
    const legacy = {
      ...DEFAULT_VIEW,
      viewMode: 'list',
      filters: { status: 'ACTIVE' }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));

    const { result } = renderHook(() =>
      useSavedViewPreference({
        pageId: PAGE_ID,
        defaultView: DEFAULT_VIEW,
        namedViews: true
      })
    );

    expect(result.current.savedView.filters).toEqual({ status: 'ACTIVE' });
    expect(result.current.activeViewId).toBe(USER_MANAGEMENT_SAVED_VIEW_DEFAULT_ID);
    expect(result.current.views[0]).toMatchObject({
      id: USER_MANAGEMENT_SAVED_VIEW_DEFAULT_ID,
      label: USER_MANAGEMENT_SAVED_VIEW_DEFAULT_LABEL,
      payload: expect.objectContaining({ filters: { status: 'ACTIVE' } })
    });
  });

  it('useSavedViewPreference namedViews — save/load/reset 및 localStorage 스키마 v1', () => {
    const { result } = renderHook(() =>
      useSavedViewPreference({
        pageId: PAGE_ID,
        defaultView: DEFAULT_VIEW,
        namedViews: true
      })
    );

    act(() => {
      result.current.saveNamedView('미결제 내담자', {
        viewMode: 'largeCard',
        filters: { status: 'PENDING' },
        sort: {},
        density: 'comfortable'
      });
    });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(stored.activeViewId).toMatch(/^view_/);
    expect(stored.views).toHaveLength(2);
    const savedView = stored.views.find((view) => view.label === '미결제 내담자');
    expect(savedView).toMatchObject({
      id: expect.stringMatching(/^view_/),
      label: '미결제 내담자',
      payload: {
        viewMode: 'largeCard',
        filters: { status: 'PENDING' },
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

    expect(result.current.savedView).toEqual(DEFAULT_VIEW);
    expect(result.current.activeViewId).toBe(USER_MANAGEMENT_SAVED_VIEW_DEFAULT_ID);
  });

  it('useSavedViewPreference namedViews — debounced silent persist가 active view payload를 갱신한다', () => {
    const { result } = renderHook(() =>
      useSavedViewPreference({
        pageId: PAGE_ID,
        defaultView: DEFAULT_VIEW,
        namedViews: true
      })
    );

    act(() => {
      result.current.setSavedView({
        viewMode: 'list',
        filters: { status: 'INACTIVE' }
      });
    });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const defaultView = stored.views.find((view) => view.id === USER_MANAGEMENT_SAVED_VIEW_DEFAULT_ID);
    expect(defaultView.payload.filters).toEqual({ status: 'INACTIVE' });
  });

  it('useSavedViewPreference namedViews — tenantId/userId 스코프가 다르면 저장 뷰가 격리된다', () => {
    const { result: resultA } = renderHook(() =>
      useSavedViewPreference({
        pageId: PAGE_ID,
        defaultView: DEFAULT_VIEW,
        namedViews: true
      })
    );

    act(() => {
      resultA.current.saveNamedView('테넌트 A 뷰', {
        ...DEFAULT_VIEW,
        filters: { status: 'ACTIVE' }
      });
    });

    window.sessionManager = {
      getUser: () => ({ id: 'user-b', tenantId: 'tenant-b' })
    };

    const { result: resultB } = renderHook(() =>
      useSavedViewPreference({
        pageId: PAGE_ID,
        defaultView: DEFAULT_VIEW,
        namedViews: true
      })
    );

    expect(resultB.current.views).toHaveLength(1);
    expect(resultB.current.views[0].label).toBe(USER_MANAGEMENT_SAVED_VIEW_DEFAULT_LABEL);
    expect(resultB.current.views.some((view) => view.label === '테넌트 A 뷰')).toBe(false);

    const tenantBKey = buildSavedViewStorageKey(
      { tenantId: 'tenant-b', userId: 'user-b' },
      PAGE_ID
    );
    expect(localStorage.getItem(tenantBKey)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });
});
