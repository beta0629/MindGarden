/**
 * 상담사 마음 날씨 수신함 (StandardizedApi, ApiResponse unwrap)
 *
 * @author MindGarden
 * @since 2026-05-16
 */

import StandardizedApi from '../utils/standardizedApi';
import { MIND_WEATHER_API } from '../constants/api';
import { toDisplayString, toSafeNumber } from '../utils/safeDisplay';

/**
 * @param {*} k
 * @param {number} idx
 * @returns {{ key: string, label: string, weight: number, polarity: number }}
 */
function normalizeKeyword(k, idx) {
  return {
    key: toDisplayString(k?.key ?? k?.code, `키워드 ${idx + 1}`),
    label: toDisplayString(k?.label, ''),
    weight: toSafeNumber(k?.weight, 0),
    polarity: toSafeNumber(k?.polarity, 0)
  };
}

/**
 * @param {*} s
 * @returns {{ summary: boolean, original: boolean, consultantId: number|null, updatedAt: string }|null}
 */
function normalizeShare(s) {
  if (s == null || typeof s !== 'object') {
    return null;
  }
  const cidRaw = s.consultantId;
  let consultantId = null;
  if (cidRaw != null && cidRaw !== '') {
    const n = toSafeNumber(cidRaw, Number.NaN);
    if (Number.isFinite(n)) {
      consultantId = n;
    }
  }
  return {
    summary: Boolean(s.summary),
    original: Boolean(s.original),
    consultantId,
    updatedAt: toDisplayString(s.updatedAt, '')
  };
}

/**
 * @param {*} raw
 * @returns {number|null}
 */
function pickInboxClientId(raw) {
  if (raw == null || typeof raw !== 'object') {
    return null;
  }
  const cid = raw.clientId ?? raw.client_id ?? raw.userId ?? raw.user_id;
  if (cid != null && cid !== '') {
    const n = toSafeNumber(cid, Number.NaN);
    if (Number.isFinite(n) && n > 0) {
      return n;
    }
  }
  const c = raw.client;
  if (c != null && typeof c === 'object') {
    const id = c.id ?? c.userId ?? c.clientId;
    if (id != null && id !== '') {
      const n = toSafeNumber(id, Number.NaN);
      if (Number.isFinite(n) && n > 0) {
        return n;
      }
    }
  }
  return null;
}

/**
 * @param {*} raw
 * @returns {string}
 */
function pickInboxClientName(raw) {
  if (raw == null || typeof raw !== 'object') {
    return '';
  }
  const flat = toDisplayString(raw.clientName ?? raw.client_name ?? raw.userName, '').trim();
  if (flat) {
    return flat;
  }
  const c = raw.client;
  if (c != null && typeof c === 'object' && c.name != null) {
    return toDisplayString(c.name, '').trim();
  }
  return '';
}

/**
 * @param {*} raw
 * @param {number} idx
 * @returns {{
 *   id: string,
 *   clientId: number|null,
 *   clientName: string,
 *   source: string,
 *   text: string,
 *   summary: string,
 *   tone: string,
 *   keywords: Array<{ key: string, label: string, weight: number, polarity: number }>,
 *   share: { summary: boolean, original: boolean, consultantId: number|null, updatedAt: string }|null,
 *   createdAt: string
 * }}
 */
export function normalizeMindWeatherInboxItem(raw, idx) {
  const idRaw = raw?.id ?? raw?.cardId;
  const clientId = pickInboxClientId(raw);
  return {
    id: idRaw != null && String(idRaw).trim() !== ''
      ? String(idRaw)
      : `row-${idx}`,
    clientId,
    clientName: pickInboxClientName(raw),
    source: toDisplayString(raw?.source, ''),
    text: toDisplayString(raw?.text, ''),
    summary: toDisplayString(raw?.summary, ''),
    tone: toDisplayString(raw?.tone, ''),
    keywords: Array.isArray(raw?.keywords)
      ? raw.keywords.map((k, i) => normalizeKeyword(k, i))
      : [],
    share: normalizeShare(raw?.share),
    createdAt: toDisplayString(raw?.createdAt, '')
  };
}

/**
 * ApiResponse unwrap 후 배열이 아닌 경우 보정
 * @param {*} raw
 * @returns {Array<*>}
 */
function coerceInboxList(raw) {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (raw != null && typeof raw === 'object') {
    if (Array.isArray(raw.data)) {
      return raw.data;
    }
    if (Array.isArray(raw.items)) {
      return raw.items;
    }
  }
  return [];
}

/**
 * @returns {Promise<Array<ReturnType<typeof normalizeMindWeatherInboxItem>>>}
 */
export async function fetchConsultantMindWeatherInbox() {
  const raw = await StandardizedApi.get(MIND_WEATHER_API.INBOX, {});
  const list = coerceInboxList(raw);
  return list.map((item, idx) => normalizeMindWeatherInboxItem(item, idx));
}
