/**
 * 세션 보안 플래그 동기 캐시 (API 레이어 비의존).
 * ajax ↔ sessionAuthPolicy 순환을 끊기 위해 load(API)와 분리.
 *
 * @author MindGarden
 * @since 2026-09-26
 */

import { SESSION_SECURITY_FLAG_DEFAULTS } from '../constants/session';

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
 * @returns {number}
 */
export function getSessionSecurityFlagsCachedAtMs() {
  return cachedAtMs;
}

/**
 * @returns {Promise<SessionSecurityFlags>|null}
 */
export function getSessionSecurityFlagsInflight() {
  return inflight;
}

/**
 * @param {Promise<SessionSecurityFlags>|null} promise
 */
export function setSessionSecurityFlagsInflight(promise) {
  inflight = promise;
}

/**
 * 로드 결과 반영.
 * @param {SessionSecurityFlags} flags
 */
export function commitSessionSecurityFlags(flags) {
  cachedFlags = { ...flags };
  cachedAtMs = Date.now();
}

/**
 * 플래그 값 유지, 캐시 시각만 갱신 (로드 성공·실패 공통 finally 대체).
 */
export function touchSessionSecurityFlagsCacheAt() {
  cachedAtMs = Date.now();
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
