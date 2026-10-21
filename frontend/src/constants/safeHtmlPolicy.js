/**
 * HTML 정화 허용 목록.
 * 태그·속성·프로토콜은 여기만 두고, sanitizer 구현에 문자열로 박지 않는다.
 *
 * 힐링 본문(sanitizeHealingHtml)은 기존 허용 태그를 유지한다.
 * 공지·웰니스 본문(sanitizeRichNoticeHtml)은 스펙 허용 목록을 쓴다.
 *
 * @author MindGarden
 * @since 2026-10-21
 */

/** 힐링 카드·관리자 메시지 등 기존 sanitizeHealingHtml 허용 태그. 속성은 허용하지 않는다. */
export const HEALING_HTML_ALLOWED_TAGS = Object.freeze([
  'p', 'br', 'span', 'div', 'strong', 'em', 'b', 'i', 'u',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote'
]);

/** 힐링 본문은 속성을 남기지 않는다. */
export const HEALING_HTML_ALLOWED_ATTRIBUTES = Object.freeze([]);

/**
 * 공지·웰니스·시스템 공지 본문 허용 태그.
 * 제목(h1–h6), p, 목록, a, strong/b, em, br.
 */
export const RICH_NOTICE_ALLOWED_TAGS = Object.freeze([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'ul', 'ol', 'li', 'a', 'strong', 'b', 'em', 'br'
]);

/** 공지 본문에서 남기는 속성. 링크의 href 와 외부 링크 rel 만. */
export const RICH_NOTICE_ALLOWED_ATTRIBUTES = Object.freeze(['href', 'rel']);

/** 앵커 태그 이름. */
export const RICH_NOTICE_ANCHOR_TAG = 'a';

/** href 속성 이름. */
export const RICH_NOTICE_HREF_ATTRIBUTE = 'href';

/** rel 속성 이름. */
export const RICH_NOTICE_REL_ATTRIBUTE = 'rel';

/**
 * URL.protocol 형태(콜론 포함). http(s) 와 mailto 만.
 * javascript:, data:, vbscript: 는 여기 없다.
 */
export const RICH_NOTICE_ALLOWED_PROTOCOLS = Object.freeze(['http:', 'https:', 'mailto:']);

/**
 * 정화 후 href 가 시작해야 하는 접두사.
 * 상대 경로·프로토콜 상대(//)는 포함하지 않는다.
 */
export const RICH_NOTICE_ALLOWED_HREF_PREFIXES = Object.freeze([
  'https://',
  'http://',
  'mailto:'
]);

/** rel 을 붙이는 http(s) 절대 URL 접두사. */
export const RICH_NOTICE_HTTP_HREF_PREFIXES = Object.freeze([
  'https://',
  'http://'
]);

/** 태그와 그 안의 텍스트를 함께 버리는 태그. 그 외 비허용 태그는 태그만 벗긴다. */
export const RICH_NOTICE_DROP_CONTENT_TAGS = Object.freeze(['script', 'style', 'iframe']);

/** 외부 http(s) 링크에 붙이는 rel. */
export const RICH_NOTICE_EXTERNAL_LINK_REL = 'noopener noreferrer';

/** 프로토콜 난독화(엔티티·퍼센트 인코딩)를 푸는 최대 횟수. */
export const RICH_NOTICE_PROTOCOL_DECODE_PASSES = 5;
