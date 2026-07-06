import { act, renderHook } from '@testing-library/react';
import {
  buildViewModeStorageKey,
  resolveViewModeStorageScope,
  useViewModePreference
} from '../useViewModePreference';

const STORAGE_KEY = 'mg.viewMode.v1:tenant-a:user-1:admin.user-management.client';
const DEFAULT_MODE = 'smallCard';
const ALLOWED_MODES = ['largeCard', 'smallCard', 'list'];

describe('buildViewModeStorageKey', () => {
  test('tenant·user·pageId로 키 형식을 생성한다', () => {
    expect(
      buildViewModeStorageKey({ tenantId: 'tenant-a', userId: 42 }, 'admin.user-management.client')
    ).toBe('mg.viewMode.v1:tenant-a:42:admin.user-management.client');
  });

  test('scope가 비어 있으면 anonymous로 대체한다', () => {
    expect(buildViewModeStorageKey({}, 'erp.financial.transactions')).toBe(
      'mg.viewMode.v1:anonymous:anonymous:erp.financial.transactions'
    );
  });

  test('pageId가 없으면 예외를 던진다', () => {
    expect(() => buildViewModeStorageKey({ tenantId: 't1' }, '')).toThrow(
      'buildViewModeStorageKey: pageId is required'
    );
  });
});

describe('resolveViewModeStorageScope', () => {
  const originalSessionManager = window.sessionManager;

  afterEach(() => {
    window.sessionManager = originalSessionManager;
  });

  test('sessionManager에서 tenantId·userId를 읽는다', () => {
    window.sessionManager = {
      getUser: () => ({ id: 99, tenantId: 'tenant-z' })
    };

    expect(resolveViewModeStorageScope()).toEqual({
      tenantId: 'tenant-z',
      userId: '99'
    });
  });

  test('sessionManager가 없으면 null을 반환한다', () => {
    delete window.sessionManager;

    expect(resolveViewModeStorageScope()).toEqual({
      tenantId: null,
      userId: null
    });
  });
});

describe('useViewModePreference', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('저장값이 없으면 defaultMode를 사용한다', () => {
    const { result } = renderHook(() =>
      useViewModePreference({
        storageKey: STORAGE_KEY,
        defaultMode: DEFAULT_MODE,
        allowedModes: ALLOWED_MODES
      })
    );

    expect(result.current.viewMode).toBe(DEFAULT_MODE);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  test('유효한 저장값을 복원한다', () => {
    localStorage.setItem(STORAGE_KEY, 'list');

    const { result } = renderHook(() =>
      useViewModePreference({
        storageKey: STORAGE_KEY,
        defaultMode: DEFAULT_MODE,
        allowedModes: ALLOWED_MODES
      })
    );

    expect(result.current.viewMode).toBe('list');
  });

  test('허용 목록 밖 저장값은 defaultMode로 폴백한다', () => {
    localStorage.setItem(STORAGE_KEY, 'calendar');

    const { result } = renderHook(() =>
      useViewModePreference({
        storageKey: STORAGE_KEY,
        defaultMode: DEFAULT_MODE,
        allowedModes: ALLOWED_MODES
      })
    );

    expect(result.current.viewMode).toBe(DEFAULT_MODE);
  });

  test('setViewMode 호출 시 상태와 localStorage가 갱신된다', () => {
    const { result } = renderHook(() =>
      useViewModePreference({
        storageKey: STORAGE_KEY,
        defaultMode: DEFAULT_MODE,
        allowedModes: ALLOWED_MODES
      })
    );

    act(() => {
      result.current.setViewMode('list');
    });

    expect(result.current.viewMode).toBe('list');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('list');
  });

  test('허용 목록 밖 setViewMode는 defaultMode로 저장한다', () => {
    const { result } = renderHook(() =>
      useViewModePreference({
        storageKey: STORAGE_KEY,
        defaultMode: DEFAULT_MODE,
        allowedModes: ALLOWED_MODES
      })
    );

    act(() => {
      result.current.setViewMode('calendar');
    });

    expect(result.current.viewMode).toBe(DEFAULT_MODE);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(DEFAULT_MODE);
  });

  test('storageKey 변경 시 새 키의 저장값을 다시 읽는다', () => {
    const otherKey = 'mg.viewMode.v1:tenant-b:user-2:admin.user-management.consultant';
    localStorage.setItem(otherKey, 'largeCard');

    const { result, rerender } = renderHook(
      ({ storageKey }) =>
        useViewModePreference({
          storageKey,
          defaultMode: DEFAULT_MODE,
          allowedModes: ALLOWED_MODES
        }),
      { initialProps: { storageKey: STORAGE_KEY } }
    );

    expect(result.current.viewMode).toBe(DEFAULT_MODE);

    rerender({ storageKey: otherKey });

    expect(result.current.viewMode).toBe('largeCard');
  });
});
