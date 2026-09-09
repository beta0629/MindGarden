/**
 * 사업자등록번호 유틸 테스트
 */

import {
  BUSINESS_REGISTRATION_INVALID_MESSAGE,
  BUSINESS_REGISTRATION_SAVE_BLOCKED_MESSAGE,
  formatBusinessRegistrationNumber,
  isBusinessRegistrationApiError,
  isValidBusinessRegistrationNumber,
  isValidBusinessRegistrationNumberOrEmpty,
  resolveBizSaveErrorMessage
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

  it('save-blocked message names 사업자등록번호 exactly', () => {
    expect(BUSINESS_REGISTRATION_SAVE_BLOCKED_MESSAGE).toContain('사업자등록번호');
    expect(BUSINESS_REGISTRATION_SAVE_BLOCKED_MESSAGE).toBe(
      '사업자등록번호가 올바르지 않아 저장할 수 없습니다.'
    );
  });

  it('maps BE biz-invalid API errors to save-blocked copy', () => {
    expect(isBusinessRegistrationApiError(BUSINESS_REGISTRATION_INVALID_MESSAGE)).toBe(true);
    expect(
      resolveBizSaveErrorMessage({
        response: { data: { message: BUSINESS_REGISTRATION_INVALID_MESSAGE } }
      })
    ).toBe(BUSINESS_REGISTRATION_SAVE_BLOCKED_MESSAGE);
    expect(resolveBizSaveErrorMessage({ message: '네트워크 오류' })).toBeNull();
  });
});
