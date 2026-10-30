/**
 * 자발 회원 탈퇴(계정 삭제) API — 웹 mypageApi 계약 미러.
 * BE: UserWithdrawalController `/api/v1/mypage/withdrawal/*`
 *
 * @author MindGarden
 * @since 2026-10-28
 */
import { apiGet, apiPost } from '@/api/client';
import { MYPAGE_API } from '@/api/endpoints';
import { unwrapApiResponse } from '@/api/unwrapApiResponse';

/** 소셜(SIWA) 본인 확인 문구 — 서버 `UserWithdrawalController.SOCIAL_CONFIRM_PHRASE` 와 동일. */
export const WITHDRAWAL_SOCIAL_CONFIRM_PHRASE = 'DELETE';

export type WithdrawalRequestPayload = {
  password?: string | null;
  confirmPhrase?: string | null;
  reason?: string | null;
  deleteCommunityBody?: boolean;
};

export type WithdrawalRequestResult = {
  userId?: number;
  lifecycleState?: string;
  withdrawalRequestedAt?: string;
  withdrawalExpiresAt?: string;
  graceDays?: number;
  deleteCommunityBody?: boolean;
};

export type WithdrawalStatusResult = {
  userId?: number;
  lifecycleState?: string;
  withdrawalRequestedAt?: string | null;
  withdrawalExpiresAt?: string | null;
  cancellable?: boolean;
};

export type WithdrawalCancelResult = {
  userId?: number;
  lifecycleState?: string;
  transitionedAt?: string;
};

/**
 * POST /api/v1/mypage/withdrawal/request
 */
export async function requestWithdrawal(
  payload: WithdrawalRequestPayload,
): Promise<WithdrawalRequestResult> {
  const body: Record<string, unknown> = {
    reason: payload.reason ?? null,
    deleteCommunityBody: Boolean(payload.deleteCommunityBody),
  };
  if (payload.password != null && String(payload.password).trim() !== '') {
    body.password = payload.password;
  }
  if (payload.confirmPhrase != null && String(payload.confirmPhrase).trim() !== '') {
    body.confirmPhrase = payload.confirmPhrase;
  }
  const raw = await apiPost<unknown>(MYPAGE_API.WITHDRAWAL_REQUEST, body);
  const data = unwrapApiResponse<WithdrawalRequestResult>(raw);
  if (!data) {
    throw new Error('WITHDRAWAL_REQUEST_PARSE_FAILED');
  }
  return data;
}

/**
 * POST /api/v1/mypage/withdrawal/cancel
 */
export async function cancelWithdrawal(): Promise<WithdrawalCancelResult> {
  const raw = await apiPost<unknown>(MYPAGE_API.WITHDRAWAL_CANCEL, {});
  const data = unwrapApiResponse<WithdrawalCancelResult>(raw);
  if (!data) {
    throw new Error('WITHDRAWAL_CANCEL_PARSE_FAILED');
  }
  return data;
}

/**
 * GET /api/v1/mypage/withdrawal/status
 */
export async function getWithdrawalStatus(): Promise<WithdrawalStatusResult> {
  const raw = await apiGet<unknown>(MYPAGE_API.WITHDRAWAL_STATUS);
  const data = unwrapApiResponse<WithdrawalStatusResult>(raw);
  if (!data) {
    throw new Error('WITHDRAWAL_STATUS_PARSE_FAILED');
  }
  return data;
}
