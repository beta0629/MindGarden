/**
 * 상담사 지급 Clinic-OS 문자열·헬퍼 단위 테스트
 *
 * @author CoreSolution
 * @since 2026-09-07
 */

import {
  SM_PAGE_TITLE,
  SM_MAIN_ARIA_LABEL,
  SM_SUMMARY,
  SM_TODO_TITLE,
  SM_EMPTY_LIST,
  SM_TOOLBAR,
  SM_CALC_DISABLED,
  getSalaryCalcDisabledReason
} from '../salaryManagementClinicOsStrings';
import {
  SALARY_STATUS,
  SALARY_STATUS_LABELS,
  SALARY_ACTION_LABELS,
  SALARY_API_ENDPOINTS,
  TAX_BREAKDOWN_LABELS,
  SALARY_TAX_ROW_TYPE_LABELS
} from '../salaryConstants';

describe('SM Clinic-OS page copy', () => {
  it('locks 상담사 지급 title and aria', () => {
    expect(SM_PAGE_TITLE).toBe('상담사 지급');
    expect(SM_MAIN_ARIA_LABEL).toBe('상담사 지급 콘텐츠');
    expect(SM_TODO_TITLE).toBe('할 일');
    expect(SM_EMPTY_LIST).toBe('지급할 내역이 없습니다.');
    expect(SM_TOOLBAR.CALC_CTA).toBe('계산');
  });

  it('locks summary strip labels', () => {
    expect(SM_SUMMARY.BAND_ARIA).toBe('상담사 지급 요약');
    expect(SM_SUMMARY.OWED_LABEL).toBe('지급 예정');
    expect(SM_SUMMARY.DEDUCTION_LABEL).toBe('공제');
    expect(SM_SUMMARY.PENDING_APPROVAL_LABEL).toBe('승인대기');
  });
});

describe('SALARY_STATUS_LABELS TO-BE badges', () => {
  it('maps next-action labels', () => {
    expect(SALARY_STATUS_LABELS[SALARY_STATUS.CALCULATED]).toBe('승인대기');
    expect(SALARY_STATUS_LABELS[SALARY_STATUS.APPROVED]).toBe('지급대기');
    expect(SALARY_STATUS_LABELS[SALARY_STATUS.PAID]).toBe('지급됨');
  });

  it('exposes approve and pay action labels + PAY endpoint', () => {
    expect(SALARY_ACTION_LABELS.APPROVE).toBe('승인');
    expect(SALARY_ACTION_LABELS.PAY).toBe('지급');
    expect(SALARY_API_ENDPOINTS.PAY).toBe('/api/v1/admin/salary/pay');
  });
});

describe('withholding copy separation', () => {
  it('does not use standalone 3.3% as primary withholding label', () => {
    expect(TAX_BREAKDOWN_LABELS.withholdingTax).toBe('원천징수 국세(3%) · 지방세(0.3%)');
    expect(SALARY_TAX_ROW_TYPE_LABELS.WITHHOLDING_TAX).toBe('원천징수 국세(3%) · 지방세(0.3%)');
    expect(TAX_BREAKDOWN_LABELS.withholdingTax).not.toMatch(/합계 3\.3%/);
    expect(SALARY_TAX_ROW_TYPE_LABELS.WITHHOLDING_TAX).not.toMatch(/합계 3\.3%/);
  });
});

describe('SM_CALC_DISABLED copy', () => {
  it('keeps Korean hint strings stable (UX copy lock)', () => {
    expect(SM_CALC_DISABLED.HINT_ID).toBe('salary-calc-disabled-hint');
    expect(SM_CALC_DISABLED.NO_PROFILES).toBe('급여 프로필을 먼저 작성해 주세요.');
    expect(SM_CALC_DISABLED.NEED_CONSULTANT_AND_PERIOD).toBe('상담사와 기간을 선택해 주세요.');
    expect(SM_CALC_DISABLED.NEED_CONSULTANT).toBe('상담사를 선택하면 계산할 수 있습니다.');
    expect(SM_CALC_DISABLED.NEED_PERIOD).toBe('기간을 선택하면 계산할 수 있습니다.');
  });
});

describe('getSalaryCalcDisabledReason', () => {
  const baseReady = {
    loading: false,
    silentListRefreshing: false,
    salaryProfilesLength: 1,
    selectedConsultant: { id: 1 },
    selectedPeriod: '2026-09'
  };

  it('returns null while loading or silent list refreshing', () => {
    expect(getSalaryCalcDisabledReason({ ...baseReady, loading: true })).toBeNull();
    expect(getSalaryCalcDisabledReason({
      ...baseReady,
      silentListRefreshing: true
    })).toBeNull();
  });

  it('returns NO_PROFILES when salary profiles are empty', () => {
    expect(getSalaryCalcDisabledReason({
      ...baseReady,
      salaryProfilesLength: 0,
      selectedConsultant: null,
      selectedPeriod: null
    })).toBe(SM_CALC_DISABLED.NO_PROFILES);
  });

  it('shows NEED_CONSULTANT when counselor is not selected (period selected)', () => {
    expect(getSalaryCalcDisabledReason({
      ...baseReady,
      selectedConsultant: null
    })).toBe(SM_CALC_DISABLED.NEED_CONSULTANT);
  });

  it('shows NEED_CONSULTANT_AND_PERIOD when neither counselor nor period is selected', () => {
    expect(getSalaryCalcDisabledReason({
      ...baseReady,
      selectedConsultant: null,
      selectedPeriod: null
    })).toBe(SM_CALC_DISABLED.NEED_CONSULTANT_AND_PERIOD);
  });

  it('shows NEED_PERIOD when only period is missing', () => {
    expect(getSalaryCalcDisabledReason({
      ...baseReady,
      selectedPeriod: null
    })).toBe(SM_CALC_DISABLED.NEED_PERIOD);
  });

  it('returns null when counselor and period are both selected', () => {
    expect(getSalaryCalcDisabledReason(baseReady)).toBeNull();
  });
});
