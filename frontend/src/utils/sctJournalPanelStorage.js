/**
 * 상담일지 SCT 레일 — 접힘·제출 열람 시각 localStorage SSOT.
 * 키는 consultantId × invitationId 로만 스코프한다 (서버 스키마/API 없음).
 *
 * @author MindGarden
 * @since 2026-03-25
 */

export const SCT_JOURNAL_PANEL_STORAGE = Object.freeze({
  OPEN_PREFIX: 'mg.sctJournalPanel.open.v1',
  SEEN_PREFIX: 'mg.sctJournalPanel.seenSubmitted.v1',
  OPEN: '1',
  CLOSED: '0'
});

/**
 * @param {string|number|null|undefined} consultantId
 * @param {string|number|null|undefined} invitationId
 * @returns {string|null}
 */
export function buildSctJournalPanelOpenKey(consultantId, invitationId) {
  if (consultantId == null || invitationId == null) return null;
  const c = String(consultantId).trim();
  const i = String(invitationId).trim();
  if (!c || !i) return null;
  return `${SCT_JOURNAL_PANEL_STORAGE.OPEN_PREFIX}:${c}:${i}`;
}

/**
 * @param {string|number|null|undefined} consultantId
 * @param {string|number|null|undefined} invitationId
 * @returns {string|null}
 */
export function buildSctJournalPanelSeenKey(consultantId, invitationId) {
  if (consultantId == null || invitationId == null) return null;
  const c = String(consultantId).trim();
  const i = String(invitationId).trim();
  if (!c || !i) return null;
  return `${SCT_JOURNAL_PANEL_STORAGE.SEEN_PREFIX}:${c}:${i}`;
}

/**
 * @param {string|null} key
 * @returns {boolean|null} true=open, false=closed, null=unset
 */
export function readSctJournalPanelOpenState(key) {
  if (!key || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (raw === SCT_JOURNAL_PANEL_STORAGE.OPEN) return true;
    if (raw === SCT_JOURNAL_PANEL_STORAGE.CLOSED) return false;
    return null;
  } catch {
    return null;
  }
}

/**
 * @param {string|null} key
 * @param {boolean} isOpen
 */
export function writeSctJournalPanelOpenState(key, isOpen) {
  if (!key || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(
      key,
      isOpen ? SCT_JOURNAL_PANEL_STORAGE.OPEN : SCT_JOURNAL_PANEL_STORAGE.CLOSED
    );
  } catch {
    // quota / private mode — ignore
  }
}

/**
 * @param {string|null} key
 * @returns {string|null} ISO string or null
 */
export function readSctJournalPanelSeenSubmittedAt(key) {
  if (!key || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (raw == null || String(raw).trim() === '') return null;
    return String(raw).trim();
  } catch {
    return null;
  }
}

/**
 * @param {string|null} key
 * @param {string} iso
 */
export function writeSctJournalPanelSeenSubmittedAt(key, iso) {
  if (!key || !iso || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, String(iso));
  } catch {
    // ignore
  }
}

/**
 * submittedAt 이 lastSeen 보다 이후면 방금 제출(fresh).
 *
 * @param {string|null|undefined} submittedAt
 * @param {string|null|undefined} lastSeenIso
 * @returns {boolean}
 */
export function isSctJournalPanelFreshSubmit(submittedAt, lastSeenIso) {
  if (submittedAt == null || String(submittedAt).trim() === '') return false;
  if (lastSeenIso == null || String(lastSeenIso).trim() === '') return true;
  const submittedMs = Date.parse(String(submittedAt));
  const seenMs = Date.parse(String(lastSeenIso));
  if (!Number.isFinite(submittedMs)) return false;
  if (!Number.isFinite(seenMs)) return true;
  return submittedMs > seenMs;
}

/**
 * 데스크톱(≥1180)에서만 초기 펼침 여부 결정.
 * - localStorage 에 접힘 기억이 있으면 그대로
 * - 없거나 fresh submit 이면 펼침
 * - 모바일은 항상 false (시트 자동 오픈 금지)
 *
 * @param {{
 *   isDesktopWide: boolean,
 *   openKey: string|null,
 *   seenKey: string|null,
 *   submittedAt?: string|null
 * }} params
 * @returns {{ open: boolean, fresh: boolean }}
 */
export function resolveSctJournalPanelInitialOpen({
  isDesktopWide,
  openKey,
  seenKey,
  submittedAt
}) {
  const lastSeen = readSctJournalPanelSeenSubmittedAt(seenKey);
  const fresh = isSctJournalPanelFreshSubmit(submittedAt, lastSeen);
  if (!isDesktopWide) {
    return { open: false, fresh };
  }
  const stored = readSctJournalPanelOpenState(openKey);
  if (stored === false && !fresh) {
    return { open: false, fresh: false };
  }
  if (stored === true) {
    return { open: true, fresh };
  }
  // unset 또는 fresh → 첫 열람 / 방금 제출 자동 펼침
  if (stored == null || fresh) {
    return { open: true, fresh };
  }
  return { open: false, fresh: false };
}
