/**
 * PG 승인 API 타입
 *
 * @author CoreSolution
 * @since 2026-09-07
 */

/**
 * pending vs live 마스킹 스냅샷 (시크릿 평문 없음)
 */
export interface PgPendingEditValues {
  provider?: string | null;
  storeId?: string | null;
  merchantId?: string | null;
  channelKeyMasked?: string | null;
  webhookUrl?: string | null;
  returnUrl?: string | null;
  cancelUrl?: string | null;
}

/**
 * 대기 수정 마스킹 차이
 */
export interface PgPendingEditDiff {
  current?: PgPendingEditValues | null;
  pending?: PgPendingEditValues | null;
  apiKeyChanged?: boolean | null;
  secretKeyChanged?: boolean | null;
}

export interface PgConfigurationPendingItem {
  configId: string;
  tenantId: string;
  pgProvider: string;
  pgName?: string;
  merchantId?: string;
  storeId?: string;
  status?: string;
  approvalStatus?: string;
  testMode?: boolean;
  notes?: string;
  centerName?: string;
  tenantName?: string;
  createdAt?: string;
  updatedAt?: string;
  /** ACTIVE 재승인용 pending_request_json 존재 */
  hasPendingEdit?: boolean;
  pendingRequestedAt?: string;
  pendingEditDiff?: PgPendingEditDiff | null;
}

export interface PgApproveRequest {
  approvedBy: string;
  approvalNote?: string;
  testConnection?: boolean;
}

export interface PgRejectRequest {
  rejectedBy: string;
  rejectionReason: string;
}

export interface ConnectionTestResult {
  success: boolean;
  result?: string;
  message?: string;
  testedAt?: string;
  details?: string;
}
