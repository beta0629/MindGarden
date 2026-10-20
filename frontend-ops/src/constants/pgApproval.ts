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
  /** 목록/행 CTA — 검토 단계 라벨 (Confirm 「거부 확정」과 구분) */
  REJECT: "거부 검토",
  REVIEW_REJECT: "거부 검토",
  TEST_CONNECTION: "연결 시험",
  APPROVE_TITLE: "승인 검토",
  REJECT_TITLE: "PG 설정 거부",
  DETAIL_TITLE: "PG 설정 상세",
  APPROVAL_NOTE: "승인 메모",
  REJECTION_REASON: "거부 사유",
  REJECTION_REASON_REQUIRED: "거부 사유는 필수입니다 (최소 10자).",
  REJECTION_HINT: "거부 사유는 센터에게 전달됩니다.",
  TEST_BEFORE_APPROVE: "승인 전 연결 시험",
  /** 대기 수정(pending) 승인 시 연결 시험 필수 — 스위치 비활성 힌트 */
  TEST_BEFORE_APPROVE_PENDING_HINT: "대기 수정 시 연결 시험 필수",
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
  MERCHANT_EMPTY: "—",
  REAPPROVAL_BADGE: "재승인 대기",
  PENDING_EDIT_DIFF_TITLE: "대기 수정 비교",
  PENDING_EDIT_CURRENT: "현재(live)",
  PENDING_EDIT_PENDING: "대기(pending)",
  DIFF_PROVIDER: "PG 제공자",
  DIFF_STORE_ID: "스토어 ID",
  DIFF_MERCHANT_ID: "가맹 ID",
  DIFF_CHANNEL_KEY: "채널 키",
  DIFF_CHANNEL_KEY_TEST: "테스트 채널 키",
  DIFF_WEBHOOK_URL: "Webhook URL",
  DIFF_RETURN_URL: "Return URL",
  DIFF_CANCEL_URL: "Cancel URL",
  DIFF_API_KEY_CHANGED: "API 키 변경",
  DIFF_SECRET_KEY_CHANGED: "시크릿 키 변경",
  DIFF_CHANGED_YES: "변경됨",
  DIFF_CHANGED_NO: "변경 없음"
} as const;

export const PG_APPROVAL_MIN_REJECTION_REASON_LENGTH = 10;

/**
 * 재승인 배지 표시 여부.
 * hasPendingEdit 우선, 없으면 ACTIVE+PENDING 레거시 조건.
 *
 * @param item 목록/상세 항목
 * @returns 재승인 배지 표시 시 true
 */
export function shouldShowReapprovalBadge(item?: {
  hasPendingEdit?: boolean | null;
  status?: string | null;
  approvalStatus?: string | null;
} | null): boolean {
  if (!item) {
    return false;
  }
  if (item.hasPendingEdit === true) {
    return true;
  }
  return item.status === "ACTIVE" && item.approvalStatus === "PENDING";
}

/**
 * pending 수정이 있으면 승인 전 연결 시험을 강제·스위치 비활성.
 *
 * @param item 목록/상세 항목
 * @returns 연결 시험 강제 시 true
 */
export function isConnectionTestForcedForPending(item?: {
  hasPendingEdit?: boolean | null;
} | null): boolean {
  return item?.hasPendingEdit === true;
}

/**
 * 승인 요청용 testConnection 값 — pending 이면 항상 true.
 *
 * @param hasPendingEdit 대기 수정 여부
 * @param userChecked UI 스위치 값
 * @returns API 에 전달할 testConnection
 */
export function resolveApproveTestConnection(
  hasPendingEdit: boolean | null | undefined,
  userChecked: boolean
): boolean {
  return hasPendingEdit === true ? true : userChecked;
}

/**
 * 마스킹 diff 셀 표시값 — 비어 있으면 MERCHANT_EMPTY.
 *
 * @param value 마스킹 문자열
 * @returns 표시 문자열
 */
export function formatPendingEditDisplay(value?: string | null): string {
  if (value == null || !String(value).trim()) {
    return PG_APPROVAL_LABELS.MERCHANT_EMPTY;
  }
  return String(value).trim();
}

/**
 * 키 변경 여부 라벨.
 *
 * @param changed 변경 여부
 * @returns 표시 라벨
 */
export function formatKeyChangedLabel(changed?: boolean | null): string {
  return changed === true
    ? PG_APPROVAL_LABELS.DIFF_CHANGED_YES
    : PG_APPROVAL_LABELS.DIFF_CHANGED_NO;
}

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
