/**
 * 상담일지 SCT 레일 — 접힘·제출 열람 시각 localStorage SSOT.
 * open: consultantId × invitationId (open.v1)
 * seen: consultantId × clientId (seenSubmitted.v2) — 초대가 바뀌어도 동일 내담자 기준 유지
 *
 * @author MindGarden
 * @since 2026-03-25
 */

export const SCT_JOURNAL_PANEL_STORAGE = Object.freeze({
  OPEN_PREFIX: 'mg.sctJournalPanel.open.v1',
  SEEN_PREFIX: 'mg.sctJournalPanel.seenSubmitted.v2',
  OPEN: '1',
  CLOSED: '0'
});

/**
 * @param {unknown} value
 * @returns {string|null} 파싱 가능한 ISO 또는 null (절대 throw 하지 않음)
 */
function normalizeSeenSubmittedAt(value) {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s) return null;
  if (!Number.isFinite(Date.parse(s))) return null;
  return s;
}

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
 * seen v2 — consultantId × clientId (journal client)
 *
 * @param {string|number|null|undefined} consultantId
 * @param {string|number|null|undefined} clientId
 * @returns {string|null}
 */
export function buildSctJournalPanelSeenKey(consultantId, clientId) {
  if (consultantId == null || clientId == null) return null;
  const c = String(consultantId).trim();
  const client = String(clientId).trim();
  if (!c || !client) return null;
  return `${SCT_JOURNAL_PANEL_STORAGE.SEEN_PREFIX}:${c}:${client}`;
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
 * 저장된 seen 값에서 submittedAt 추출.
 * 허용: plain ISO 문자열 · JSON `{"submittedAt":"..."}` · 그 외/깨진 값 → null (never throw)
 *
 * @param {string|null} key
 * @returns {string|null} ISO string or null
 */
export function readSctJournalPanelSeenSubmittedAt(key) {
  if (!key || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (raw == null || String(raw).trim() === '') return null;
    const trimmed = String(raw).trim();
    if (trimmed.charAt(0) === '{') {
      const parsed = JSON.parse(trimmed);
      return normalizeSeenSubmittedAt(parsed && parsed.submittedAt);
    }
    return normalizeSeenSubmittedAt(trimmed);
  } catch {
    return null;
  }
}

/**
 * @param {string|null} key
 * @param {string} iso
 * @param {string|number|null|undefined} [invitationId] 디버깅용 — 있으면 JSON 저장
 */
export function writeSctJournalPanelSeenSubmittedAt(key, iso, invitationId) {
  if (!key || !iso || typeof localStorage === 'undefined') return;
  try {
    const submittedAt = String(iso);
    const hasInvite =
      invitationId != null && String(invitationId).trim() !== '';
    const value = hasInvite
      ? JSON.stringify({
        submittedAt,
        invitationId: Number(invitationId) || invitationId
      })
      : submittedAt;
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

/**
 * 이전 열람(seen)이 있고 submittedAt 이 그보다 이후일 때만 방금 제출(fresh).
 * 첫 열람(seen 없음)은 fresh=false — 배지는 일반 제출일 카피.
 *
 * @param {string|null|undefined} submittedAt
 * @param {string|null|undefined} lastSeenIso
 * @returns {boolean}
 */
export function isSctJournalPanelFreshSubmit(submittedAt, lastSeenIso) {
  if (submittedAt == null || String(submittedAt).trim() === '') return false;
  if (lastSeenIso == null || String(lastSeenIso).trim() === '') return false;
  const submittedMs = Date.parse(String(submittedAt));
  const seenMs = Date.parse(String(lastSeenIso));
  if (!Number.isFinite(submittedMs)) return false;
  if (!Number.isFinite(seenMs)) return false;
  return submittedMs > seenMs;
}

/**
 * 데스크톱(≥1180)에서만 초기 펼침 여부 결정.
 * - localStorage 에 접힘 기억이 있으면 그대로
 * - stored unset(첫 열람) 또는 fresh submit 이면 펼침
 * - fresh 는 seen 존재 + submittedAt > seen 일 때만 true (첫 열람은 fresh=false 라도 open)
 * - 모바일은 항상 open false (시트 자동 오픈 금지)
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
  // unset(첫 열람) 또는 fresh → 자동 펼침
  if (stored == null || fresh) {
    return { open: true, fresh };
  }
  return { open: false, fresh: false };
}
