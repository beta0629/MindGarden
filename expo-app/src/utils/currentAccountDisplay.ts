/**
 * 현재 로그인 계정 가시화 — 표시 문자열 정규화 SSOT (React #130 방지)
 *
 * 마이페이지 배너·로그인 토스트·웰니스 EmptyState 안내에서 공통으로 사용한다.
 * 모든 표시 출력은 `toDisplayString` 경계를 통과한 스칼라 문자열만 사용한다.
 *
 * 참조: docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md
 *
 * @author MindGarden
 * @since 2026-06-09
 */
import { toDisplayString } from './safeDisplay';

const CURRENT_ACCOUNT_PREFIX = '현재 로그인 계정';
const CURRENT_ACCOUNT_SEPARATOR = ' · ';
const ACCOUNT_FALLBACK_EMAIL = '계정 정보 없음';
const SUFFIX_LENGTH = 4;

export interface CurrentAccountInput {
  email?: string | null;
  socialProvider?: string | null;
  userId?: number | string | null;
}

export interface CurrentAccountDisplay {
  email: string;
  providerLabel: string | null;
  suffix: string | null;
  /** 한 줄 결합 표시 문자열 — 배너·토스트 본문 공통 사용 */
  oneLine: string;
}

/**
 * `user.id` 마지막 4자리(또는 4자리 미만이면 전체)를 디버깅 식별자로 노출.
 * 숫자·문자 모두 안전하게 처리하고 빈값이면 null.
 */
export function extractUserIdSuffix(
  userId: number | string | null | undefined,
): string | null {
  if (userId == null) {
    return null;
  }
  const raw = typeof userId === 'number' ? String(userId) : userId;
  const trimmed = raw.trim();
  if (trimmed === '') {
    return null;
  }
  if (trimmed.length <= SUFFIX_LENGTH) {
    return trimmed;
  }
  return trimmed.slice(-SUFFIX_LENGTH);
}

/**
 * KAKAO / NAVER / APPLE / GOOGLE 등 provider 코드를 대문자 라벨로 정규화.
 * 빈값·null이면 표시하지 않는다(라벨 자체를 null).
 */
export function normalizeProviderLabel(
  provider: string | null | undefined,
): string | null {
  if (provider == null) {
    return null;
  }
  const t = provider.trim();
  if (t === '' || t.toUpperCase() === 'LOCAL') {
    return null;
  }
  return `(${t.toUpperCase()})`;
}

/**
 * 마이페이지 배너 한 줄 라벨을 만든다.
 * 예) `현재 로그인 계정 · user@x.com · (KAKAO) · #1234`
 *
 * @param input 표시할 계정 정보
 * @returns 정규화된 표시 항목 묶음
 */
export function buildCurrentAccountDisplay(
  input: CurrentAccountInput,
): CurrentAccountDisplay {
  const emailRaw = toDisplayString(input.email, ACCOUNT_FALLBACK_EMAIL);
  const email = emailRaw.trim() === '' ? ACCOUNT_FALLBACK_EMAIL : emailRaw.trim();
  const providerLabel = normalizeProviderLabel(input.socialProvider);
  const suffix = extractUserIdSuffix(input.userId);

  const parts: string[] = [CURRENT_ACCOUNT_PREFIX, email];
  if (providerLabel != null) {
    parts.push(providerLabel);
  }
  if (suffix != null) {
    parts.push(`#${suffix}`);
  }
  return {
    email,
    providerLabel,
    suffix,
    oneLine: parts.join(CURRENT_ACCOUNT_SEPARATOR),
  };
}

/**
 * 로그인 성공 토스트 본문 (이메일만 핵심 표시).
 *
 * @param email 사용자 이메일 (없으면 fallback)
 */
export function buildLoginSuccessToastBody(email: string | null | undefined): string {
  const emailDisplay = toDisplayString(email, ACCOUNT_FALLBACK_EMAIL);
  const safeEmail = emailDisplay.trim() === '' ? ACCOUNT_FALLBACK_EMAIL : emailDisplay.trim();
  return `${safeEmail} (으)로 로그인되었습니다`;
}

export interface LoginSuccessToastPayload {
  id: string;
  title: string;
  body: string;
  icon: string;
}

/**
 * 로그인 직후 인앱 토스트 페이로드 (`showInAppToast` 입력).
 * 본 함수가 SSOT — `useAuthStore.login` 은 결과만 위임한다.
 *
 * @param user 동기화된 사용자(`syncedUser`)
 * @param nowMs 토스트 id 생성용 timestamp (테스트 주입 가능)
 */
export function buildLoginSuccessToastPayload(
  user: { id: number | string; email?: string | null },
  nowMs: number = Date.now(),
): LoginSuccessToastPayload {
  return {
    id: `login-success-${user.id}-${nowMs}`,
    title: '로그인 완료',
    body: buildLoginSuccessToastBody(user.email),
    icon: 'CheckCircle',
  };
}
