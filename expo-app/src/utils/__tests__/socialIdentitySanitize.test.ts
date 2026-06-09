import {
  readSocialIdentityOptional,
  sanitizeSocialIdentityString,
} from '../socialIdentitySanitize';

/**
 * P1 회귀 — 카카오 간편가입 화면 "이름(표시명)" 필드에 "null" 문자열이 노출되는 사고 차단.
 *
 * SDK·BE 응답에서 nickname/name 이 null·undefined 일 때 일부 직렬화 경로(객체→URLSearchParams 등)에서
 * "null"/"undefined" 리터럴로 변환되어 입력 필드에 그대로 표시되는 사고를 막는다.
 *
 * @author MindGarden
 * @since 2026-06-09
 */
describe('sanitizeSocialIdentityString', () => {
  it('정상 닉네임은 trim 결과를 그대로 반환한다', () => {
    expect(sanitizeSocialIdentityString('홍길동')).toBe('홍길동');
    expect(sanitizeSocialIdentityString('  fanyjk  ')).toBe('fanyjk');
  });

  it('빈 문자열·공백은 빈 문자열로 정리된다', () => {
    expect(sanitizeSocialIdentityString('')).toBe('');
    expect(sanitizeSocialIdentityString('   ')).toBe('');
  });

  it('"null"/"undefined" 리터럴(대소문자 무관)은 빈 문자열로 정리된다', () => {
    expect(sanitizeSocialIdentityString('null')).toBe('');
    expect(sanitizeSocialIdentityString('NULL')).toBe('');
    expect(sanitizeSocialIdentityString(' Null ')).toBe('');
    expect(sanitizeSocialIdentityString('undefined')).toBe('');
    expect(sanitizeSocialIdentityString('UNDEFINED')).toBe('');
  });

  it('string 이 아닌 값은 빈 문자열로 정리된다', () => {
    expect(sanitizeSocialIdentityString(null)).toBe('');
    expect(sanitizeSocialIdentityString(undefined)).toBe('');
    expect(sanitizeSocialIdentityString(123)).toBe('');
    expect(sanitizeSocialIdentityString({})).toBe('');
    expect(sanitizeSocialIdentityString([])).toBe('');
  });

  it('"null" 을 포함한 정상 단어는 그대로 유지된다', () => {
    expect(sanitizeSocialIdentityString('nullable')).toBe('nullable');
    expect(sanitizeSocialIdentityString('mynull')).toBe('mynull');
  });
});

describe('readSocialIdentityOptional', () => {
  it('정상 문자열은 trim 결과를 반환한다', () => {
    expect(readSocialIdentityOptional('홍길동')).toBe('홍길동');
  });

  it('"null"/"undefined" 리터럴과 빈 값은 undefined 를 반환한다', () => {
    expect(readSocialIdentityOptional('null')).toBeUndefined();
    expect(readSocialIdentityOptional('undefined')).toBeUndefined();
    expect(readSocialIdentityOptional('')).toBeUndefined();
    expect(readSocialIdentityOptional(null)).toBeUndefined();
  });
});
