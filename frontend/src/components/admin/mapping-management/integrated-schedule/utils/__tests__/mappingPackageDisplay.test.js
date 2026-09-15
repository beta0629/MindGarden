/**
 * mappingPackageDisplay — 기관연동 선납 표시 vs 일반 packageName
 *
 * @author CoreSolution
 * @since 2026-09-15
 */

import {
  formatPrepaidAmountWon,
  IL_PREPAID_PACKAGE_LABEL_PREFIX,
  resolveMappingPackageDisplayName
} from '../mappingPackageDisplay';

describe('mappingPackageDisplay', () => {
  it('formats prepaid amount as Korean won', () => {
    expect(formatPrepaidAmountWon(100000)).toBe('100,000원');
    expect(formatPrepaidAmountWon('100000')).toBe('100,000원');
    expect(formatPrepaidAmountWon(0)).toBeNull();
    expect(formatPrepaidAmountWon(null)).toBeNull();
  });

  it('IL + prepaidAmount → 초기상담료(선납), hides 단회기 packageName', () => {
    const label = resolveMappingPackageDisplayName({
      paymentTiming: 'INSTITUTION_LINK',
      packageName: '단회기 90,000원',
      packagePrice: 90000,
      institutionLinkPrepaidAmount: 100000
    });
    expect(label).toBe(`${IL_PREPAID_PACKAGE_LABEL_PREFIX} 100,000원`);
    expect(label).not.toContain('단회기');
    expect(label).not.toContain('90,000');
  });

  it('IL without prepaidAmount hides packageName', () => {
    const label = resolveMappingPackageDisplayName({
      paymentTiming: 'INSTITUTION_LINK',
      packageName: '단회기 90,000원'
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

  it('uses i18n template when t resolves', () => {
    const t = (key, opts) => {
      if (String(key).includes('prepaidInitialConsultation')) {
        return `초기상담료(선납) ${opts.amount}`;
      }
      return key;
    };
    const label = resolveMappingPackageDisplayName({
      clientEngagementType: 'INSTITUTION_LINK',
      institutionLinkPrepaidAmount: 100000,
      packageName: '단회기'
    }, t);
    expect(label).toBe('초기상담료(선납) 100,000원');
  });
});
