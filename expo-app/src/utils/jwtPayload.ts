/**
 * JWT payload 디코딩(검증 없음) — 클라이언트 테넌트 헤더·스토어 정합용.
 * 서버는 Bearer 검증이 SSOT이다.
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { Buffer } from 'buffer';

function decodeBase64WithAtobUtf8(base64: string): string {
  if (typeof globalThis.atob !== 'function') {
    return '';
  }
  try {
    const binary = globalThis.atob(base64);
    return decodeURIComponent(
      Array.from(binary, (char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join(
        '',
      ),
    );
  } catch {
    return '';
  }
}

function base64UrlToUtf8(segment: string): string {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(padLen);
  try {
    return Buffer.from(padded, 'base64').toString('utf8');
  } catch {
    return decodeBase64WithAtobUtf8(padded);
  }
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.trim().split('.');
  const payloadSegment = parts[1];
  if (!payloadSegment) {
    return null;
  }
  try {
    const json = base64UrlToUtf8(payloadSegment);
    const parsed: unknown = JSON.parse(json);
    return parsed != null && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function extractTenantIdFromAccessToken(accessToken: string | null | undefined): string {
  if (!accessToken?.trim()) {
    return '';
  }
  const payload = decodeJwtPayload(accessToken);
  const tid = payload?.tenantId;
  return typeof tid === 'string' ? tid.trim() : '';
}

export function parseJwtSubAsUserId(payload: Record<string, unknown> | null): number | null {
  const sub = payload?.sub;
  if (typeof sub === 'number' && Number.isFinite(sub) && sub > 0) {
    return Math.trunc(sub);
  }
  if (typeof sub === 'string') {
    const parsed = Number.parseInt(sub, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return null;
}
