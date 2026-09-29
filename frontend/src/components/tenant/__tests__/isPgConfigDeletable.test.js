/**
 * isPgConfigDeletable unit tests
 *
 * @author CoreSolution
 * @since 2026-03-22
 */

import { isPgConfigDeletable } from '../pgConfigurationListUtils';

describe('isPgConfigDeletable', () => {
  test('returns false for ACTIVE', () => {
    expect(isPgConfigDeletable({ status: 'ACTIVE' })).toBe(false);
  });

  test('returns true for PENDING', () => {
    expect(isPgConfigDeletable({ status: 'PENDING' })).toBe(true);
  });

  test('returns true for REJECTED', () => {
    expect(isPgConfigDeletable({ status: 'REJECTED' })).toBe(true);
  });

  test('returns true for INACTIVE', () => {
    expect(isPgConfigDeletable({ status: 'INACTIVE' })).toBe(true);
  });

  test('returns true for APPROVED', () => {
    expect(isPgConfigDeletable({ status: 'APPROVED' })).toBe(true);
  });

  test('returns false for null/undefined', () => {
    expect(isPgConfigDeletable(null)).toBe(false);
    expect(isPgConfigDeletable(undefined)).toBe(false);
  });
});
