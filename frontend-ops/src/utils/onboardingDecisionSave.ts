export interface DecisionAdminAccount {
  email?: string | null;
  tenantId?: string | null;
  tenantName?: string | null;
}

export interface DecisionSaveResult<TRequest> {
  saveError: string;
  updated: TRequest | null;
  adminAccount?: DecisionAdminAccount | null;
}

/**
 * API 가 이미 만든 실패 사유를 그대로 쓴다.
 * 사유가 없을 때만 호출부가 넘긴 문구로 돌아간다.
 */
export function readDecisionFailureMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const message = error.message.trim();
    if (message.length > 0) {
      return message;
    }
  }
  return fallback;
}

function rejectedDecisionMessage(
  response: { success?: boolean; message?: string } | null | undefined,
  fallback: string
): string | null {
  if (response == null) {
    return fallback;
  }
  if (response.success === false) {
    const message = typeof response.message === "string" ? response.message.trim() : "";
    return message.length > 0 ? message : fallback;
  }
  return null;
}

/**
 * 결정 저장이 성공하든 실패하든 Promise 는 항상 끝난다.
 * 호출부는 이 함수가 반환된 뒤 저장 중 표시를 내린다.
 * 응답이 실패이면 성공 알림을 띄우지 않는다.
 */
export async function saveOnboardingDecision<TRequest extends { status?: string }>(input: {
  decide: () => Promise<{
    request?: TRequest;
    adminAccount?: DecisionAdminAccount | null;
    success?: boolean;
    message?: string;
  } | null | undefined>;
  isNotified: (error: unknown) => boolean;
  notifySuccess: (message: string) => void;
  notifyError: (message: string) => void;
  successMessage: string;
  failureMessage: string;
}): Promise<DecisionSaveResult<TRequest>> {
  try {
    const response = await input.decide();
    const rejected = rejectedDecisionMessage(response, input.failureMessage);
    if (rejected) {
      input.notifyError(rejected);
      return { saveError: rejected, updated: null, adminAccount: null };
    }
    const request = response?.request;
    const updated = request?.status ? request : null;
    input.notifySuccess(input.successMessage);
    return { saveError: "", updated, adminAccount: response?.adminAccount ?? null };
  } catch (error) {
    const message = readDecisionFailureMessage(error, input.failureMessage);
    if (!input.isNotified(error)) {
      input.notifyError(message);
    }
    return { saveError: message, updated: null, adminAccount: null };
  }
}

/**
 * 저장이 끝나 성공이든 실패든 목록·상세를 다시 받는다.
 * 저장이 실패한 경우 재조회 오류가 저장 실패 사유를 덮지 않는다.
 */
export async function settleOnboardingDecision<TRequest>(input: {
  save: () => Promise<DecisionSaveResult<TRequest>>;
  onSaved?: (saved: DecisionSaveResult<TRequest>) => void;
  refresh: () => Promise<void>;
  failureMessage: string;
}): Promise<DecisionSaveResult<TRequest>> {
  const saved = await input.save();
  input.onSaved?.(saved);
  try {
    await input.refresh();
  } catch (error) {
    if (!saved.saveError) {
      return {
        saveError: readDecisionFailureMessage(error, input.failureMessage),
        updated: saved.updated
      };
    }
  }
  return saved;
}

/**
 * 저장 작업이 끝나거나 실패하면 saving 을 항상 false 로 되돌린다.
 */
export async function withSavingReleased(
  run: () => Promise<void>,
  setSaving: (saving: boolean) => void,
): Promise<void> {
  setSaving(true);
  try {
    await run();
  } finally {
    setSaving(false);
  }
}
