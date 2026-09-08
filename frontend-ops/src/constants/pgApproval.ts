/**
 * PG 승인 관련 상수·라벨 (사용자 카피 「센터」 사용)
 *
 * @author CoreSolution
 * @since 2026-09-07
 */

export const PG_APPROVAL_LABELS = {
  PAGE_TITLE: "PG 승인",
  PAGE_SUBTITLE: "센터가 등록한 PG 설정을 검토하고 승인/거부합니다.",
  EMPTY: "승인 대기 중인 PG 설정이 없습니다.",
  CENTER: "센터",
  CENTER_ID: "센터 ID",
  CENTER_ID_FILTER: "센터 ID 필터",
  PROVIDER: "PG 제공자",
  PG: "PG",
  PG_NAME: "PG사명",
  MERCHANT: "가맹",
  MERCHANT_ID: "가맹 ID",
  RESULT: "결과",
  RESULT_ACTIVE: "사용중으로 전환",
  STATUS: "상태",
  APPROVAL_STATUS: "승인 상태",
  ACTIONS: "작업",
  DETAIL: "상세보기",
  APPROVE: "승인 검토",
  REJECT: "거부",
  TEST_CONNECTION: "연결 시험",
  APPROVE_TITLE: "승인 검토",
  REJECT_TITLE: "PG 설정 거부",
  DETAIL_TITLE: "PG 설정 상세",
  APPROVAL_NOTE: "승인 메모",
  REJECTION_REASON: "거부 사유",
  REJECTION_REASON_REQUIRED: "거부 사유는 필수입니다 (최소 10자).",
  REJECTION_HINT: "거부 사유는 센터에게 전달됩니다.",
  TEST_BEFORE_APPROVE: "승인 전 연결 시험",
  LOADING: "데이터를 불러오는 중입니다...",
  ERROR_LOAD: "승인 대기 목록을 불러오지 못했습니다.",
  APPROVE_SUCCESS: "PG 설정이 승인되었습니다.",
  REJECT_SUCCESS: "PG 설정이 거부되었습니다. 센터에게 알림이 전송됩니다.",
  TEST_SUCCESS: "연결 시험 성공",
  TEST_FAILED: "연결 시험 실패",
  SEARCH_PLACEHOLDER: "PG사명, 제공자, 센터 ID로 검색...",
  REFRESH: "새로고침",
  CANCEL: "취소",
  CLOSE: "닫기",
  SUBMIT_APPROVE: "승인 확정으로 진행",
  SUBMIT_REJECT: "거부 확정으로 진행",
  CONFIRM_APPROVE: "승인 확정",
  CONFIRM_REJECT: "거부 확정",
  CONFIRM_TITLE: "확인",
  CONFIRM_APPROVE_TITLE: "승인 검토 확인",
  CONFIRM_REJECT_TITLE: "거부 확인",
  CONFIRM_APPROVE_HINT: "승인하면 해당 PG 설정이 사용중으로 전환됩니다.",
  CONFIRM_REJECT_HINT: "거부하면 센터에 사유가 전달됩니다.",
  MERCHANT_EMPTY: "—"
} as const;

export const PG_APPROVAL_MIN_REJECTION_REASON_LENGTH = 10;

/**
 * 가맹 ID 마스킹: 앞 2~4 + **** + 뒤 2~4. 짧으면 ****.
 */
export function maskMerchantId(value?: string | null): string {
  if (value == null) {
    return PG_APPROVAL_LABELS.MERCHANT_EMPTY;
  }
  const raw = String(value).trim();
  if (!raw) {
    return PG_APPROVAL_LABELS.MERCHANT_EMPTY;
  }
  if (raw.length <= 4) {
    return "****";
  }
  if (raw.length <= 8) {
    return `${raw.slice(0, 2)}****${raw.slice(-2)}`;
  }
  return `${raw.slice(0, 4)}****${raw.slice(-4)}`;
}

/**
 * 센터 표시명 — 없으면 tenantId
 */
export function resolveCenterDisplayName(item?: {
  centerName?: string;
  tenantName?: string;
  tenantId?: string;
} | null): string {
  if (!item) {
    return PG_APPROVAL_LABELS.MERCHANT_EMPTY;
  }
  const name = item.centerName || item.tenantName;
  if (name && String(name).trim()) {
    return String(name).trim();
  }
  if (item.tenantId && String(item.tenantId).trim()) {
    return String(item.tenantId).trim();
  }
  return PG_APPROVAL_LABELS.MERCHANT_EMPTY;
}

/**
 * PG 표시명 — name/provider
 */
export function resolvePgDisplayName(item?: {
  pgName?: string;
  pgProvider?: string;
} | null): string {
  if (!item) {
    return PG_APPROVAL_LABELS.MERCHANT_EMPTY;
  }
  if (item.pgName && String(item.pgName).trim()) {
    return String(item.pgName).trim();
  }
  if (item.pgProvider && String(item.pgProvider).trim()) {
    return String(item.pgProvider).trim();
  }
  return PG_APPROVAL_LABELS.MERCHANT_EMPTY;
}
