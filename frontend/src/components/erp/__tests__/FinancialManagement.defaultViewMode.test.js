/**
 * PER_PAGE G3-01 — 재무 거래 목록 기본 보기 모드 SSOT
 * @see ../../../constants/financialManagementStrings.js
 */
import { act, renderHook } from '@testing-library/react';
import {
  FM_TRANSACTION_DEFAULT_VIEW_MODE,
  FM_TRANSACTION_VIEW_MODE_OPTIONS
} from '../../../constants/financialManagementStrings';
import { FM_SAVED_VIEW_PAGE_ID } from '../../../constants/financialManagementSavedViewConstants';
import {
  buildViewModeStorageKey,
  useViewModePreference
} from '../../../hooks/useViewModePreference';
const FM_TRANSACTION_ALLOWED_MODES = FM_TRANSACTION_VIEW_MODE_OPTIONS.map((opt) => opt.value);

describe('FinancialManagement 거래 목록 기본 보기 (G3-01)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('기본 viewMode는 table이다', () => {
    expect(FM_TRANSACTION_DEFAULT_VIEW_MODE).toBe('table');
  });

  it('ViewModeToggle options에 table이 포함된다', () => {
    const values = FM_TRANSACTION_VIEW_MODE_OPTIONS.map((opt) => opt.value);
    expect(values).toContain('table');
    expect(values).toContain('card');
  });

  it('localStorage에 저장된 viewMode를 복원한다 (28e)', () => {
    const storageKey = buildViewModeStorageKey({}, FM_SAVED_VIEW_PAGE_ID);
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
});
