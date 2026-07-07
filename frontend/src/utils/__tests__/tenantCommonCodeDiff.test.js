/**
 * tenantCommonCodeDiff 유틸 테스트
 */
import {
  resolveTenantCodeOverrideStatus,
  buildTenantGlobalDiffRows,
  getOverrideStatusLabel
} from '../tenantCommonCodeDiff';

describe('tenantCommonCodeDiff', () => {
  test('resolveTenantCodeOverrideStatus — 글로벌 없으면 tenant_only', () => {
    expect(resolveTenantCodeOverrideStatus({ codeValue: 'A' }, null)).toBe('tenant_only');
  });

  test('resolveTenantCodeOverrideStatus — 동일하면 global_match', () => {
    const row = { codeValue: 'A', codeLabel: '라벨', isActive: true };
    expect(resolveTenantCodeOverrideStatus(row, { ...row })).toBe('global_match');
  });

  test('resolveTenantCodeOverrideStatus — 다르면 override', () => {
    expect(resolveTenantCodeOverrideStatus(
      { codeValue: 'A', codeLabel: '테넌트' },
      { codeValue: 'A', codeLabel: '글로벌' }
    )).toBe('override');
  });

  test('buildTenantGlobalDiffRows marks changed fields', () => {
    const rows = buildTenantGlobalDiffRows(
      { codeLabel: 'T', isActive: true },
      { codeLabel: 'G', isActive: false }
    );
    const labelRow = rows.find((r) => r.field === '코드명');
    const activeRow = rows.find((r) => r.field === '활성');
    expect(labelRow.changed).toBe(true);
    expect(activeRow.changed).toBe(true);
  });

  test('getOverrideStatusLabel returns Korean labels', () => {
    expect(getOverrideStatusLabel('override')).toBe('오버라이드');
    expect(getOverrideStatusLabel('tenant_only')).toBe('테넌트 전용');
  });
});
