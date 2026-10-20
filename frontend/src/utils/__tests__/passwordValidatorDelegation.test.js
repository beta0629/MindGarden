/**
 * 예전 비밀번호 검증 export(common.isValidPassword · validationUtils.validatePassword ·
 * generateMgLoginPassword 의 선택 입력 게이트)는 단일 정책 함수에 위임만 한다.
 * 서버 PasswordPolicy 와 같은 픽스처로 결과가 getLoginPasswordViolationCode 와 같은지 고정한다.
 */
import fs from 'fs';
import path from 'path';
import { isValidPassword } from '../common';
import { validatePassword, validateForm } from '../validationUtils';
import { formatPasswordPolicyError, getLoginPasswordViolationCode } from '../loginPasswordPolicy';
import { isMgLoginPasswordCompliant, shouldBlockOptionalMgLoginPassword } from '../generateMgLoginPassword';
import { PASSWORD_INPUT_ERROR } from '../../constants/passwordPolicyUi';

const FIXTURE_PATH = path.resolve(
  __dirname,
  '../../../../src/test/resources/password-policy/login-password-policy-parity.json'
);

const fixture = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));

const casePassword = (c) => (c.repeat ? c.repeat.unit.repeat(c.repeat.times) : c.password);

const nonBlankCases = fixture.cases.filter((c) => casePassword(c) !== '');

describe('비밀번호 검증 export 는 단일 정책 함수에 위임', () => {
  test.each(fixture.cases.map((c) => [c.code, c]))('%s', (code, c) => {
    const pwd = casePassword(c);
    expect(getLoginPasswordViolationCode(pwd)).toBe(code);
    expect(isValidPassword(pwd)).toBe(code === null);
    expect(isMgLoginPasswordCompliant(pwd)).toBe(code === null);
  });

  test.each(nonBlankCases.map((c) => [c.code, c]))('validationUtils.validatePassword %s', (code, c) => {
    const result = validatePassword(casePassword(c));
    expect(result.isValid).toBe(code === null);
    expect(result.errors).toEqual(code === null ? [] : [formatPasswordPolicyError(code)]);
  });

  test.each(nonBlankCases.map((c) => [c.code, c]))('선택 입력 게이트 %s', (code, c) => {
    expect(shouldBlockOptionalMgLoginPassword(casePassword(c))).toBe(code !== null);
  });

  test('빈 값: 필수 검증은 입력 요청, 선택 입력 게이트는 통과', () => {
    expect(isValidPassword('')).toBe(false);
    expect(validatePassword('')).toEqual({
      isValid: false,
      errors: [formatPasswordPolicyError(PASSWORD_INPUT_ERROR.REQUIRED)]
    });
    expect(shouldBlockOptionalMgLoginPassword('   ')).toBe(false);
  });

  test('화면 옵션으로 정책을 느슨하게 할 수 없다(minLength 등 무시)', () => {
    const weak = 'abcdefgh';
    expect(validatePassword(weak, { minLength: 1, requireUppercase: false }).isValid).toBe(false);
    const formResult = validateForm({ pw: weak }, { pw: { type: 'password', minLength: 1 } });
    expect(formResult.isValid).toBe(false);
  });
});
