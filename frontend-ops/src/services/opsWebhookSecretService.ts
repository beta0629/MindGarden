import { clientApiFetch } from "@/services/clientApi";
import { OPS_API_PATHS } from "@/constants/api";
import type { PgConfigurationPendingItem } from "@/types/pgApproval";

/**
 * Ops 웹훅 시크릿·테스트 모드 서비스
 *
 * @author CoreSolution
 * @since 2026-10-14
 */

export type OpsPgConfigurationItem = PgConfigurationPendingItem & {
  portoneWebhookSecretConfigured?: boolean;
};

/**
 * 승인 대기·이력 조회용 — pending 목록에서 후보를 가져온다.
 * (ACTIVE+PENDING 재승인 건 포함)
 */
export async function fetchOpsPgConfigCandidates(tenantId?: string): Promise<OpsPgConfigurationItem[]> {
  const params = new URLSearchParams();
  if (tenantId) {
    params.append("tenantId", tenantId);
  }
  const query = params.toString();
  const path = query
    ? `${OPS_API_PATHS.PG_CONFIGURATIONS.PENDING}?${query}`
    : OPS_API_PATHS.PG_CONFIGURATIONS.PENDING;
  const response = await clientApiFetch<OpsPgConfigurationItem[]>(path);
  return Array.isArray(response) ? response : [];
}

/**
 * PG 설정 상세(이력 포함) — 마스킹된 시크릿 설정 여부 확인
 */
export async function fetchOpsPgConfigurationDetail(
  configId: string
): Promise<OpsPgConfigurationItem> {
  return clientApiFetch<OpsPgConfigurationItem>(
    OPS_API_PATHS.PG_CONFIGURATIONS.HISTORY(configId)
  );
}

/**
 * 웹훅 시크릿 교체 — ops alias 우선, 실패 시 tenant 경로 폴백.
 */
export async function patchOpsWebhookSecret(params: {
  tenantId: string;
  configId: string;
  webhookSecret: string;
}): Promise<OpsPgConfigurationItem> {
  const { tenantId, configId, webhookSecret } = params;
  const body = JSON.stringify({ webhookSecret });
  try {
    return await clientApiFetch<OpsPgConfigurationItem>(
      OPS_API_PATHS.PG_CONFIGURATIONS.WEBHOOK_SECRET(configId),
      { method: "PATCH", body }
    );
  } catch (opsErr) {
    return clientApiFetch<OpsPgConfigurationItem>(
      OPS_API_PATHS.PG_CONFIGURATIONS.TENANT_WEBHOOK_SECRET(tenantId, configId),
      { method: "PATCH", body }
    );
  }
}

/**
 * 테스트 모드 변경 — ops alias 우선.
 */
export async function patchOpsTestMode(params: {
  tenantId: string;
  configId: string;
  testMode: boolean;
}): Promise<OpsPgConfigurationItem> {
  const { tenantId, configId, testMode } = params;
  const body = JSON.stringify({ testMode });
  try {
    return await clientApiFetch<OpsPgConfigurationItem>(
      OPS_API_PATHS.PG_CONFIGURATIONS.TEST_MODE(configId),
      { method: "PATCH", body }
    );
  } catch {
    return clientApiFetch<OpsPgConfigurationItem>(
      OPS_API_PATHS.PG_CONFIGURATIONS.TENANT_TEST_MODE(tenantId, configId),
      { method: "PATCH", body }
    );
  }
}
