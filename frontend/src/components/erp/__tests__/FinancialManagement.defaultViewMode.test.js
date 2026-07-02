/**
 * PER_PAGE G3-01 — 재무 거래 목록 기본 보기 모드 SSOT
 * @see ../../../constants/financialManagementStrings.js
 */
import {
  FM_TRANSACTION_DEFAULT_VIEW_MODE,
  FM_TRANSACTION_VIEW_MODE_OPTIONS
} from '../../../constants/financialManagementStrings';

describe('FinancialManagement 거래 목록 기본 보기 (G3-01)', () => {
  it('기본 viewMode는 table이다', () => {
    expect(FM_TRANSACTION_DEFAULT_VIEW_MODE).toBe('table');
  });

  it('ViewModeToggle options에 table이 포함된다', () => {
    const values = FM_TRANSACTION_VIEW_MODE_OPTIONS.map((opt) => opt.value);
    expect(values).toContain('table');
    expect(values).toContain('card');
  });
});
