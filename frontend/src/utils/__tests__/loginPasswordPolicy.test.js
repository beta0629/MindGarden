import '../../i18n';
import {
  formatPasswordPolicyError,
  getFirstLoginPasswordViolationMessage,
  getPasswordPolicyHint,
  validatePasswordPolicyInput
} from '../loginPasswordPolicy';
import { LOGIN_PASSWORD_VIOLATION, PASSWORD_INPUT_ERROR } from '../../constants/passwordPolicyUi';

const NO_UPPERCASE = 'noupper1!x';
const COMPLIANT = 'Fake7!Qzm';

describe('validatePasswordPolicyInput', () => {
  test('필수 입력: 빈 값은 required', () => {
    expect(validatePasswordPolicyInput('')).toEqual({
      valid: false, errorCode: PASSWORD_INPUT_ERROR.REQUIRED, confirmErrorCode: null
    });
    expect(validatePasswordPolicyInput('   ').errorCode).toBe(PASSWORD_INPUT_ERROR.REQUIRED);
  });

  test('allowEmpty: 빈 값·공백은 통과, 값이 있으면 정책 검사', () => {
    expect(validatePasswordPolicyInput('', { allowEmpty: true }).valid).toBe(true);
    expect(validatePasswordPolicyInput('  ', { allowEmpty: true }).valid).toBe(true);
    expect(validatePasswordPolicyInput(null, { allowEmpty: true }).valid).toBe(true);
    expect(validatePasswordPolicyInput(NO_UPPERCASE, { allowEmpty: true }).errorCode)
      .toBe(LOGIN_PASSWORD_VIOLATION.UPPERCASE_REQUIRED);
  });

  test('확인 입력: 누락·불일치·일치', () => {
    expect(validatePasswordPolicyInput(COMPLIANT, { requireConfirm: true, confirmValue: '' }).confirmErrorCode)
      .toBe(PASSWORD_INPUT_ERROR.CONFIRM_REQUIRED);
    expect(validatePasswordPolicyInput(COMPLIANT, { requireConfirm: true, confirmValue: 'Other7!Qzm' })
      .confirmErrorCode).toBe(PASSWORD_INPUT_ERROR.CONFIRM_MISMATCH);
    expect(validatePasswordPolicyInput(COMPLIANT, { requireConfirm: true, confirmValue: COMPLIANT }).valid)
      .toBe(true);
  });

  test('allowEmpty + 확인 입력: 둘 다 비면 통과', () => {
    expect(validatePasswordPolicyInput('', { allowEmpty: true, requireConfirm: true, confirmValue: '' }).valid)
      .toBe(true);
  });
});

describe('문구(i18n)', () => {
  test('정책 위반은 사유 + 전체 안내', () => {
    const msg = formatPasswordPolicyError(LOGIN_PASSWORD_VIOLATION.UPPERCASE_REQUIRED);
    expect(msg).toContain('대문자를 포함해야');
    expect(msg).toContain('소문자');
    expect(msg).toContain('@$!%*?&');
    expect(msg).not.toContain('{{');
  });

  test('입력 오류는 사유만', () => {
    expect(formatPasswordPolicyError(PASSWORD_INPUT_ERROR.CONFIRM_MISMATCH)).toBe('비밀번호가 일치하지 않습니다.');
    expect(formatPasswordPolicyError(null)).toBe('');
  });

  test('첫 위반 문구는 서버 문구와 같은 사유', () => {
    expect(getFirstLoginPasswordViolationMessage(NO_UPPERCASE)).toBe('비밀번호는 최소 1개의 대문자를 포함해야 합니다.');
    expect(getFirstLoginPasswordViolationMessage(COMPLIANT)).toBeNull();
  });

  test('allowEmpty 힌트는 임시 비밀번호 안내를 붙인다', () => {
    expect(getPasswordPolicyHint(undefined, { allowEmpty: true })).toContain('임시 비밀번호');
    expect(getPasswordPolicyHint()).not.toContain('임시 비밀번호');
  });
});
