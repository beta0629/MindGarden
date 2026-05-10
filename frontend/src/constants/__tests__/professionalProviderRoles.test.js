/**
 * 테넌트 전문가 유형 공통코드 → 옵션 변환 스모크
 *
 * @author CoreSolution
 * @since 2026-05-11
 */

import {
  extractTenantProfessionalTypeList,
  mapTenantProfessionalTypeCodesToOptions
} from '../professionalProviderRoles';

describe('professionalProviderRoles', () => {
  test('extractTenantProfessionalTypeList unwraps data', () => {
    expect(extractTenantProfessionalTypeList(null)).toEqual([]);
    expect(extractTenantProfessionalTypeList({ data: [{ codeValue: 'A' }] })).toEqual([
      { codeValue: 'A' }
    ]);
    expect(extractTenantProfessionalTypeList({ data: { data: [{ codeValue: 'B' }] } })).toEqual([
      { codeValue: 'B' }
    ]);
  });

  test('mapTenantProfessionalTypeCodesToOptions sorts and maps labels', () => {
    const rows = [
      { codeValue: 'Z', codeLabel: 'Z타입', sortOrder: 2, isActive: true },
      { codeValue: 'A', koreanName: '에이', sortOrder: 1, isActive: true },
      { codeValue: 'X', isDeleted: true, sortOrder: 0 }
    ];
    const opts = mapTenantProfessionalTypeCodesToOptions(rows);
    expect(opts.map((o) => o.value)).toEqual(['A', 'Z']);
    expect(opts[0].label).toBe('에이');
    expect(opts[1].label).toBe('Z타입');
  });
});
