/**
 * 테넌트 공통코드 폴백 헬퍼 단위 테스트
 */
import {
  buildConsultantGradeFallbackCodes,
  buildSalaryOptionTypeFallbackCodes,
  buildSalaryPayDayFallbackCodes,
  buildSalaryTypeFallbackCodes,
  isCodeValueInOptions,
  resolveTenantCodesOrFallback
} from '../resolveTenantCodesOrFallback';
import { SALARY_TYPE, SALARY_TYPE_LABELS } from '../../constants/salaryConstants';
import { CONSULTANT_GRADE_TO_LABEL } from '../consultantHelper';

describe('resolveTenantCodesOrFallback', () => {
  test('빈 배열이면 fallback 을 반환한다', () => {
    const fallback = buildSalaryTypeFallbackCodes();
    expect(resolveTenantCodesOrFallback([], fallback)).toEqual(fallback);
    expect(resolveTenantCodesOrFallback(null, fallback)).toEqual(fallback);
    expect(resolveTenantCodesOrFallback(undefined, fallback)).toEqual(fallback);
  });

  test('테넌트 코드가 있으면 그대로 쓴다', () => {
    const codes = [{ codeValue: 'FREELANCE', codeLabel: '프리랜서(테넌트)' }];
    expect(resolveTenantCodesOrFallback(codes, buildSalaryTypeFallbackCodes())).toEqual(codes);
  });

  test('SALARY_TYPE 폴백은 salaryConstants 단일 출처', () => {
    const fallback = buildSalaryTypeFallbackCodes();
    expect(fallback).toEqual(
      expect.arrayContaining([
        { codeValue: SALARY_TYPE.FREELANCE, codeLabel: SALARY_TYPE_LABELS.FREELANCE },
        { codeValue: SALARY_TYPE.REGULAR, codeLabel: SALARY_TYPE_LABELS.REGULAR }
      ])
    );
  });

  test('옵션·지급일·등급 폴백도 비지 않는다', () => {
    expect(buildSalaryOptionTypeFallbackCodes().length).toBeGreaterThan(0);
    expect(buildSalaryPayDayFallbackCodes().length).toBeGreaterThan(0);
    const grades = buildConsultantGradeFallbackCodes();
    expect(grades.length).toBe(Object.keys(CONSULTANT_GRADE_TO_LABEL).length);
  });

  test('isCodeValueInOptions: 빈 값·미포함은 false', () => {
    const opts = buildSalaryTypeFallbackCodes();
    expect(isCodeValueInOptions('', opts)).toBe(false);
    expect(isCodeValueInOptions('HOURLY', opts)).toBe(false);
    expect(isCodeValueInOptions('FREELANCE', opts)).toBe(true);
  });
});
