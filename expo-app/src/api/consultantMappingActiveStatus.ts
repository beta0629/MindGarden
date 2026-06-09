/**
 * 상담사 매핑 활성 상태 — 마음 날씨·무드 저널 공유 사전 가드 응답 타입·파서.
 *
 * <p>{@code GET /api/v1/clients/me/consultant-mappings/active} 응답을 FE 가
 * 안전하게 정규화하기 위한 모듈. RN/axios 의존성 없이 단위 테스트 가능하도록 분리.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */

/**
 * 단일 매핑 요약 — PII 미포함.
 */
export interface ConsultantMappingSummary {
  mappingId: number | null;
  consultantId: number | null;
  status: string | null;
}

/**
 * 활성 매핑 상태 응답.
 */
export interface ConsultantMappingActiveStatus {
  hasActiveMapping: boolean;
  mappings: ConsultantMappingSummary[];
}

const EMPTY_STATUS: ConsultantMappingActiveStatus = Object.freeze({
  hasActiveMapping: false,
  mappings: [],
}) as ConsultantMappingActiveStatus;

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return null;
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return null;
}

function parseMapping(raw: unknown): ConsultantMappingSummary | null {
  if (raw == null || typeof raw !== 'object') {
    return null;
  }
  const obj = raw as Record<string, unknown>;
  return {
    mappingId: toNumberOrNull(obj.mappingId),
    consultantId: toNumberOrNull(obj.consultantId),
    status: toStringOrNull(obj.status),
  };
}

/**
 * BE 응답을 FE 안전 형식으로 파싱.
 *
 * <p>본문이 `{ data: { hasActiveMapping, mappings } }` (ApiResponse 래퍼) 또는 직접 본문 둘 다 허용.</p>
 *
 * @param raw BE 응답 (any)
 * @returns 정규화된 매핑 상태
 */
export function parseConsultantMappingActiveStatus(raw: unknown): ConsultantMappingActiveStatus {
  if (raw == null || typeof raw !== 'object') {
    return EMPTY_STATUS;
  }
  const root = raw as Record<string, unknown>;
  const candidate =
    root.data != null && typeof root.data === 'object'
      ? (root.data as Record<string, unknown>)
      : root;
  const hasActiveMapping = candidate.hasActiveMapping === true;
  let mappings: ConsultantMappingSummary[] = [];
  if (Array.isArray(candidate.mappings)) {
    mappings = (candidate.mappings as unknown[])
      .map(parseMapping)
      .filter((m): m is ConsultantMappingSummary => m !== null);
  }
  return { hasActiveMapping, mappings };
}
