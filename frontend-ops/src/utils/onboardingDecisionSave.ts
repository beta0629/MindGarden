export interface DecisionSaveResult<TRequest> {
  saveError: string;
  updated: TRequest | null;
}

/**
 * 결정 저장이 성공하든 실패하든 Promise 는 항상 끝난다.
 * 호출부는 이 함수가 반환된 뒤 저장 중 표시를 내린다.
 */
export async function saveOnboardingDecision<TRequest extends { status?: string }>(input: {
  decide: () => Promise<{ request?: TRequest } | null | undefined>;
  isNotified: (error: unknown) => boolean;
  notifySuccess: (message: string) => void;
  notifyError: (message: string) => void;
  successMessage: string;
  failureMessage: string;
}): Promise<DecisionSaveResult<TRequest>> {
  try {
    const response = await input.decide();
    const request = response?.request;
    const updated = request?.status ? request : null;
    input.notifySuccess(input.successMessage);
    return { saveError: "", updated };
  } catch (error) {
    if (!input.isNotified(error)) {
      input.notifyError(input.failureMessage);
    }
    return { saveError: input.failureMessage, updated: null };
  }
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
