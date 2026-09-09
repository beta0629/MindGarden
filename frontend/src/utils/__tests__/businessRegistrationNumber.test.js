/**
 * 사업자등록번호 유틸 테스트
 */

import {
  BUSINESS_REGISTRATION_INVALID_MESSAGE,
  formatBusinessRegistrationNumber,
  isValidBusinessRegistrationNumber,
  isValidBusinessRegistrationNumberOrEmpty
} from '../businessRegistrationNumber';

describe('businessRegistrationNumber', () => {
  it('accepts checksum-valid numbers', () => {
    expect(isValidBusinessRegistrationNumber('120-81-47521')).toBe(true);
    expect(formatBusinessRegistrationNumber('1208147521')).toBe('120-81-47521');
  });

  it('rejects checksum-invalid numbers (fail-closed)', () => {
    expect(isValidBusinessRegistrationNumber('120-81-47522')).toBe(false);
    expect(isValidBusinessRegistrationNumberOrEmpty('120-81-47522')).toBe(false);
    expect(BUSINESS_REGISTRATION_INVALID_MESSAGE).toContain('사업자등록번호');
  });

  it('allows empty for optional path', () => {
    expect(isValidBusinessRegistrationNumberOrEmpty('')).toBe(true);
    expect(isValidBusinessRegistrationNumberOrEmpty(null)).toBe(true);
  });
});
