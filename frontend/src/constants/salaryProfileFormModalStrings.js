/**
 * SalaryProfileFormModal 사용자 노출 한글 UI 문자열
 * (OPS-02 에픽 — 단일 파일 상수 분리)
 */

/** 급여 옵션 유형 코드 → 한글 라벨 (옵션 유형 선택 드롭다운 표시용) */
export const SPFM_OPTION_TYPE_LABELS = {
  FAMILY_CONSULTATION: '가족상담',
  INITIAL_CONSULTATION: '초기상담',
  WEEKEND_CONSULTATION: '주말상담',
  ONLINE_CONSULTATION: '온라인상담',
  PHONE_CONSULTATION: '전화상담',
  TRAUMA_CONSULTATION: '트라우마상담'
};

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
  BUSINESS_REG_OPTION_GENERAL: '일반 프리랜서 (3.3% 원천징수만)',
  BUSINESS_REG_OPTION_REGISTERED: '사업자 등록 프리랜서 (3.3% 원천징수 + 10% 부가세)',
  PLACEHOLDER_SELECT: '선택하세요',
  TAX_INFO_GENERAL_LINE: '• 일반 프리랜서: 원천징수 3.3%만 적용',
  TAX_INFO_BUSINESS_LINE: '• 사업자 등록: 원천징수 3.3% + 부가세 10% 적용',
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
  GRADE_OPTION_DESC_EXTRA: (additionalAmount) =>
    `등급별 추가 금액: +${additionalAmount.toLocaleString()}원 (기본 + ${additionalAmount}원)`,
  GRADE_OPTION_DESC_BASE: '기본 옵션 금액'
};

/** 등급 한글명 폴백 (공통코드 조회 실패 시 표시) */
export const SPFM_GRADE_KO_FALLBACK = {
  CONSULTANT_JUNIOR: '주니어 상담사',
  CONSULTANT_SENIOR: '시니어 상담사',
  CONSULTANT_EXPERT: '엑스퍼트 상담사',
  CONSULTANT_MASTER: '마스터 상담사'
};

/** 급여 유형 공통코드 없을 때 폴백 */
export const SPFM_SALARY_TYPE_FALLBACK = [
  { codeValue: 'FREELANCE', codeLabel: '프리랜서' },
  { codeValue: 'REGULAR', codeLabel: '정규직' }
];

/** 옵션 유형 공통코드 없을 때 폴백 */
export const SPFM_OPTION_TYPE_FALLBACK = [
  { codeValue: 'FAMILY_CONSULTATION', codeName: '가족상담', codeLabel: '가족상담', codeDescription: '가족상담 시 추가 급여' },
  { codeValue: 'INITIAL_CONSULTATION', codeName: '초기상담', codeLabel: '초기상담', codeDescription: '초기상담 시 추가 급여' },
  { codeValue: 'WEEKEND_CONSULTATION', codeName: '주말상담', codeLabel: '주말상담', codeDescription: '주말상담 시 추가 급여' },
  { codeValue: 'ONLINE_CONSULTATION', codeName: '온라인상담', codeLabel: '온라인상담', codeDescription: '온라인상담 시 추가 급여' },
  { codeValue: 'PHONE_CONSULTATION', codeName: '전화상담', codeLabel: '전화상담', codeDescription: '전화상담 시 추가 급여' },
  { codeValue: 'TRAUMA_CONSULTATION', codeName: '트라우마상담', codeLabel: '트라우마상담', codeDescription: '트라우마상담 시 추가 급여' }
];

const F = SPFM_OPTION_TYPE_LABELS.FAMILY_CONSULTATION;
const I = SPFM_OPTION_TYPE_LABELS.INITIAL_CONSULTATION;

/** 등급표 API 폴백 데이터 (사용자 표시용 이름·옵션명) */
export const SPFM_GRADE_TABLE_FALLBACK_ROWS = [
  { code: 'CONSULTANT_JUNIOR', name: '주니어', baseSalary: 30000, multiplier: 1, level: 1, options: [{ type: 'FAMILY_CONSULTATION', name: F, amount: 3000 }, { type: 'INITIAL_CONSULTATION', name: I, amount: 5000 }] },
  { code: 'CONSULTANT_SENIOR', name: '시니어', baseSalary: 35000, multiplier: 2, level: 2, options: [{ type: 'FAMILY_CONSULTATION', name: F, amount: 3600 }, { type: 'INITIAL_CONSULTATION', name: I, amount: 6000 }] },
  { code: 'CONSULTANT_EXPERT', name: '엑스퍼트', baseSalary: 40000, multiplier: 3, level: 3, options: [{ type: 'FAMILY_CONSULTATION', name: F, amount: 4200 }, { type: 'INITIAL_CONSULTATION', name: I, amount: 7000 }] },
  { code: 'CONSULTANT_MASTER', name: '마스터', baseSalary: 45000, multiplier: 4, level: 4, options: [{ type: 'FAMILY_CONSULTATION', name: F, amount: 4800 }, { type: 'INITIAL_CONSULTATION', name: I, amount: 8000 }] }
];
