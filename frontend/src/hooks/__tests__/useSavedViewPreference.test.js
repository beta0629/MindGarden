import { act, renderHook } from '@testing-library/react';
import {
  buildSavedViewStorageKey,
  resolveSavedViewStorageScope,
  useSavedViewPreference
} from '../useSavedViewPreference';

const PAGE_ID = 'admin.user-management.client';
const STORAGE_KEY = 'mg.savedView.v1:tenant-a:1:admin.user-management.client';
const DEFAULT_VIEW = {
  viewMode: 'list',
  filters: { status: 'active' },
  sort: { field: 'name', order: 'asc' },
  density: 'comfortable'
};

describe('useSavedViewPreference', () => {
  const originalSessionManager = window.sessionManager;

  beforeEach(() => {
    localStorage.clear();
    window.sessionManager = {
      getUser: () => ({ id: 1, tenantId: 'tenant-a' })
    };
  });

  afterEach(() => {
    window.sessionManager = originalSessionManager;
  });

  test('키 생성 · read/write · clear round-trip', () => {
    expect(
      buildSavedViewStorageKey({ tenantId: 'tenant-a', userId: 1 }, PAGE_ID)
    ).toBe(STORAGE_KEY);

    expect(resolveSavedViewStorageScope()).toEqual({
      tenantId: 'tenant-a',
      userId: '1'
    });

    const { result } = renderHook(() =>
      useSavedViewPreference({ pageId: PAGE_ID, defaultView: DEFAULT_VIEW })
    );

    expect(result.current.savedView).toEqual(DEFAULT_VIEW);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    const nextView = {
      viewMode: 'table',
      filters: { status: 'inactive' },
      sort: { field: 'updatedAt', order: 'desc' },
      density: 'compact'
    };

    act(() => {
      result.current.setSavedView(nextView);
    });

    expect(result.current.savedView).toEqual(nextView);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual(nextView);

    act(() => {
      result.current.clearSavedView();
    });

    expect(result.current.savedView).toEqual(DEFAULT_VIEW);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  test('tenantId 없으면 read/write/clear no-op', () => {
    window.sessionManager = { getUser: () => ({ id: 1 }) };

    const { result } = renderHook(() =>
      useSavedViewPreference({ pageId: PAGE_ID, defaultView: DEFAULT_VIEW })
    );

    expect(result.current.savedView).toEqual(DEFAULT_VIEW);

    act(() => {
      result.current.setSavedView({ viewMode: 'table' });
    });

    expect(result.current.savedView).toEqual({
      ...DEFAULT_VIEW,
      viewMode: 'table'
    });
    expect(localStorage.length).toBe(0);

    act(() => {
      result.current.clearSavedView();
    });

    expect(result.current.savedView).toEqual(DEFAULT_VIEW);
  });

  test('JSON parse 실패 시 defaultView로 폴백', () => {
    localStorage.setItem(STORAGE_KEY, '{invalid');

    const { result } = renderHook(() =>
      useSavedViewPreference({ pageId: PAGE_ID, defaultView: DEFAULT_VIEW })
    );

    expect(result.current.savedView).toEqual(DEFAULT_VIEW);
  });
});
