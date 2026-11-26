/**
 * mappingSessionCountInvariant — BE MappingSessionCountInvariant 미러 단위 테스트.
 */

import { MAPPING_SESSION_COUNT_MESSAGES } from '../../constants/mappingSessionCountMessages';
import {
  deriveRemainingFromTotalAndUsed,
  deriveUsedFromTotalAndRemaining,
  nullToZero,
  validateInvariant,
  validateRemainingAgainstTotal,
  validateTotalSessionsAgainstUsed
} from '../mappingSessionCountInvariant';

describe('mappingSessionCountInvariant', () => {
  test('nullToZero', () => {
    expect(nullToZero(null)).toBe(0);
    expect(nullToZero(undefined)).toBe(0);
    expect(nullToZero('')).toBe(0);
    expect(nullToZero(5)).toBe(5);
  });

  test('validateInvariant — hold / mismatch / negative', () => {
    expect(validateInvariant(10, 2, 8)).toBeNull();
    expect(validateInvariant(null, null, null)).toBeNull();
    expect(validateInvariant(10, 2, 5)).toBe(MAPPING_SESSION_COUNT_MESSAGES.MISMATCH);
    expect(validateInvariant(5, 6, -1)).toBe(MAPPING_SESSION_COUNT_MESSAGES.NEGATIVE);
  });

  test('validateTotalSessionsAgainstUsed', () => {
    expect(validateTotalSessionsAgainstUsed(10, 2)).toBeNull();
    expect(validateTotalSessionsAgainstUsed(2, 2)).toBeNull();
    expect(validateTotalSessionsAgainstUsed(1, 2)).toBe(
      MAPPING_SESSION_COUNT_MESSAGES.TOTAL_LESS_THAN_USED
    );
    expect(validateTotalSessionsAgainstUsed(-1, 0)).toBe(
      MAPPING_SESSION_COUNT_MESSAGES.TOTAL_NEGATIVE
    );
  });

  test('validateRemainingAgainstTotal', () => {
    expect(validateRemainingAgainstTotal(10, 5)).toBeNull();
    expect(validateRemainingAgainstTotal(10, 11)).toBe(
      MAPPING_SESSION_COUNT_MESSAGES.REMAINING_EXCEEDS_TOTAL
    );
    expect(validateRemainingAgainstTotal(10, -1)).toBe(
      MAPPING_SESSION_COUNT_MESSAGES.REMAINING_NEGATIVE
    );
  });

  test('deriveUsedFromTotalAndRemaining / deriveRemainingFromTotalAndUsed', () => {
    expect(deriveUsedFromTotalAndRemaining(10, 5)).toBe(5);
    expect(deriveRemainingFromTotalAndUsed(15, 2)).toBe(13);
    expect(() => deriveUsedFromTotalAndRemaining(10, 11)).toThrow(
      MAPPING_SESSION_COUNT_MESSAGES.REMAINING_EXCEEDS_TOTAL
    );
    expect(() => deriveRemainingFromTotalAndUsed(1, 2)).toThrow(
      MAPPING_SESSION_COUNT_MESSAGES.TOTAL_LESS_THAN_USED
    );
  });
});
