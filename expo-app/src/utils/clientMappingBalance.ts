/**
 * 내담자 매칭(ConsultantClientMapping) 응답 정규화·회기 집계
 * 웹 ClientDashboard · useSessionBalance SSOT
 *
 * @author MindGarden
 * @since 2026-05-22
 */

export interface ClientMappingRow {
  status?: string;
  totalSessions?: number;
  usedSessions?: number;
  remainingSessions?: number;
}

export interface SessionBalance {
  clientId: number;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
}

/**
 * 웹 `normalizeApiListPayload` / `normalizeMappingsListPayload`와 동등한 매칭 배열 추출
 */
export function extractMappingsFromResponse(response: unknown): ClientMappingRow[] {
  if (response == null) {
    return [];
  }
  if (Array.isArray(response)) {
    return response as ClientMappingRow[];
  }
  if (typeof response !== 'object') {
    return [];
  }
  const tryKeys = (obj: Record<string, unknown>): ClientMappingRow[] | null => {
    for (const key of ['mappings', 'content', 'data', 'items']) {
      if (Array.isArray(obj[key])) {
        return obj[key] as ClientMappingRow[];
      }
    }
    return null;
  };
  const inner = (response as Record<string, unknown>).data ?? response;
  if (inner != null && typeof inner === 'object' && !Array.isArray(inner)) {
    const direct = tryKeys(inner as Record<string, unknown>);
    if (direct) {
      return direct;
    }
    const nested = (inner as Record<string, unknown>).data;
    if (nested != null && typeof nested === 'object' && !Array.isArray(nested)) {
      const fromNested = tryKeys(nested as Record<string, unknown>);
      if (fromNested) {
        return fromNested;
      }
    }
  }
  return [];
}

/** 웹 ClientDashboard와 동일: ACTIVE 매칭만 회기 합산 */
export function aggregateSessionBalance(
  clientId: number,
  mappings: ClientMappingRow[],
): SessionBalance {
  const active = mappings.filter((m) => m?.status === 'ACTIVE');
  const totalSessions = active.reduce((s, m) => s + (Number(m.totalSessions) || 0), 0);
  const usedSessions = active.reduce((s, m) => s + (Number(m.usedSessions) || 0), 0);
  const remainingSessions = active.reduce((s, m) => s + (Number(m.remainingSessions) || 0), 0);
  return {
    clientId,
    totalSessions,
    usedSessions,
    remainingSessions,
  };
}
