/**
 * 차량번호(선택) 정규화·검증 — 백엔드 VehiclePlateText / @VehiclePlateOptional과 정합
 */
import {
  normalizeVehiclePlateInput,
  isValidVehiclePlateOptional
} from '../validationUtils';

describe('normalizeVehiclePlateInput', () => {
  it('null·undefined는 빈 문자열', () => {
    expect(normalizeVehiclePlateInput(null)).toBe('');
    expect(normalizeVehiclePlateInput(undefined)).toBe('');
  });

  it('trim 및 연속 공백 축소', () => {
    expect(normalizeVehiclePlateInput('  12가  3456  ')).toBe('12가 3456');
  });

  it('영문 소문자는 대문자로', () => {
    expect(normalizeVehiclePlateInput('ab12-cd')).toBe('AB12-CD');
  });
});

describe('isValidVehiclePlateOptional', () => {
  it('null·빈 문자열·공백만은 true', () => {
    expect(isValidVehiclePlateOptional(null)).toBe(true);
    expect(isValidVehiclePlateOptional('')).toBe(true);
    expect(isValidVehiclePlateOptional('   ')).toBe(true);
  });

  it('한글·숫자·하이픈·공백 조합 유효', () => {
    expect(isValidVehiclePlateOptional('12가 3456')).toBe(true);
    expect(isValidVehiclePlateOptional('서울12AB')).toBe(true);
  });

  it('금지 문자는 false', () => {
    expect(isValidVehiclePlateOptional('12@34')).toBe(false);
    expect(isValidVehiclePlateOptional('12.34')).toBe(false);
  });

  it('33자 초과는 false', () => {
    expect(isValidVehiclePlateOptional('1'.repeat(33))).toBe(false);
  });
});
