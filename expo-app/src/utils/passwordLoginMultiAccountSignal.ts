/**
 * 일반 로그인(전화 + 비밀번호) 다중 매치 응답 감지 — P1 silent first 차단(2026-06-11).
 *
 * <p>백엔드 흐름:</p>
 * <ul>
 *   <li>{@code POST /api/v1/auth/login} 응답 본문이
 *     <ul>
 *       <li>{@code multipleAccounts === true} 또는</li>
 *       <li>{@code responseType === 'multiple_accounts_selection_required'}</li>
 *     </ul>
 *     이면 다중 매치로 판단.</li>
 *   <li>응답에는 {@code candidates} 배열과 {@code selectionToken} 이 함께 포함되며, 둘이 있어야만
 *     계정 선택 화면으로 라우팅한다.</li>
 *   <li>{@code ApiResponse} 래퍼 형태(`data.candidates` / `data.selectionToken`) 도 모두 지원.</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-06-11
 */

import type { PasswordLoginAccountCandidate } from '@/services/AuthService';

export interface PasswordLoginMultipleAccountsSignal {
  readonly selectionToken: string;
  readonly candidates: PasswordLoginAccountCandidate[];
  readonly message?: string;
}

/** BE `AuthServiceImpl.MULTIPLE_ACCOUNTS_RESPONSE_TYPE` 상수와 동일. */
export const MULTIPLE_ACCOUNTS_RESPONSE_TYPE = 'multiple_accounts_selection_required';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value == null || typeof value !== 'object') {
    return null;
  }
  return value as Record<string, unknown>;
}

function extractMessage(payload: Record<string, unknown>): string | undefined {
  const direct = payload.message;
  if (typeof direct === 'string' && direct.trim().length > 0) {
    return direct;
  }
  const nested = asRecord(payload.data);
  if (nested) {
    const nestedMsg = nested.message;
    if (typeof nestedMsg === 'string' && nestedMsg.trim().length > 0) {
      return nestedMsg;
    }
  }
  return undefined;
}

function readCandidates(value: unknown): PasswordLoginAccountCandidate[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const result: PasswordLoginAccountCandidate[] = [];
  for (const item of value) {
    const r = asRecord(item);
    if (!r) {
      continue;
    }
    const idRaw = r.userId;
    const id =
      typeof idRaw === 'number'
        ? idRaw
        : typeof idRaw === 'string' && /^\d+$/.test(idRaw)
          ? Number(idRaw)
          : null;
    if (id == null) {
      continue;
    }
    result.push({
      userId: id,
      role: typeof r.role === 'string' ? r.role : null,
      roleDisplayLabel: typeof r.roleDisplayLabel === 'string' ? r.roleDisplayLabel : null,
      dashboardGuide: typeof r.dashboardGuide === 'string' ? r.dashboardGuide : null,
      optionLabel: typeof r.optionLabel === 'string' ? r.optionLabel : null,
      maskedEmail: typeof r.maskedEmail === 'string' ? r.maskedEmail : null,
      branchName: typeof r.branchName === 'string' ? r.branchName : null,
    });
  }
  return result.length > 1 ? result : null;
}

function payloadHasMultiAccountFlag(payload: Record<string, unknown>): boolean {
  if (payload.multipleAccounts === true) {
    return true;
  }
  if (payload.responseType === MULTIPLE_ACCOUNTS_RESPONSE_TYPE) {
    return true;
  }
  const nested = asRecord(payload.data);
  if (nested) {
    if (nested.multipleAccounts === true) {
      return true;
    }
    if (nested.responseType === MULTIPLE_ACCOUNTS_RESPONSE_TYPE) {
      return true;
    }
  }
  return false;
}

function readToken(payload: Record<string, unknown>): string | null {
  const direct = payload.selectionToken;
  if (typeof direct === 'string' && direct.trim().length > 0) {
    return direct;
  }
  const nested = asRecord(payload.data);
  if (nested) {
    const tk = nested.selectionToken;
    if (typeof tk === 'string' && tk.trim().length > 0) {
      return tk;
    }
  }
  return null;
}

function readCandidatesFromPayload(
  payload: Record<string, unknown>,
): PasswordLoginAccountCandidate[] | null {
  const direct = readCandidates(payload.candidates);
  if (direct) {
    return direct;
  }
  const nested = asRecord(payload.data);
  if (nested) {
    return readCandidates(nested.candidates);
  }
  return null;
}

/**
 * 응답 본문에서 다중 매치 신호를 감지한다.
 *
 * @param input 백엔드 응답 본문(`Record`) 또는 axios reject 객체(`{ originalError }`)
 * @returns 감지된 경우 토큰 + 후보 목록, 아니면 `null`
 */
export function detectPasswordLoginMultipleAccounts(
  input: unknown,
): PasswordLoginMultipleAccountsSignal | null {
  const root = asRecord(input);
  if (!root) {
    return null;
  }

  let payload: Record<string, unknown> | null = null;
  if (payloadHasMultiAccountFlag(root)) {
    payload = root;
  } else {
    const errPayload = asRecord(
      asRecord(root.originalError)?.response,
    );
    const errData = asRecord(errPayload?.data);
    if (errData && payloadHasMultiAccountFlag(errData)) {
      payload = errData;
    }
  }

  if (!payload) {
    return null;
  }

  const token = readToken(payload);
  const candidates = readCandidatesFromPayload(payload);
  if (!token || !candidates) {
    return null;
  }
  return {
    selectionToken: token,
    candidates,
    message: extractMessage(payload),
  };
}
