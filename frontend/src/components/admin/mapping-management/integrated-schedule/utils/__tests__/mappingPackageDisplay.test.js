/**
 * mappingPackageDisplay — FT/packageName SSOT (contract prepaid 무시)
 *
 * @author CoreSolution
 * @since 2026-09-15
 */

import { resolveMappingPackageDisplayName } from '../mappingPackageDisplay';

describe('mappingPackageDisplay', () => {
  it('IL keeps packageName 90,000 and ignores contract prepaid 100000', () => {
    const label = resolveMappingPackageDisplayName({
      paymentTiming: 'INSTITUTION_LINK',
      packageName: '단회기 90,000원',
      packagePrice: 90000,
      institutionLinkPrepaidAmount: 100000
    });
    expect(label).toBe('단회기 90,000원');
    expect(label).not.toContain('초기상담료');
    expect(label).not.toContain('100,000');
  });

  it('IL without packageName returns empty (no prepaid fallback)', () => {
    const label = resolveMappingPackageDisplayName({
      paymentTiming: 'INSTITUTION_LINK',
      institutionLinkPrepaidAmount: 100000
    });
    expect(label).toBe('');
  });

  it('regular single-session mapping keeps packageName', () => {
    const label = resolveMappingPackageDisplayName({
      paymentTiming: 'ADVANCE',
      packageName: '단회기 90,000원'
    });
    expect(label).toBe('단회기 90,000원');
  });

  it('null mapping returns empty', () => {
    expect(resolveMappingPackageDisplayName(null)).toBe('');
    expect(resolveMappingPackageDisplayName(undefined)).toBe('');
  });
});
