/**
 * 세션 보안 스위치 (system_config) FE 로드.
 * BE SessionSecurityFlagKeys / SessionSecurityPolicyService 와 정합.
 * 동기 getter/캐시는 sessionSecurityFlagsCache (API 비의존) — import cycle 방지.
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
import {
  commitSessionSecurityFlags,
  getCachedSessionSecurityFlags,
  getSessionSecurityFlagsCachedAtMs,
  getSessionSecurityFlagsInflight,
  setSessionSecurityFlagsInflight,
  touchSessionSecurityFlagsCacheAt
} from './sessionSecurityFlagsCache';

export {
  getCachedSessionSecurityFlags,
  isBackground401KeepUser,
  isOAuthRequireServerVerify,
  isSoftFailEnabled,
  resetSessionSecurityFlagsCacheForTests
} from './sessionSecurityFlagsCache';

/**
 * 서버에서 세션 보안 플래그 로드 (TTL 캐시).
 *
 * @param {boolean} [force=false] 캐시 무시
 * @returns {Promise<{ oauthRequireServerVerify: boolean, background401KeepUser: boolean, softFailEnabled: boolean }>}
 */
export async function loadSessionSecurityFlags(force = false) {
  const now = Date.now();
  const cachedAtMs = getSessionSecurityFlagsCachedAtMs();
  if (!force && cachedAtMs > 0 && now - cachedAtMs < SESSION_SECURITY_FLAGS_CACHE_TTL_MS) {
    return getCachedSessionSecurityFlags();
  }
  const existingInflight = getSessionSecurityFlagsInflight();
  if (!force && existingInflight) {
    return existingInflight;
  }

  const inflight = (async() => {
    try {
      const raw = await StandardizedApi.get(SESSION_SECURITY_FLAGS_PATH, {}, {
        unwrapApiEnvelope: false
      });
      const data =
        raw && typeof raw === 'object' && 'success' in raw && 'data' in raw
          ? raw.data
          : raw;
      if (data && typeof data === 'object') {
        commitSessionSecurityFlags({
          oauthRequireServerVerify:
            data.oauthRequireServerVerify !== false
              ? Boolean(data.oauthRequireServerVerify ?? true)
              : false,
          background401KeepUser: data.background401KeepUser === true,
          softFailEnabled: data.softFailEnabled !== false
        });
        const ttl = Number(data.cacheTtlMs);
        if (Number.isFinite(ttl) && ttl > 0) {
          // 서버 TTL 힌트는 상수와 동일 범위로만 반영(클라 상수가 SSOT)
        }
      } else {
        touchSessionSecurityFlagsCacheAt();
      }
    } catch (e) {
      console.warn('세션 보안 플래그 로드 실패 — 기본값 유지:', e?.message);
      if (getSessionSecurityFlagsCachedAtMs() === 0) {
        commitSessionSecurityFlags({ ...SESSION_SECURITY_FLAG_DEFAULTS });
      } else {
        touchSessionSecurityFlagsCacheAt();
      }
    } finally {
      setSessionSecurityFlagsInflight(null);
    }
    return getCachedSessionSecurityFlags();
  })();

  setSessionSecurityFlagsInflight(inflight);
  return inflight;
}
