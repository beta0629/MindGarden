/**
 * 테넌트 전문가 유형 공통코드 → 옵션 변환 스모크
 *
 * @author CoreSolution
 * @since 2026-05-11
 */

import {
  extractTenantCommonCodeGroupList,
  extractTenantProfessionalTypeList,
  mapTenantProfessionalTypeCodesToOptions,
  mapTenantCommonCodesToGradeSelectOptions,
  normalizeTenantCommonCodeRow
} from '../professionalProviderRoles';

describe('professionalProviderRoles', () => {
  test('extractTenantCommonCodeGroupList unwraps data', () => {
    expect(extractTenantCommonCodeGroupList(null)).toEqual([]);
    expect(extractTenantCommonCodeGroupList({ data: [{ codeValue: 'A' }] })).toEqual([
      { codeValue: 'A' }
    ]);
    expect(extractTenantCommonCodeGroupList({ data: { data: [{ codeValue: 'B' }] } })).toEqual([
      { codeValue: 'B' }
    ]);
    expect(
      extractTenantCommonCodeGroupList({ success: true, data: [{ codeValue: 'C' }] })
    ).toEqual([{ codeValue: 'C' }]);
    expect(
      extractTenantCommonCodeGroupList({ codes: [{ codeValue: 'D' }], totalCount: 1 })
    ).toEqual([{ codeValue: 'D' }]);
    expect(
      extractTenantCommonCodeGroupList({ success: true, data: { codes: [{ codeValue: 'E' }] } })
    ).toEqual([{ codeValue: 'E' }]);
  });

  test('extractTenantProfessionalTypeList aliases common extractor', () => {
    expect(extractTenantProfessionalTypeList({ data: [{ codeValue: 'X' }] })).toEqual([
      { codeValue: 'X' }
    ]);
  });

  test('mapTenantProfessionalTypeCodesToOptions sorts, maps labels, snake_case', () => {
    const rows = [
      { codeValue: 'Z', codeLabel: 'Z타입', sortOrder: 2, isActive: true },
      { code_value: 'A', korean_name: '에이', sort_order: 1, is_active: true },
      { codeValue: 'X', is_deleted: true, sortOrder: 0 }
    ];
    const opts = mapTenantProfessionalTypeCodesToOptions(rows);
    expect(opts.map((o) => o.value)).toEqual(['A', 'Z']);
    expect(opts[0].label).toBe('에이');
    expect(opts[1].label).toBe('Z타입');
  });

  test('normalizeTenantCommonCodeRow maps snake_case', () => {
    const n = normalizeTenantCommonCodeRow({
      code_value: 'PT',
      code_label: '플레이',
      is_active: true
    });
    expect(n.codeValue).toBe('PT');
    expect(n.codeLabel).toBe('플레이');
    expect(n.isActive).toBe(true);
  });

  test('mapTenantCommonCodesToGradeSelectOptions matches grade select shape', () => {
    const g = mapTenantCommonCodesToGradeSelectOptions([
      { codeValue: 'G1', codeLabel: '1급', sortOrder: 1, isActive: true }
    ]);
    expect(g).toEqual([{ codeValue: 'G1', codeLabel: '1급', sortOrder: 1 }]);
  });
});
