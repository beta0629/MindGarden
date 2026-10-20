/**
 * 서버 시각 SSOT — offset 저장·동기화·getNow().
 * 표시 zone 은 호출측 DEFAULT_ZONE(Asia/Seoul) 유지.
 *
 * 공개 GET /api/v1/time 은 session-info 부작용을 피하기 위해 thin fetch 사용
 * (StandardizedApi 세션 갱신·tenant 헤더 경로 우회).
 * 앱 시작에서 startServerClockSync() 를 한 번 호출하면 즉시·주기·온라인 복귀에 동기화한다.
 *
 * @author CoreSolution
 * @since 2026-10-14
 */

import { getApiBaseUrl, SYSTEM_TIME_API } from '../constants/api';
import { DEFAULT_ZONE } from './zonedDateTime';

/** 서버 시각 재동기화 간격. 10분. */
export const SERVER_CLOCK_SYNC_INTERVAL_MS = 10 * 60 * 1000;

/** @type {number|null} serverEpoch - (t0 + rtt/2) */
let offsetMs = null;
/** @type {boolean} */
let synced = false;
/** @type {string} */
let serverZone = DEFAULT_ZONE;
/** @type {boolean} */
let syncLoopStarted = false;
/** @type {ReturnType<typeof setInterval>|null} */
let syncIntervalId = null;
/** @type {(() => void)|null} */
let onlineHandler = null;
/** @type {(() => void)|null} */
let visibilityHandler = null;

/**
 * RTT 절반 보정 offset 계산.
 * offset = serverEpoch - (t0 + rtt/2)
 *
 * @param {number} serverEpochMillis
 * @param {number} t0 요청 직전 Date.now()
 * @param {number} t1 응답 직후 Date.now()
 * @returns {number}
 */
export const computeServerClockOffset = (serverEpochMillis, t0, t1) => {
  const rtt = Math.max(0, Number(t1) - Number(t0));
  return Number(serverEpochMillis) - (Number(t0) + rtt / 2);
};

/**
 * @returns {boolean}
 */
export const isServerClockSynced = () => synced && offsetMs != null;

/**
 * @returns {number|null}
 */
export const getServerClockOffsetMs = () => offsetMs;

/**
 * @returns {string}
 */
export const getServerClockZone = () => serverZone || DEFAULT_ZONE;

/**
 * 온라인 + 동기화 성공 → Date.now() + offset
 * 오프라인 또는 미동기화 → Date.now()
 *
 * @returns {Date}
 */
export const getNow = () => {
  const deviceNow = Date.now();
  const online = typeof navigator === 'undefined' || navigator.onLine !== false;
  if (online && synced && offsetMs != null) {
    return new Date(deviceNow + offsetMs);
  }
  return new Date(deviceNow);
};

/**
 * 테스트·리셋용.
 */
export const resetServerClock = () => {
  offsetMs = null;
  synced = false;
  serverZone = DEFAULT_ZONE;
};

/**
 * 테스트에서 offset 을 직접 주입.
 *
 * @param {number|null} nextOffset
 * @param {{ synced?: boolean, zone?: string }} [meta]
 */
export const setServerClockOffsetForTest = (nextOffset, meta = {}) => {
  offsetMs = nextOffset;
  synced = meta.synced !== undefined ? Boolean(meta.synced) : nextOffset != null;
  if (meta.zone) {
    serverZone = meta.zone;
  }
};

/**
 * ApiResponse 래퍼 또는 평문 body 에서 epochMillis·zone 추출.
 *
 * @param {unknown} json
 * @returns {{ epochMillis: number, zone?: string }|null}
 */
export const parseServerTimePayload = (json) => {
  if (!json || typeof json !== 'object') {
    return null;
  }
  const raw = (json.success === true || json.success === false) && json.data != null
    ? json.data
    : json;
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const epochMillis = Number(raw.epochMillis);
  if (!Number.isFinite(epochMillis)) {
    return null;
  }
  const zone = typeof raw.zone === 'string' && raw.zone ? raw.zone : undefined;
  return { epochMillis, zone };
};

/**
 * 서버와 offset 동기화. 실패 시 synced=false 유지(또는 해제하지 않고 이전 offset 유지 여부는 실패 시 미갱신).
 *
 * @returns {Promise<boolean>} 성공 여부
 */
export const syncServerClock = async () => {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return false;
  }

  const base = typeof getApiBaseUrl === 'function' ? getApiBaseUrl() : '';
  const path = SYSTEM_TIME_API.NOW;
  const url = `${base || ''}${path}`;

  const t0 = Date.now();
  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'omit',
      cache: 'no-store',
      headers: {
        Accept: 'application/json'
      }
    });
    const t1 = Date.now();
    if (!response.ok) {
      return false;
    }
    const json = await response.json();
    const parsed = parseServerTimePayload(json);
    if (!parsed) {
      return false;
    }
    offsetMs = computeServerClockOffset(parsed.epochMillis, t0, t1);
    synced = true;
    if (parsed.zone) {
      serverZone = parsed.zone;
    }
    return true;
  } catch {
    return false;
  }
};

/**
 * 앱 시작 시 한 번 호출. 즉시 동기화하고, 주기와 온라인·탭 복귀 때 다시 동기화한다.
 * 이미 시작했으면 리스너를 중복 등록하지 않는다.
 */
export const startServerClockSync = () => {
  if (syncLoopStarted) {
    return;
  }
  syncLoopStarted = true;
  syncServerClock();

  onlineHandler = () => {
    syncServerClock();
  };
  visibilityHandler = () => {
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
      return;
    }
    syncServerClock();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', onlineHandler);
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', visibilityHandler);
  }
  syncIntervalId = setInterval(() => {
    syncServerClock();
  }, SERVER_CLOCK_SYNC_INTERVAL_MS);
};

/**
 * 테스트에서 주기·리스너를 해제한다.
 */
export const stopServerClockSync = () => {
  if (typeof window !== 'undefined' && onlineHandler) {
    window.removeEventListener('online', onlineHandler);
  }
  if (typeof document !== 'undefined' && visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler);
  }
  if (syncIntervalId != null) {
    clearInterval(syncIntervalId);
  }
  syncIntervalId = null;
  onlineHandler = null;
  visibilityHandler = null;
  syncLoopStarted = false;
};

export default {
  getNow,
  syncServerClock,
  startServerClockSync,
  stopServerClockSync,
  computeServerClockOffset,
  isServerClockSynced,
  getServerClockOffsetMs,
  getServerClockZone,
  resetServerClock,
  parseServerTimePayload
};
