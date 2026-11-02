/**
 * SalaryProfileFormModal 사용자 노출 한글 UI 문자열
 * (OPS-02 에픽 — 단일 파일 상수 분리)
 */

import { CONSULTANT_GRADE_TO_LABEL } from '../utils/consultantHelper';
import {
  SALARY_OPTION_TYPE_LABELS,
  SALARY_TYPE,
  SALARY_TYPE_LABELS
} from './salaryConstants';
import {
  buildConsultantGradeFallbackCodes,
  buildSalaryOptionTypeFallbackCodes,
  buildSalaryTypeFallbackCodes
} from '../utils/resolveTenantCodesOrFallback';

/** 급여 옵션 유형 코드 → 한글 라벨 (salaryConstants 단일 출처) */
export const SPFM_OPTION_TYPE_LABELS = SALARY_OPTION_TYPE_LABELS;

export const SPFM = {
  OPTION_TYPE_PLACEHOLDER: '옵션 유형 선택',
  CURRENCY_UNIT: '원',
  MODAL_TITLE_EDIT_PREFIX: '급여 프로필 수정 - ',
  MODAL_TITLE_CREATE_PREFIX: '급여 프로필 생성 - ',
  LOADING_INLINE: '데이터를 불러오는 중...',
  SECTION_CONSULTANT_INFO: '상담사 정보',
  LABEL_NAME: '이름:',
  LABEL_CURRENT_GRADE: '현재 등급:',
  GRADE_LOADING: '조회 중...',
  LABEL_BASE_SALARY_INFO: '기본 급여:',
  EM_DASH: '—',
  LABEL_CONSULTANT_GRADE: '상담사 등급',
  GRADE_SELECT_LABEL: '상담사 등급 선택',
  GRADE_CHANGE_HELP: '등급을 변경하면 기본 급여와 옵션 금액이 자동으로 업데이트됩니다.',
  LABEL_GRADE_TABLE: '상담사 등급표',
  TABLE_COL_GRADE: '등급',
  TABLE_COL_BASE_SALARY: '기본급여',
  TABLE_COL_FAMILY: '가족상담',
  TABLE_COL_INITIAL: '초기상담',
  TABLE_COL_EXTRA: '추가금액',
  BADGE_SELECTED: '선택됨',
  GRADE_NOTICE_TITLE: '등급별 급여 체계:',
  GRADE_NOTICE_LINE1: '• 기본 급여: 등급별 차등 지급',
  GRADE_NOTICE_LINE2: '• 옵션 금액: 등급이 올라갈수록 2,000원씩 추가',
  GRADE_NOTICE_LINE3: '• 주니어: 기본 옵션 금액',
  GRADE_NOTICE_LINE4: '• 시니어 이상: 기본 + (등급-1) × 2,000원',
  LABEL_SALARY_TYPE: '급여 유형',
  SALARY_TYPE_PLACEHOLDER: '급여 유형 선택',
  LABEL_BASE_SALARY_INPUT: '기본 급여 (원)',
  PLACEHOLDER_BASE_SALARY: '기본 급여를 입력하세요',
  LABEL_BUSINESS_REG: '사업자 등록 여부',
  BUSINESS_REG_OPTION_GENERAL: '일반 프리랜서 (국세 3% + 지방세 0.3% 원천징수만)',
  BUSINESS_REG_OPTION_REGISTERED: '사업자 등록 프리랜서 (국세 3% + 지방세 0.3% 원천징수 + 10% 부가세)',
  PLACEHOLDER_SELECT: '선택하세요',
  TAX_INFO_GENERAL_LINE: '• 일반 프리랜서: 원천징수 국세 3% + 지방세 0.3%만 적용',
  TAX_INFO_BUSINESS_LINE: '• 사업자 등록: 원천징수 국세 3% + 지방세 0.3% + 부가세 10% 적용',
  LABEL_BIZ_REG_NO: '사업자 등록번호 *',
  PLACEHOLDER_BIZ_REG_NO: '123-45-67890',
  HELP_BIZ_REG_NO: '사업자 등록번호를 입력하세요 (예: 123-45-67890)',
  LABEL_BIZ_NAME: '사업자명 *',
  PLACEHOLDER_BIZ_NAME: '사업자명을 입력하세요',
  HELP_BIZ_NAME: '사업자 등록증에 기재된 사업자명을 입력하세요',
  LABEL_CONTRACT: '계약 조건',
  PLACEHOLDER_CONTRACT: '계약 조건을 입력하세요',
  LABEL_SALARY_OPTIONS: '급여 옵션 (등급별 자동 추가됨)',
  BTN_ADD_OPTION: '+ 옵션 추가',
  PLACEHOLDER_AMOUNT: '금액',
  PLACEHOLDER_OPTION_NAME: '옵션명',
  BTN_DELETE: '삭제',
  BTN_CANCEL: '취소',
  BTN_SAVE: '저장',
  TOAST_LOAD_FAILED: '데이터를 불러오는데 실패했습니다.',
  TOAST_GRADE_UPDATED: '상담사 등급이 업데이트되었습니다.',
  TOAST_GRADE_UPDATE_FAILED: '등급 업데이트에 실패했습니다.',
  TOAST_BIZ_NO_REQUIRED: '사업자 등록번호를 입력해주세요.',
  TOAST_BIZ_NO_INVALID: '사업자 등록번호 형식이 올바르지 않습니다. (예: 123-45-67890)',
  TOAST_BIZ_NAME_REQUIRED: '사업자명을 입력해주세요.',
  TOAST_PROFILE_UPDATED: '급여 프로필이 수정되었습니다.',
  TOAST_PROFILE_CREATED: '급여 프로필이 성공적으로 생성되었습니다.',
  TOAST_PROFILE_UPDATE_FAILED: '급여 프로필 수정에 실패했습니다.',
  TOAST_PROFILE_CREATE_FAILED: '급여 프로필 생성에 실패했습니다.',
  TOAST_SALARY_TYPE_REQUIRED: '급여 유형을 선택해 주세요.',
  TOAST_SALARY_TYPE_INVALID: '허용되지 않은 급여 유형입니다. 다시 선택해 주세요.',
  GRADE_OPTION_DESC_EXTRA: (additionalAmount) =>
    `등급별 추가 금액: +${additionalAmount.toLocaleString()}원 (기본 + ${additionalAmount}원)`,
  GRADE_OPTION_DESC_BASE: '기본 옵션 금액'
};

/** 등급 한글명 폴백 (consultantHelper.CONSULTANT_GRADE_TO_LABEL 단일 출처) */
export const SPFM_GRADE_KO_FALLBACK = CONSULTANT_GRADE_TO_LABEL;

/** 급여 유형 공통코드 없을 때 폴백 (salaryConstants 단일 출처) */
export const SPFM_SALARY_TYPE_FALLBACK = buildSalaryTypeFallbackCodes();

/** 옵션 유형 공통코드 없을 때 폴백 (salaryConstants 단일 출처) */
export const SPFM_OPTION_TYPE_FALLBACK = buildSalaryOptionTypeFallbackCodes();

const F = SPFM_OPTION_TYPE_LABELS.FAMILY_CONSULTATION;
const I = SPFM_OPTION_TYPE_LABELS.INITIAL_CONSULTATION;

/**
 * 등급표 API 폴백 데이터.
 * 라벨은 CONSULTANT_GRADE_TO_LABEL, 옵션명은 salaryConstants 단일 출처.
 */
export const SPFM_GRADE_TABLE_FALLBACK_ROWS = buildConsultantGradeFallbackCodes().map((row, index) => {
  const level = index + 1;
  const shortName = (row.codeLabel || row.codeValue || '').replace(/\s*상담사$/, '') || row.codeValue;
  return {
    code: row.codeValue,
    name: shortName,
    baseSalary: 30000 + (level - 1) * 5000,
    multiplier: level,
    level,
    options: [
      { type: 'FAMILY_CONSULTATION', name: F, amount: Math.round(3000 * (1 + (level - 1) * 0.2)) },
      { type: 'INITIAL_CONSULTATION', name: I, amount: Math.round(5000 * (1 + (level - 1) * 0.2)) }
    ]
  };
});

/** 기본 급여 유형 (옵션에 있을 때만 사용) */
export const SPFM_DEFAULT_SALARY_TYPE = SALARY_TYPE.FREELANCE;

/** 급여 유형 라벨 맵 재수출 (폼 검증·표시) */
export const SPFM_SALARY_TYPE_LABELS = SALARY_TYPE_LABELS;
