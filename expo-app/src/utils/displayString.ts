/**
 * API가 복호화 실패·암호문을 그대로 줄 때 화면에 노출하지 않기 위한 표시용 문자열 처리.
 * 웹 `frontend/src/utils/codeHelper.js` 의 `maskEncryptedDisplay` 와 정합.
 */
import { getApiBaseUrl } from '@/config/apiBaseUrl';

const ENCRYPTED_BASE64_MIN_LENGTH = 32;

function looksLikeBase64Cipher(s: string): boolean {
  if (s.length < ENCRYPTED_BASE64_MIN_LENGTH) {
    return false;
  }
  return /^[A-Za-z0-9+/]+=*$/.test(s);
}

export function maskEncryptedDisplay(
  value: string | null | undefined,
  fallback = '이름 비공개',
): string {
  if (value == null || value === '') {
    return fallback;
  }
  const s = String(value).trim();
  if (s.startsWith('legacy::')) {
    return fallback;
  }
  if (looksLikeBase64Cipher(s)) {
    return fallback;
  }
  return s;
}

/**
 * 웹과 동일한 `profileImageUrl` 값이 상대 경로(`/api/...`)일 때 네이티브 Image가 로드되도록 API origin을 붙인다.
 */
export function resolveProfileImageUrlForNative(
  uri: string | null | undefined,
): string | undefined {
  if (uri == null || uri === '') {
    return undefined;
  }
  const u = String(uri).trim();
  if (!u) {
    return undefined;
  }
  if (u.startsWith('http://') || u.startsWith('https://')) {
    return u;
  }
  if (u.startsWith('//')) {
    return `https:${u}`;
  }
  if (u.startsWith('file:')) {
    return u;
  }
  const base = getApiBaseUrl().replace(/\/$/, '');
  const path = u.startsWith('/') ? u : `/${u}`;
  return `${base}${path}`;
}
