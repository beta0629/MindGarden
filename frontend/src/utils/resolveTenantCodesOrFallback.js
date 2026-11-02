/**
 * 테넌트 공통코드가 비었을 때 급여 상수 폴백을 쓰는 공통 헬퍼.
 * SalaryProfileFormModal·SalaryManagement 등에서 동일 규칙으로 사용한다.
 *
 * @author CoreSolution
 * @since 2026-11-02
 */

import {
  SALARY_TYPE,
  SALARY_TYPE_LABELS,
  SALARY_OPTION_TYPE,
  SALARY_OPTION_TYPE_LABELS,
  SALARY_PAY_DAY_FALLBACK_OPTIONS
} from '../constants/salaryConstants';
import { CONSULTANT_GRADE_TO_LABEL } from './consultantHelper';

/**
 * 테넌트/공통코드 목록이 비어 있으면 fallback 을 반환한다.
 *
 * @param {unknown} codes API·테넌트에서 받은 코드 목록
 * @param {Array<{codeValue: string, codeLabel?: string, codeName?: string}>} fallback
 * @returns {Array<{codeValue: string, codeLabel?: string, codeName?: string}>}
 */
export function resolveTenantCodesOrFallback(codes, fallback) {
  if (Array.isArray(codes) && codes.length > 0) {
    return codes;
  }
  return Array.isArray(fallback) ? fallback : [];
}

/**
 * salaryConstants.SALARY_TYPE / SALARY_TYPE_LABELS 단일 출처 폴백.
 * @returns {Array<{codeValue: string, codeLabel: string}>}
 */
export function buildSalaryTypeFallbackCodes() {
  return Object.values(SALARY_TYPE).map((codeValue) => ({
    codeValue,
    codeLabel: SALARY_TYPE_LABELS[codeValue] || codeValue
  }));
}

/**
 * salaryConstants.SALARY_OPTION_TYPE / LABELS 단일 출처 폴백.
 * @returns {Array<{codeValue: string, codeLabel: string, codeName: string}>}
 */
export function buildSalaryOptionTypeFallbackCodes() {
  return Object.values(SALARY_OPTION_TYPE).map((codeValue) => {
    const label = SALARY_OPTION_TYPE_LABELS[codeValue] || codeValue;
    return {
      codeValue,
      codeLabel: label,
      codeName: label
    };
  });
}

/**
 * CONSULTANT_GRADE_TO_LABEL 단일 출처 폴백 (등급표·셀렉트용).
 * @returns {Array<{codeValue: string, codeLabel: string}>}
 */
export function buildConsultantGradeFallbackCodes() {
  return Object.entries(CONSULTANT_GRADE_TO_LABEL).map(([codeValue, codeLabel]) => ({
    codeValue,
    codeLabel
  }));
}

/**
 * 급여 지급일 폴백 (salaryConstants.SALARY_PAY_DAY_FALLBACK_OPTIONS).
 * @returns {Array<{codeValue: string, codeLabel: string}>}
 */
export function buildSalaryPayDayFallbackCodes() {
  return SALARY_PAY_DAY_FALLBACK_OPTIONS.map((row) => ({
    codeValue: row.codeValue,
    codeLabel: row.codeLabel
  }));
}

/**
 * 선택값이 옵션 목록에 있는지 확인.
 *
 * @param {string} value
 * @param {Array<{codeValue?: string, value?: string}>} options
 * @returns {boolean}
 */
export function isCodeValueInOptions(value, options) {
  if (value == null || String(value).trim() === '') {
    return false;
  }
  const needle = String(value).trim();
  if (!Array.isArray(options) || options.length === 0) {
    return false;
  }
  return options.some((opt) => {
    const code = opt && (opt.codeValue != null ? opt.codeValue : opt.value);
    return code != null && String(code) === needle;
  });
}
