import {
  isMgLoginPasswordCompliant,
  shouldBlockOptionalMgLoginPassword
} from '../generateMgLoginPassword';

describe('상담사 등록 선택 비밀번호 제출 게이트', () => {
  test('대문자 없는 비밀번호는 제출을 막는다', () => {
    expect(isMgLoginPasswordCompliant('abcd1234!')).toBe(false);
    expect(shouldBlockOptionalMgLoginPassword('abcd1234!')).toBe(true);
  });

  test('빈 비밀번호와 공백은 통과한다', () => {
    expect(shouldBlockOptionalMgLoginPassword('')).toBe(false);
    expect(shouldBlockOptionalMgLoginPassword('   ')).toBe(false);
    expect(shouldBlockOptionalMgLoginPassword(null)).toBe(false);
  });

  test('정책을 만족하는 비밀번호는 통과한다', () => {
    const compliant = 'Aa1!qzxm';
    expect(isMgLoginPasswordCompliant(compliant)).toBe(true);
    expect(shouldBlockOptionalMgLoginPassword(compliant)).toBe(false);
  });
});