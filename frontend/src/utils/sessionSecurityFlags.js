/**
 * 세션 보안 스위치 (system_config) FE 캐시.
 * BE SessionSecurityFlagKeys / SessionSecurityPolicyService 와 정합.
 *
 * @author MindGarden
 * @since 2026-09-26
 */

import StandardizedApi from './standardizedApi';
import {
  SESSION_SECURITY_FLAG_DEFAULTS,
  SESSION_SECURITY_FLAGS_CACHE_TTL_MS,
  SESSION_SECURITY_FLAGS_PATH
} from '../constants/session';

/** @typedef {{ oauthRequireServerVerify: boolean, background401KeepUser: boolean, softFailEnabled: boolean }} SessionSecurityFlags */

let cachedFlags = { ...SESSION_SECURITY_FLAG_DEFAULTS };
let cachedAtMs = 0;
let inflight = null;

/**
 * 캐시된 플래그 (동기). TTL 만료여도 마지막 값을 반환 — 호출 전 load 권장.
 * @returns {SessionSecurityFlags}
 */
export function getCachedSessionSecurityFlags() {
  return { ...cachedFlags };
}

/**
 * OAuth 서버 검증 필수 여부 (동기, 캐시).
 * @returns {boolean}
 */
export function isOAuthRequireServerVerify() {
  return cachedFlags.oauthRequireServerVerify !== false;
}

/**
 * background 401 시 user 유지 여부 (동기, 캐시).
 * @returns {boolean}
 */
export function isBackground401KeepUser() {
  return cachedFlags.background401KeepUser === true;
}

/**
 * soft-fail 활성 여부 (동기, 캐시).
 * @returns {boolean}
 */
export function isSoftFailEnabled() {
  return cachedFlags.softFailEnabled !== false;
}

/**
 * 서버에서 세션 보안 플래그 로드 (TTL 캐시).
 *
 * @param {boolean} [force=false] 캐시 무시
 * @returns {Promise<SessionSecurityFlags>}
 */
export async function loadSessionSecurityFlags(force = false) {
  const now = Date.now();
  if (!force && cachedAtMs > 0 && now - cachedAtMs < SESSION_SECURITY_FLAGS_CACHE_TTL_MS) {
    return getCachedSessionSecurityFlags();
  }
  if (!force && inflight) {
    return inflight;
  }

  inflight = (async() => {
    try {
      const raw = await StandardizedApi.get(SESSION_SECURITY_FLAGS_PATH, {}, {
        unwrapApiEnvelope: false
      });
      const data =
        raw && typeof raw === 'object' && 'success' in raw && 'data' in raw
          ? raw.data
          : raw;
      if (data && typeof data === 'object') {
        cachedFlags = {
          oauthRequireServerVerify:
            data.oauthRequireServerVerify !== false
              ? Boolean(data.oauthRequireServerVerify ?? true)
              : false,
          background401KeepUser: data.background401KeepUser === true,
          softFailEnabled: data.softFailEnabled !== false
        };
        const ttl = Number(data.cacheTtlMs);
        if (Number.isFinite(ttl) && ttl > 0) {
          // 서버 TTL 힌트는 상수와 동일 범위로만 반영(클라 상수가 SSOT)
        }
      }
    } catch (e) {
      console.warn('세션 보안 플래그 로드 실패 — 기본값 유지:', e?.message);
      if (cachedAtMs === 0) {
        cachedFlags = { ...SESSION_SECURITY_FLAG_DEFAULTS };
      }
    } finally {
      cachedAtMs = Date.now();
      inflight = null;
    }
    return getCachedSessionSecurityFlags();
  })();

  return inflight;
}

/**
 * 테스트용 캐시 리셋.
 * @param {Partial<SessionSecurityFlags>} [overrides]
 */
export function resetSessionSecurityFlagsCacheForTests(overrides = null) {
  cachedFlags = { ...SESSION_SECURITY_FLAG_DEFAULTS, ...(overrides || {}) };
  cachedAtMs = 0;
  inflight = null;
}
