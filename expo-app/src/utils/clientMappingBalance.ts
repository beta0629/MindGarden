/**
 * 내담자 매칭(ConsultantClientMapping) 응답 정규화·회기 집계
 * 웹 ClientDashboard · useSessionBalance · clientSessionTotals SSOT
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

/** 웹 `countsTowardClientRemainingSessions` / CLIENT_REMAINING_SESSION_STATUSES 와 동일 */
const CLIENT_REMAINING_SESSION_STATUSES = new Set([
  'ACTIVE',
  'PAYMENT_CONFIRMED',
  'DEPOSIT_PENDING',
  'DEPOSIT_CONFIRMED',
]);

/**
 * 홈·회기 잔여에 해당 매핑 remainingSessions 를 합산할지 (웹 SSOT).
 */
export function countsTowardClientRemainingSessions(status?: string | null): boolean {
  if (!status) {
    return false;
  }
  return CLIENT_REMAINING_SESSION_STATUSES.has(status);
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

/**
 * 웹 ClientDashboard / calculateClientSessionTotalsFromMappings 와 동일:
 * shop-paid 상태(ACTIVE + PAYMENT_CONFIRMED + DEPOSIT_*)만 회기 합산.
 * PENDING_PAYMENT(미결제) · SESSIONS_EXHAUSTED 등은 제외.
 */
export function aggregateSessionBalance(
  clientId: number,
  mappings: ClientMappingRow[],
): SessionBalance {
  const eligible = mappings.filter((m) => countsTowardClientRemainingSessions(m?.status));
  const totalSessions = eligible.reduce((s, m) => s + (Number(m.totalSessions) || 0), 0);
  const usedSessions = eligible.reduce((s, m) => s + (Number(m.usedSessions) || 0), 0);
  const remainingSessions = eligible.reduce((s, m) => s + (Number(m.remainingSessions) || 0), 0);
  return {
    clientId,
    totalSessions,
    usedSessions,
    remainingSessions,
  };
}
