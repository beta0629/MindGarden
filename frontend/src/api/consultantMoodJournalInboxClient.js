/**
 * 상담사 감정 일기 수신함 (StandardizedApi, ApiResponse unwrap)
 * 공유 동의되지 않은 항목은 fail-closed 필터.
 *
 * @author MindGarden
 * @since 2026-09-03
 */

import StandardizedApi from '../utils/standardizedApi';
import { MOOD_JOURNAL_API } from '../constants/api';
import { toDisplayString, toSafeNumber } from '../utils/safeDisplay';

/**
 * @param {*} raw
 * @returns {number|null}
 */
function pickInboxClientId(raw) {
  if (raw == null || typeof raw !== 'object') {
    return null;
  }
  const cid = raw.clientId ?? raw.clientUserId ?? raw.client_id ?? raw.userId;
  if (cid != null && cid !== '') {
    const n = toSafeNumber(cid, Number.NaN);
    if (Number.isFinite(n) && n > 0) {
      return n;
    }
  }
  return null;
}

/**
 * @param {*} raw
 * @returns {boolean}
 */
function isSharedWithConsultant(raw) {
  if (raw == null || typeof raw !== 'object') {
    return false;
  }
  if (!('sharedWithConsultant' in raw) && !('shareWithConsultant' in raw)) {
    // API가 공유 동의 항목만 반환한다고 가정 — 필드 없으면 통과
    return true;
  }
  return Boolean(raw.sharedWithConsultant ?? raw.shareWithConsultant);
}

/**
 * @param {*} raw
 * @param {number} idx
 * @returns {{
 *   id: string,
 *   clientId: number|null,
 *   clientName: string,
 *   date: string,
 *   moodValue: number,
 *   emoji: string,
 *   tags: string[],
 *   memo: string,
 *   sharedWithConsultant: boolean,
 *   createdAt: string
 * }|null}
 */
export function normalizeMoodJournalInboxItem(raw, idx) {
  if (raw == null || typeof raw !== 'object') {
    return null;
  }
  if (!isSharedWithConsultant(raw)) {
    return null;
  }
  const date = toDisplayString(raw.date ?? raw.journalDate, '');
  const idRaw = raw.id;
  const id = idRaw != null && String(idRaw).trim() !== ''
    ? String(idRaw)
    : `row-${idx}`;
  const tagsRaw = raw.tags ?? raw.emotionTags;
  const tags = Array.isArray(tagsRaw)
    ? tagsRaw.filter((t) => typeof t === 'string').map((t) => String(t))
    : [];
  return {
    id,
    clientId: pickInboxClientId(raw),
    clientName: toDisplayString(raw.clientName, '').trim(),
    date,
    moodValue: toSafeNumber(raw.moodValue ?? raw.mood, 0),
    emoji: toDisplayString(raw.emoji, ''),
    tags,
    memo: toDisplayString(raw.memo ?? raw.note, ''),
    sharedWithConsultant: true,
    createdAt: toDisplayString(raw.createdAt ?? raw.created_at, '')
  };
}

/**
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
    if (Array.isArray(raw.content)) {
      return raw.content;
    }
  }
  return [];
}

/**
 * @returns {Promise<Array<NonNullable<ReturnType<typeof normalizeMoodJournalInboxItem>>>>}
 */
export async function fetchConsultantMoodJournalInbox() {
  const raw = await StandardizedApi.get(MOOD_JOURNAL_API.INBOX, {});
  const list = coerceInboxList(raw);
  return list
    .map((item, idx) => normalizeMoodJournalInboxItem(item, idx))
    .filter((item) => item != null);
}
