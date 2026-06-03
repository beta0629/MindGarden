/**
 * 어드민 콘텐츠 마스터 자동 채움 헬퍼.
 *
 * 사용자가 콘텐츠 등록 시 입력해야 하는 필드를 최소화하기 위해
 * 제목·콘텐츠 URL·본문 길이로부터 code/slug/mediaType/sortOrder/readMinutes 를 추론한다.
 *
 * 단위 테스트는 frontend/src/components/admin/__tests__/AdminContentMasterPage.helpers.test.js 참고.
 *
 * @author CoreSolution
 * @since 2026-06-03
 */

const SLUG_MAX_LEN = 56;
const SLUG_EPOCH_DIGITS = 6;
const DEFAULT_READ_MINUTES = 5;
const READ_MINUTES_CHARS_PER_MIN = 350;
const SORT_ORDER_STEP = 10;
const SORT_ORDER_INITIAL = 10;
const HEALING_MEDIA_TYPES = ['MEDITATION', 'ARTICLE', 'AUDIO', 'VIDEO'];
const DEFAULT_HEALING_MEDIA_TYPE = 'ARTICLE';

export const HEALING_MEDIA_TYPE_OPTIONS = Object.freeze([
  { value: 'MEDITATION', label: '명상' },
  { value: 'ARTICLE', label: '글' },
  { value: 'AUDIO', label: '오디오' },
  { value: 'VIDEO', label: '영상' }
]);

/**
 * 한글·특수문자를 제거하고 영숫자·dash 만 남기는 슬러그 변환.
 * @param {string} text
 * @returns {string}
 */
export function slugify(text) {
  const str = typeof text === 'string' ? text : '';
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX_LEN);
}

function epochSuffix() {
  return String(Date.now()).slice(-SLUG_EPOCH_DIGITS);
}

/**
 * 힐링 카탈로그 code 자동 생성. 슬러그 + epoch 뒷자리.
 * 사용자가 한글 제목만 입력해도 고유 식별자가 생긴다.
 * @param {string} title
 * @returns {string}
 */
export function generateHealingCode(title) {
  const base = slugify(title);
  const suffix = epochSuffix();
  if (!base) {
    return `healing-${suffix}`;
  }
  return `${base}-${suffix}`;
}

/**
 * 심리교육 slug 자동 생성. 동일 패턴.
 * @param {string} title
 * @returns {string}
 */
export function generatePsychoSlug(title) {
  const base = slugify(title);
  const suffix = epochSuffix();
  if (!base) {
    return `psycho-${suffix}`;
  }
  return `${base}-${suffix}`;
}

/**
 * 본문 글자수 기반 예상 읽기 시간 추정. 한글 350자/분 기준.
 * @param {string} body
 * @returns {number}
 */
export function estimateReadMinutes(body) {
  const str = typeof body === 'string' ? body : '';
  const trimmed = str.trim();
  if (!trimmed) {
    return DEFAULT_READ_MINUTES;
  }
  return Math.max(1, Math.ceil(trimmed.length / READ_MINUTES_CHARS_PER_MIN));
}

/**
 * 다음 sortOrder 자동 부여. 현재 max + 10.
 * @param {Array<{sortOrder?: number}>} rows
 * @returns {number}
 */
export function nextSortOrder(rows) {
  const arr = Array.isArray(rows) ? rows : [];
  let maxVal = 0;
  let found = false;
  for (const row of arr) {
    if (!row || typeof row !== 'object') {
      continue;
    }
    const v = Number(row.sortOrder);
    if (Number.isFinite(v)) {
      if (!found || v > maxVal) {
        maxVal = v;
        found = true;
      }
    }
  }
  return found ? maxVal + SORT_ORDER_STEP : SORT_ORDER_INITIAL;
}

/**
 * 콘텐츠 URL 기반 mediaType 추론.
 * - .mp3/.wav/.m4a/.aac → AUDIO
 * - .mp4/youtube/youtu.be/vimeo → VIDEO
 * - meditation 경로 또는 명상 키워드 → MEDITATION
 * - 그 외 → ARTICLE
 *
 * @param {string} contentUrl
 * @returns {string} HealingContentMediaType
 */
export function inferMediaType(contentUrl) {
  const url = typeof contentUrl === 'string' ? contentUrl.toLowerCase().trim() : '';
  if (!url) {
    return DEFAULT_HEALING_MEDIA_TYPE;
  }
  if (/(youtube\.com|youtu\.be|vimeo\.com)/.test(url) || /\.(mp4|mov|webm|m4v)(\?|#|$)/.test(url)) {
    return 'VIDEO';
  }
  if (/\.(mp3|wav|m4a|aac|ogg|flac)(\?|#|$)/.test(url)) {
    return 'AUDIO';
  }
  if (/meditation|\/명상|mindful/.test(url)) {
    return 'MEDITATION';
  }
  return 'ARTICLE';
}

/**
 * mediaType 유효성 가드. 빈 값/오타 시 ARTICLE 로 폴백.
 * @param {string} value
 * @returns {string}
 */
export function normalizeMediaType(value) {
  const str = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (HEALING_MEDIA_TYPES.includes(str)) {
    return str;
  }
  return DEFAULT_HEALING_MEDIA_TYPE;
}

export const CONTENT_MASTER_DEFAULTS = Object.freeze({
  DEFAULT_HEALING_MEDIA_TYPE,
  DEFAULT_READ_MINUTES,
  SORT_ORDER_INITIAL,
  SORT_ORDER_STEP
});
