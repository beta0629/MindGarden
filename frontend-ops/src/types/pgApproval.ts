/**
 * PG 승인 API 타입
 *
 * @author CoreSolution
 * @since 2026-09-07
 */

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
  createdAt?: string;
  updatedAt?: string;
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
