/**
 * 회기 승계 이력 포맷·API 응답 매핑.
 * 사용자 노출 동사·헤드라인은 전부 「승계」(레거시 API 「이관」 정규화).
 *
 * @author CoreSolution
 * @since 2026-09-14
 */

import {
  SESSION_TRANSFER_DIRECTION,
  SESSION_TRANSFER_HISTORY_UI,
  SESSION_TRANSFER_VERB
} from '../constants/sessionTransferHistory';
import { toDisplayString, toSafeNumber } from './safeDisplay';

/**
 * 방향 → 표시 동사(승계). OUTGOING·INCOMING 모두 동일.
 *
 * @param {string|null|undefined} direction
 * @returns {string}
 */
export function resolveSessionTransferVerb(direction) {
  if (direction === SESSION_TRANSFER_DIRECTION.INCOMING) {
    return SESSION_TRANSFER_VERB[SESSION_TRANSFER_DIRECTION.INCOMING];
  }
  return SESSION_TRANSFER_VERB[SESSION_TRANSFER_DIRECTION.OUTGOING];
}

/**
 * API·호출자가 넘긴 동사를 화면용 「승계」로 정규화한다.
 *
 * @param {string|null|undefined} verb
 * @param {string|null|undefined} direction
 * @returns {string}
 */
export function normalizeSessionTransferVerb(verb, direction) {
  const trimmed = verb != null && String(verb).trim() ? String(verb).trim() : '';
  if (!trimmed || trimmed === SESSION_TRANSFER_HISTORY_UI.LEGACY_VERB_TRANSFER) {
    return resolveSessionTransferVerb(direction);
  }
  return trimmed;
}

/**
 * {@code 임선희 → 김예린: 6회 승계} 헤드라인.
 *
 * @param {Object} params
 * @param {string|null|undefined} params.fromClientName
 * @param {string|null|undefined} params.toClientName
 * @param {number|string|null|undefined} params.sessionCount
 * @param {string|null|undefined} params.direction
 * @param {string|null|undefined} params.verb
 * @returns {string}
 */
export function formatSessionTransferHeadline({
  fromClientName,
  toClientName,
  sessionCount,
  direction,
  verb
} = {}) {
  const from = toDisplayString(fromClientName, SESSION_TRANSFER_HISTORY_UI.UNKNOWN_NAME);
  const to = toDisplayString(toClientName, SESSION_TRANSFER_HISTORY_UI.UNKNOWN_NAME);
  const count = toSafeNumber(sessionCount, 0);
  const resolvedVerb = normalizeSessionTransferVerb(verb, direction);
  return SESSION_TRANSFER_HISTORY_UI.HEADLINE_FMT
    .replace('{from}', from)
    .replace('{to}', to)
    .replace('{count}', String(count))
    .replace('{verb}', resolvedVerb);
}

/**
 * 매핑 ID 표시.
 *
 * @param {number|string|null|undefined} fromMappingId
 * @param {number|string|null|undefined} toMappingId
 * @returns {string|null}
 */
export function formatSessionTransferMappingIds(fromMappingId, toMappingId) {
  if (fromMappingId == null && toMappingId == null) {
    return null;
  }
  return SESSION_TRANSFER_HISTORY_UI.MAPPING_ARROW_FMT
    .replace('{from}', toDisplayString(fromMappingId, '—'))
    .replace('{to}', toDisplayString(toMappingId, '—'));
}

/**
 * API 헤드라인에 남은 「이관」을 「승계」로 치환한다.
 *
 * @param {string} headline
 * @returns {string}
 */
function normalizeLegacyHeadlineVerb(headline) {
  const legacy = SESSION_TRANSFER_HISTORY_UI.LEGACY_VERB_TRANSFER;
  if (!headline || !headline.includes(legacy)) {
    return headline;
  }
  return headline.split(legacy).join(SESSION_TRANSFER_VERB[SESSION_TRANSFER_DIRECTION.OUTGOING]);
}

/**
 * API 항목 → 화면용 정규화(헤드라인 포함).
 *
 * @param {Object|null|undefined} raw
 * @returns {Object|null}
 */
export function mapSessionTransferHistoryItem(raw) {
  if (raw == null || typeof raw !== 'object') {
    return null;
  }
  const direction = toDisplayString(raw.direction, SESSION_TRANSFER_DIRECTION.OUTGOING);
  const verb = normalizeSessionTransferVerb(raw.verb, direction);
  const rebuilt = formatSessionTransferHeadline({
    fromClientName: raw.fromClientName,
    toClientName: raw.toClientName,
    sessionCount: raw.sessionCount,
    direction,
    verb
  });
  const headline = raw.headline && String(raw.headline).trim()
    ? normalizeLegacyHeadlineVerb(String(raw.headline).trim())
    : rebuilt;
  return {
    id: raw.id ?? null,
    occurredAt: raw.occurredAt ?? null,
    sessionCount: toSafeNumber(raw.sessionCount, 0),
    fromClientId: raw.fromClientId ?? null,
    fromClientName: toDisplayString(raw.fromClientName, SESSION_TRANSFER_HISTORY_UI.UNKNOWN_NAME),
    toClientId: raw.toClientId ?? null,
    toClientName: toDisplayString(raw.toClientName, SESSION_TRANSFER_HISTORY_UI.UNKNOWN_NAME),
    fromMappingId: raw.fromMappingId ?? null,
    toMappingId: raw.toMappingId ?? null,
    reason: raw.reason != null && String(raw.reason).trim() ? String(raw.reason).trim() : null,
    direction,
    verb,
    headline,
    recordSource: raw.recordSource ?? null,
    mappingIdsLabel: formatSessionTransferMappingIds(raw.fromMappingId, raw.toMappingId)
  };
}

/**
 * StandardizedApi 응답(또는 { items }) → 항목 배열.
 *
 * @param {*} payload
 * @returns {Object[]}
 */
export function mapSessionTransferHistoryResponse(payload) {
  const items = Array.isArray(payload?.items)
    ? payload.items
    : (Array.isArray(payload) ? payload : []);
  return items
    .map(mapSessionTransferHistoryItem)
    .filter(Boolean);
}
