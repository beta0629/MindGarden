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
  normalizeTenantCommonCodeRow,
  mergeProfessionalProviderTypeCodeRows,
  fetchProfessionalProviderTypeSelectOptions,
  TENANT_PROFESSIONAL_PROVIDER_TYPE_CODES_PATH
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

  test('mergeProfessionalProviderTypeCodeRows dedupes by codeValue later wins', () => {
    const merged = mergeProfessionalProviderTypeCodeRows(
      [{ codeValue: 'A', codeLabel: '첫', sortOrder: 1, isActive: true }],
      [{ codeValue: 'A', codeLabel: '덮어쓴', sortOrder: 1, isActive: true }]
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].codeLabel).toBe('덮어쓴');
  });

  test('fetchProfessionalProviderTypeSelectOptions merges integrated and tenant lists', async () => {
    const getCommonCodes = jest.fn().mockResolvedValue([
      { codeValue: 'PLAY_THERAPY', codeLabel: '놀이', sortOrder: 10, isActive: true },
      { codeValue: 'DEFAULT_COUNSELOR', codeLabel: '상담사', sortOrder: 0, isActive: true }
    ]);
    const standardizedApiGet = jest.fn().mockResolvedValue({
      codes: [{ codeValue: 'SPEECH_THERAPY', codeLabel: '언어', sortOrder: 20, isActive: true }]
    });
    const opts = await fetchProfessionalProviderTypeSelectOptions({
      getCommonCodes,
      standardizedApiGet
    });
    expect(standardizedApiGet).toHaveBeenCalledWith(TENANT_PROFESSIONAL_PROVIDER_TYPE_CODES_PATH);
    expect(opts.map((o) => o.value)).toEqual(['DEFAULT_COUNSELOR', 'PLAY_THERAPY', 'SPEECH_THERAPY']);
  });

  test('fetchProfessionalProviderTypeSelectOptions falls back to tenant group path', async () => {
    const getCommonCodes = jest.fn().mockResolvedValue([]);
    const standardizedApiGet = jest.fn().mockResolvedValue({
      codes: [
        { codeValue: 'SPEECH_THERAPIST', codeLabel: '언어', sortOrder: 1, isActive: true }
      ]
    });
    const opts = await fetchProfessionalProviderTypeSelectOptions({
      getCommonCodes,
      standardizedApiGet
    });
    expect(standardizedApiGet).toHaveBeenCalledWith(TENANT_PROFESSIONAL_PROVIDER_TYPE_CODES_PATH);
    expect(opts).toEqual([{ value: 'SPEECH_THERAPIST', label: '언어', sortOrder: 1 }]);
  });

  test('fetchProfessionalProviderTypeSelectOptions uses tenant when integrated yields only inactive', async () => {
    const getCommonCodes = jest.fn().mockResolvedValue([
      { codeValue: 'X', codeLabel: '비활성', sortOrder: 1, isActive: false }
    ]);
    const standardizedApiGet = jest.fn().mockResolvedValue({
      data: [{ code_value: 'T1', korean_name: '테넌트전용', sort_order: 1, is_active: true }]
    });
    const opts = await fetchProfessionalProviderTypeSelectOptions({
      getCommonCodes,
      standardizedApiGet
    });
    expect(standardizedApiGet).toHaveBeenCalled();
    expect(opts.map((o) => o.value)).toEqual(['T1']);
    expect(opts[0].label).toBe('테넌트전용');
  });
});
