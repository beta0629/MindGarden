/**
 * QuickExpenseForm (나간 돈 기록) Clinic-OS 한글 UI 문자열
 * SSOT: docs/design-system/QUICK_EXPENSE_CLINIC_OS_CRITIC_PASS.md §4
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

export const QEF_MODAL_TITLE = '나간 돈 기록';
export const QEF_MODAL_SUBTITLE = '공통코드 카테고리만';

export const QEF_AMOUNT = {
  PLACEHOLDER: '금액 입력',
  HINT_VAT: '부가세 포함 금액(원)을 입력하세요.',
  HINT_SALARY: '금액(원)을 입력하세요. (급여는 부가세 없음)',
  INVALID: '올바른 금액을 입력해주세요.'
};

export const QEF_ACTIONS = {
  CANCEL: '취소',
  SUBMIT: '등록'
};

export const QEF_STAGE1_INFO =
  '버튼을 클릭하면 금액 입력창이 나타납니다 (부가세 포함 금액 입력)';

export const QEF_LOADING = {
  CODES: '공통 코드를 불러오는 중...'
};

export const QEF_ERRORS = {
  CODES_LOAD_FAILED: '공통 코드를 불러오는데 실패했습니다.',
  SUBMIT_FAILED: '지출 등록에 실패했습니다.',
  SUBMIT_ERROR: '지출 등록 중 오류가 발생했습니다.'
};

/** VAT 면제 카테고리 codeValue (공통코드 SSOT — 칩 하드코딩과 별개 분기) */
export const QEF_VAT_EXEMPT_CATEGORY_CODE = 'SALARY';
