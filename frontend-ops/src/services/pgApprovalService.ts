import { clientApiFetch } from "@/services/clientApi";
import { OPS_API_PATHS } from "@/constants/api";
import type {
  ConnectionTestResult,
  PgApproveRequest,
  PgConfigurationPendingItem,
  PgRejectRequest
} from "@/types/pgApproval";

/**
 * 승인 대기 PG 설정 목록 조회
 * 백엔드: GET /api/v1/ops/pg-configurations/pending
 *
 * @param filters 센터 ID·PG Provider 필터
 * @returns 승인 대기 목록
 */
export async function fetchPendingPgApprovals(filters?: {
  tenantId?: string;
  pgProvider?: string;
}): Promise<PgConfigurationPendingItem[]> {
  const params = new URLSearchParams();
  if (filters?.tenantId) {
    params.append("tenantId", filters.tenantId);
  }
  if (filters?.pgProvider) {
    params.append("pgProvider", filters.pgProvider);
  }
  const query = params.toString();
  const path = query
    ? `${OPS_API_PATHS.PG_CONFIGURATIONS.PENDING}?${query}`
    : OPS_API_PATHS.PG_CONFIGURATIONS.PENDING;

  const response = await clientApiFetch<PgConfigurationPendingItem[]>(path);
  return Array.isArray(response) ? response : [];
}

/**
 * PG 설정 승인
 *
 * @param configId PG 설정 ID
 * @param request 승인 요청
 */
export async function approvePgConfiguration(
  configId: string,
  request: PgApproveRequest
): Promise<PgConfigurationPendingItem> {
  return clientApiFetch<PgConfigurationPendingItem>(
    OPS_API_PATHS.PG_CONFIGURATIONS.APPROVE(configId),
    {
      method: "POST",
      body: JSON.stringify(request)
    }
  );
}

/**
 * PG 설정 거부
 *
 * @param configId PG 설정 ID
 * @param request 거부 요청
 */
export async function rejectPgConfiguration(
  configId: string,
  request: PgRejectRequest
): Promise<PgConfigurationPendingItem> {
  return clientApiFetch<PgConfigurationPendingItem>(
    OPS_API_PATHS.PG_CONFIGURATIONS.REJECT(configId),
    {
      method: "POST",
      body: JSON.stringify(request)
    }
  );
}

/**
 * PG 연결 테스트
 *
 * @param configId PG 설정 ID
 */
export async function testPgConnection(
  configId: string
): Promise<ConnectionTestResult> {
  return clientApiFetch<ConnectionTestResult>(
    OPS_API_PATHS.PG_CONFIGURATIONS.TEST_CONNECTION(configId),
    {
      method: "POST",
      body: JSON.stringify({})
    }
  );
}

/**
 * 쿠키에서 Ops actor id 조회 (승인/거부자)
 */
export function resolveOpsActorId(): string {
  if (typeof document === "undefined") {
    return "ops-system";
  }
  const cookieMap = new Map<string, string>();
  (document.cookie ?? "").split(";").forEach((entry) => {
    const [rawKey, ...rawValue] = entry.trim().split("=");
    if (!rawKey) {
      return;
    }
    cookieMap.set(
      decodeURIComponent(rawKey),
      decodeURIComponent(rawValue.join("="))
    );
  });
  return (
    cookieMap.get("ops_actor_id") ||
    process.env.NEXT_PUBLIC_OPS_ACTOR_ID ||
    "ops-system"
  );
}
