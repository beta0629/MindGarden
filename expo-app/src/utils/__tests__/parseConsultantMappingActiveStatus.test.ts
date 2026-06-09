/**
 * 상담사 매핑 활성 상태 파서 단위 테스트.
 *
 * <p>BE 응답이 {@code ApiResponse<T>} 래퍼·직접 본문·null·이상 형식 모두에서
 * 안전하게 정규화되는지 검증.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
import { parseConsultantMappingActiveStatus } from '@/api/consultantMappingActiveStatus';

describe('parseConsultantMappingActiveStatus', () => {
  it('null/undefined/primitives — 빈 상태', () => {
    expect(parseConsultantMappingActiveStatus(null)).toEqual({
      hasActiveMapping: false,
      mappings: [],
    });
    expect(parseConsultantMappingActiveStatus(undefined)).toEqual({
      hasActiveMapping: false,
      mappings: [],
    });
    expect(parseConsultantMappingActiveStatus('not-an-object')).toEqual({
      hasActiveMapping: false,
      mappings: [],
    });
  });

  it('직접 본문 — hasActiveMapping=true + mappings 배열', () => {
    const result = parseConsultantMappingActiveStatus({
      hasActiveMapping: true,
      mappings: [
        { mappingId: 1, consultantId: 100, status: 'ACTIVE' },
        { mappingId: 2, consultantId: 101, status: 'SESSIONS_EXHAUSTED' },
      ],
    });
    expect(result.hasActiveMapping).toBe(true);
    expect(result.mappings).toHaveLength(2);
    expect(result.mappings[0]).toEqual({
      mappingId: 1,
      consultantId: 100,
      status: 'ACTIVE',
    });
    expect(result.mappings[1]?.status).toBe('SESSIONS_EXHAUSTED');
  });

  it('ApiResponse<T> 래퍼 — data 필드 자동 추출', () => {
    const result = parseConsultantMappingActiveStatus({
      success: true,
      data: {
        hasActiveMapping: true,
        mappings: [{ mappingId: 5, consultantId: 50, status: 'ACTIVE' }],
      },
    });
    expect(result.hasActiveMapping).toBe(true);
    expect(result.mappings).toHaveLength(1);
    expect(result.mappings[0]?.mappingId).toBe(5);
  });

  it('hasActiveMapping=false + 빈 mappings 배열', () => {
    expect(parseConsultantMappingActiveStatus({ hasActiveMapping: false, mappings: [] }))
      .toEqual({ hasActiveMapping: false, mappings: [] });
  });

  it('mappings 가 배열이 아니면 빈 배열로 정규화', () => {
    const result = parseConsultantMappingActiveStatus({
      hasActiveMapping: true,
      mappings: 'not-an-array',
    });
    expect(result.hasActiveMapping).toBe(true);
    expect(result.mappings).toEqual([]);
  });

  it('mappings 항목이 객체 아니면 필터링', () => {
    const result = parseConsultantMappingActiveStatus({
      hasActiveMapping: true,
      mappings: [
        null,
        'string',
        42,
        { mappingId: 7, consultantId: 70, status: 'ACTIVE' },
      ],
    });
    expect(result.mappings).toHaveLength(1);
    expect(result.mappings[0]).toEqual({
      mappingId: 7,
      consultantId: 70,
      status: 'ACTIVE',
    });
  });

  it('mappings 항목 필드가 없거나 잘못된 타입 — null 로 정규화', () => {
    const result = parseConsultantMappingActiveStatus({
      hasActiveMapping: true,
      mappings: [{ mappingId: 'x', consultantId: null, status: 123 }],
    });
    expect(result.mappings).toHaveLength(1);
    expect(result.mappings[0]).toEqual({
      mappingId: null,
      consultantId: null,
      status: null,
    });
  });

  it('hasActiveMapping 이 truthy 가 아니면 false 로 정규화', () => {
    const cases = [{}, { hasActiveMapping: 1 }, { hasActiveMapping: 'true' }];
    cases.forEach((raw) => {
      expect(parseConsultantMappingActiveStatus(raw).hasActiveMapping).toBe(false);
    });
  });
});
