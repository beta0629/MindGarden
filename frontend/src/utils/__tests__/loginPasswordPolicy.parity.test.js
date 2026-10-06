/**
 * 로그인 비밀번호 정책 FE·BE 동일성 — BE PasswordPolicyParityFixtureTest 와 같은 픽스처를 쓴다.
 */
import fs from 'fs';
import path from 'path';
import {
  LOGIN_PASSWORD_ALLOWED_SPECIALS,
  LOGIN_PASSWORD_COMMON_SUBSTRINGS,
  LOGIN_PASSWORD_MAX_LENGTH,
  LOGIN_PASSWORD_MIN_LENGTH
} from '../../constants/passwordPolicyUi';
import { getLoginPasswordViolationCode } from '../loginPasswordPolicy';
import { generateMgLoginPassword, isMgLoginPasswordCompliant } from '../generateMgLoginPassword';
import { webcrypto } from 'crypto';

const FIXTURE_PATH = path.resolve(
  __dirname,
  '../../../../src/test/resources/password-policy/login-password-policy-parity.json'
);

const fixture = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));

const casePassword = (c) => (c.repeat ? c.repeat.unit.repeat(c.repeat.times) : c.password);

beforeAll(() => {
  if (!global.crypto) {
    global.crypto = webcrypto;
  }
});

describe('loginPasswordPolicy ↔ 서버 PasswordPolicy 픽스처', () => {
  test('상수가 픽스처(서버 값)와 같다', () => {
    expect(LOGIN_PASSWORD_MIN_LENGTH).toBe(fixture.minLength);
    expect(LOGIN_PASSWORD_MAX_LENGTH).toBe(fixture.maxLength);
    expect(LOGIN_PASSWORD_ALLOWED_SPECIALS).toBe(fixture.allowedSpecials);
    expect([...LOGIN_PASSWORD_COMMON_SUBSTRINGS]).toEqual(fixture.commonSubstrings);
  });

  test.each(fixture.cases.map((c) => [casePassword(c).length, c.code, c]))(
    'len=%i → %s',
    (_len, code, c) => {
      expect(getLoginPasswordViolationCode(casePassword(c))).toBe(code);
      expect(isMgLoginPasswordCompliant(casePassword(c))).toBe(code === null);
    }
  );

  test('생성 비밀번호는 항상 정책을 통과한다', () => {
    for (let i = 0; i < 50; i += 1) {
      const pwd = generateMgLoginPassword();
      expect(getLoginPasswordViolationCode(pwd)).toBeNull();
    }
  });
});
