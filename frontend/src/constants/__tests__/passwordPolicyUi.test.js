import {
  getFirstLoginPasswordViolationMessage,
  getLoginPasswordViolations,
  LOGIN_PASSWORD_MAX_LENGTH,
  LOGIN_PASSWORD_MIN_LENGTH
} from '../passwordPolicyUi';

describe('passwordPolicyUi', () => {
  it('rejects # as invalidCharacters (matches PasswordPolicy)', () => {
    const pwd = 'Abcdef12#';
    const v = getLoginPasswordViolations(pwd);
    expect(v[0].code).toBe('invalidCharacters');
    expect(getFirstLoginPasswordViolationMessage(pwd)).toBe(v[0].message);
  });

  it('passes Str0ng!Aa', () => {
    const pwd = 'Str0ng!Aa';
    expect(getLoginPasswordViolations(pwd)).toEqual([]);
    expect(getFirstLoginPasswordViolationMessage(pwd)).toBeNull();
  });

  it('rejects password substring as commonPattern', () => {
    const pwd = 'Valid1@XpasswordX';
    const v = getLoginPasswordViolations(pwd);
    expect(v[0].code).toBe('commonPattern');
  });

  it('rejects 123 sequence as consecutiveForbidden', () => {
    const pwd = 'Abcdef123@';
    const v = getLoginPasswordViolations(pwd);
    expect(v[0].code).toBe('consecutiveForbidden');
  });

  it('enforces min/max length', () => {
    expect(getLoginPasswordViolations('').length).toBe(1);
    expect(getLoginPasswordViolations('a'.repeat(LOGIN_PASSWORD_MIN_LENGTH - 1))[0].code).toBe('tooShort');
    expect(getLoginPasswordViolations('A'.repeat(LOGIN_PASSWORD_MAX_LENGTH + 1))[0].code).toBe('tooLong');
  });
});
