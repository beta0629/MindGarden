/**
 * SCT 초대 UI — 이름 마스킹·한국어 기한·QR URL 선택
 *
 * @author MindGarden
 * @since 2026-11-27
 */

/**
 * 한글 이름 마스킹.
 * - 1자: 그대로
 * - 2자: 김*
 * - 3자: 예*자
 * - 4자 이상: 첫·끝 유지, 가운데 *
 *
 * @param {string|null|undefined} name
 * @returns {string}
 */
export function maskKoreanName(name) {
  const raw = typeof name === 'string' ? name.trim() : '';
  if (!raw) return '';
  const chars = Array.from(raw);
  const n = chars.length;
  if (n === 1) return chars[0];
  if (n === 2) return `${chars[0]}*`;
  if (n === 3) return `${chars[0]}*${chars[2]}`;
  const mid = '*'.repeat(n - 2);
  return `${chars[0]}${mid}${chars[n - 1]}`;
}

/**
 * 초대 카드용 한국어 일시 — 월·일·시·분 (요일 없음).
 * 예: `12월 9일 23:59`
 *
 * @param {string|number|Date|null|undefined} iso
 * @returns {string}
 */
export function formatSctKoreanDateTime(iso) {
  if (iso == null || iso === '') return '';
  try {
    const d = iso instanceof Date ? iso : new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hour = String(d.getHours()).padStart(2, '0');
    const minute = String(d.getMinutes()).padStart(2, '0');
    return `${month}월 ${day}일 ${hour}:${minute}`;
  } catch {
    return '';
  }
}

/**
 * 기한 카피 — `12월 9일 23:59까지`
 *
 * @param {string|number|Date|null|undefined} iso
 * @returns {string}
 */
export function formatSctExpiryUntil(iso) {
  const base = formatSctKoreanDateTime(iso);
  return base ? `${base}까지` : '';
}

/**
 * QR·복사용 절대 URL — absoluteShortUrl 우선, 없으면 absoluteUrl / publicUrl.
 *
 * @param {{
 *   absoluteShortUrl?: string|null,
 *   shortUrl?: string|null,
 *   absoluteUrl?: string|null,
 *   publicUrl?: string|null
 * }|null|undefined} invitation
 * @param {string} [origin=typeof window !== 'undefined' ? window.location.origin : '']
 * @returns {string}
 */
export function resolveSctInviteQrUrl(invitation, origin) {
  if (!invitation || typeof invitation !== 'object') return '';
  const absShort = typeof invitation.absoluteShortUrl === 'string'
    ? invitation.absoluteShortUrl.trim()
    : '';
  if (absShort) return absShort;

  const abs = typeof invitation.absoluteUrl === 'string'
    ? invitation.absoluteUrl.trim()
    : '';
  if (abs) return abs;

  const shortRel = typeof invitation.shortUrl === 'string'
    ? invitation.shortUrl.trim()
    : '';
  const pub = typeof invitation.publicUrl === 'string'
    ? invitation.publicUrl.trim()
    : '';
  const rel = shortRel || pub;
  if (!rel) return '';
  if (rel.startsWith('http://') || rel.startsWith('https://')) return rel;
  const base = origin != null
    ? origin
    : (typeof window !== 'undefined' && window.location ? window.location.origin : '');
  if (!base) return rel;
  return `${base.replace(/\/$/, '')}${rel.startsWith('/') ? rel : `/${rel}`}`;
}

/**
 * tel: href용 — 숫자·+ 만 남김.
 *
 * @param {string|null|undefined} phone
 * @returns {string}
 */
export function toSctTelHref(phone) {
  const raw = typeof phone === 'string' ? phone.trim() : '';
  if (!raw) return '';
  const cleaned = raw.replace(/[^\d+]/g, '');
  return cleaned ? `tel:${cleaned}` : '';
}
