/**
 * 급여 관리 「계산하기」 비활성 사유 힌트 — 문자열·헬퍼 단위 테스트
 *
 * @author CoreSolution
 * @since 2026-09-07
 */

import {
  SM_CALC_DISABLED,
  getSalaryCalcDisabledReason
} from '../salaryManagementClinicOsStrings';

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
