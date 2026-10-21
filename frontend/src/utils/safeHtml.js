/**
 * SafeHtml — 신뢰되지 않은 HTML 렌더링용 공통 sanitizer.
 *
 * 내부 정화는 DOMPurify 가 담당한다. 호출은 이 모듈만 거친다.
 * - {@link sanitizeHealingHtml}: 힐링 카드 등 기존 허용 목록. 속성은 모두 제거한다.
 * - {@link sanitizeRichNoticeHtml}: 공지·웰니스·메시지 본문. http(s)·mailto 링크만 남긴다.
 *
 * script·style·iframe 은 태그와 내용 모두를 버린다.
 * 그 외 비허용 태그는 태그만 벗기고 텍스트는 남긴다.
 * DOM 이 없으면 태그를 모두 제거한다.
 *
 * @author MindGarden
 * @since 2026-06-07
 */

import DOMPurify from 'dompurify';
import {
  HEALING_HTML_ALLOWED_ATTRIBUTES,
  HEALING_HTML_ALLOWED_TAGS,
  RICH_NOTICE_ALLOWED_ATTRIBUTES,
  RICH_NOTICE_ALLOWED_HREF_PREFIXES,
  RICH_NOTICE_ALLOWED_PROTOCOLS,
  RICH_NOTICE_ALLOWED_TAGS,
  RICH_NOTICE_ANCHOR_TAG,
  RICH_NOTICE_DROP_CONTENT_TAGS,
  RICH_NOTICE_EXTERNAL_LINK_REL,
  RICH_NOTICE_HREF_ATTRIBUTE,
  RICH_NOTICE_HTTP_HREF_PREFIXES,
  RICH_NOTICE_PROTOCOL_DECODE_PASSES,
  RICH_NOTICE_REL_ATTRIBUTE
} from '../constants/safeHtmlPolicy';

/**
 * 표시용 이모지·심볼 장식 문자 제거 (메트릭/데이터 불변, display-only).
 * BMP 심볼 + 이모지 보충 평면 + ZWJ/VS16 포함.
 */
const EMOJI_DISPLAY_PATTERN = /(?:\uFE0F|\u200D|\u20E3)|[\u2600-\u27BF]|[\u{1F300}-\u{1FAFF}]/gu;

let purify = null;

/**
 * HTML/텍스트에서 장식 이모지를 제거한다.
 *
 * @param {string} text 원본 문자열
 * @returns {string} 이모지가 제거된 문자열
 */
export function stripDisplayEmoji(text) {
  if (typeof text !== 'string' || text.length === 0) {
    return '';
  }
  return text.replace(EMOJI_DISPLAY_PATTERN, '');
}

/**
 * 모든 HTML 태그를 제거한다 (DOM 미사용 fallback).
 * 단일 패스 태그 제거는 중첩·깨진 태그(예: scr+script 재구성)를 남길 수 있으므로,
 * 결과가 안정될 때까지 반복 제거한다. 남은 꺾쇠(<, >)도 제거해 재구성 XSS 를 막는다.
 *
 * @param {string} text 원본 문자열
 * @returns {string} 태그가 제거된 평문
 */
export function stripAllHtmlTags(text) {
  if (typeof text !== 'string' || text.length === 0) {
    return '';
  }
  let previous;
  let current = text;
  do {
    previous = current;
    current = current.replace(/<[^>]*>/g, '');
  } while (current !== previous);
  return current.replace(/[<>]/g, '');
}

/**
 * 제어 문자(C0, DEL)인지 본다. 정규식 제어문자 클래스는 린트가 막으므로 코드 포인트로 가른다.
 *
 * @param {number} code
 * @returns {boolean}
 */
function isControlChar(code) {
  return code <= 31 || code === 127;
}

/**
 * @param {string} value
 * @returns {string} 제어 문자를 뺀 문자열
 */
function stripControls(value) {
  return Array.from(String(value))
    .filter((char) => !isControlChar(char.charCodeAt(0)))
    .join('');
}

/**
 * 프로토콜 판정용으로 제어 문자와 공백을 뺀다.
 *
 * @param {string} value
 * @returns {string}
 */
function stripForInspection(value) {
  return Array.from(String(value))
    .filter((char) => {
      const code = char.charCodeAt(0);
      return !isControlChar(code) && !/\s/.test(char);
    })
    .join('');
}

/**
 * @returns {boolean} window.document 와 DOMParser 를 쓸 수 있으면 true
 */
function hasDom() {
  return typeof window !== 'undefined'
    && typeof window.document !== 'undefined'
    && typeof window.DOMParser === 'function';
}

/**
 * @returns {object|null} DOM 이 있을 때만 DOMPurify 인스턴스
 */
function getPurify() {
  if (!hasDom()) {
    return null;
  }
  if (!purify) {
    purify = DOMPurify(window);
  }
  return purify;
}

/**
 * 허용 프로토콜 목록으로 DOMPurify URI 정규식을 만든다.
 *
 * @param {readonly string[]} protocols `http:` 형태의 프로토콜
 * @returns {RegExp}
 */
function buildAllowedUriRegExp(protocols) {
  const body = protocols
    .map((protocol) => String(protocol).replace(/:$/, ''))
    .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  return new RegExp(`^(?:(?:${body}):)`, 'i');
}

/**
 * @param {Node} node
 */
function removeComments(node) {
  if (!node) {
    return;
  }
  Array.from(node.childNodes || []).forEach((child) => {
    if (child.nodeType === 8) {
      node.removeChild(child);
      return;
    }
    if (child.nodeType === 1) {
      removeComments(child);
    }
  });
}

/**
 * @param {Node} node
 */
function stripEmojiFromText(node) {
  if (!node) {
    return;
  }
  Array.from(node.childNodes || []).forEach((child) => {
    if (child.nodeType === 3 && typeof child.textContent === 'string') {
      child.textContent = stripDisplayEmoji(child.textContent);
      return;
    }
    if (child.nodeType === 1) {
      stripEmojiFromText(child);
    }
  });
}

/**
 * @param {Element} element
 */
function unwrapElement(element) {
  const parent = element.parentNode;
  if (!parent) {
    return;
  }
  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }
  parent.removeChild(element);
}

/**
 * 허용 목록에 없는 속성을 모두 제거한다.
 * DOMPurify 미설치(Jest stub)여도 힐링 본문의 onclick/style/class 가 남지 않게 한다.
 *
 * @param {Element} element
 * @param {readonly string[]|undefined} allowedAttrs
 */
function stripDisallowedAttributes(element, allowedAttrs) {
  const allowed = new Set(allowedAttrs || []);
  Array.from(element.attributes || []).forEach((attr) => {
    if (!allowed.has(attr.name)) {
      element.removeAttribute(attr.name);
    }
  });
}

/**
 * script·style·iframe 은 내용까지 지우고, 나머지 비허용 태그는 벗긴다.
 *
 * @param {string} html
 * @param {{ allowedTags: readonly string[], dropContentTags: readonly string[], stripEmoji: boolean }} policy
 * @returns {string}
 */
function prepareFragment(html, policy) {
  const doc = new window.DOMParser().parseFromString(html, 'text/html');
  const allowed = new Set(policy.allowedTags);
  const drop = new Set(policy.dropContentTags);
  [doc.head, doc.body].filter(Boolean).forEach((root) => {
    const elements = Array.from(root.querySelectorAll('*'));
    for (let index = elements.length - 1; index >= 0; index -= 1) {
      const element = elements[index];
      if (!element.parentNode) {
        continue;
      }
      const tag = String(element.tagName || '').toLowerCase();
      if (drop.has(tag)) {
        element.remove();
        continue;
      }
      if (!allowed.has(tag)) {
        unwrapElement(element);
        continue;
      }
      stripDisallowedAttributes(element, policy.allowedAttrs);
    }
    removeComments(root);
    if (policy.stripEmoji) {
      stripEmojiFromText(root);
    }
  });
  return doc.body ? doc.body.innerHTML : '';
}

/**
 * @param {string} value
 * @returns {string} 엔티티가 풀린 텍스트
 */
function decodeHtmlEntities(value) {
  const doc = new window.DOMParser().parseFromString(value, 'text/html');
  return doc.documentElement ? (doc.documentElement.textContent || '') : '';
}

/**
 * 프로토콜 판정용으로 제어문자·공백·엔티티·퍼센트 인코딩을 반복해서 푼다.
 *
 * @param {string} raw
 * @returns {string}
 */
function decodeForProtocol(raw) {
  let current = String(raw);
  for (let pass = 0; pass < RICH_NOTICE_PROTOCOL_DECODE_PASSES; pass += 1) {
    const stripped = stripForInspection(current);
    const entityDecoded = decodeHtmlEntities(stripped);
    let percentDecoded = entityDecoded;
    try {
      percentDecoded = decodeURIComponent(entityDecoded);
    } catch (err) {
      percentDecoded = entityDecoded;
    }
    percentDecoded = stripForInspection(percentDecoded);
    if (percentDecoded === current) {
      return percentDecoded;
    }
    current = percentDecoded;
  }
  return stripForInspection(current);
}

/**
 * @param {string} value
 * @param {readonly string[]} prefixes
 * @returns {boolean}
 */
function startsWithPrefix(value, prefixes) {
  const lower = String(value || '').toLowerCase();
  return prefixes.some((prefix) => lower.startsWith(prefix));
}

/**
 * 원문과 디코드 결과가 모두 http(s)·mailto 절대 형태일 때만 허용한다.
 *
 * @param {string} href
 * @returns {boolean}
 */
function isAllowedHref(href) {
  if (!href) {
    return false;
  }
  const stored = stripControls(String(href)).trim();
  if (!startsWithPrefix(stored, RICH_NOTICE_ALLOWED_HREF_PREFIXES)) {
    return false;
  }
  return startsWithPrefix(decodeForProtocol(stored), RICH_NOTICE_ALLOWED_HREF_PREFIXES);
}

/**
 * 화면에 보이는 호스트와 다르면 외부 링크다.
 * 페이지 호스트를 알 수 없으면 http(s) 절대 URL 을 외부로 본다.
 *
 * @param {string} href
 * @returns {boolean}
 */
function isExternalHttpHref(href) {
  const inspected = decodeForProtocol(stripControls(String(href)).trim());
  if (!startsWithPrefix(inspected, RICH_NOTICE_HTTP_HREF_PREFIXES)) {
    return false;
  }
  try {
    const url = new URL(href);
    const pageHost = window.location && window.location.host
      ? String(window.location.host).toLowerCase()
      : '';
    if (!pageHost) {
      return true;
    }
    return url.host.toLowerCase() !== pageHost;
  } catch (err) {
    return true;
  }
}

/**
 * @param {string} html
 * @returns {string}
 */
function applyLinkPolicy(html) {
  const doc = new window.DOMParser().parseFromString(html, 'text/html');
  const body = doc.body;
  if (!body) {
    return '';
  }
  Array.from(body.querySelectorAll(RICH_NOTICE_ANCHOR_TAG)).forEach((anchor) => {
    const rawHref = anchor.getAttribute(RICH_NOTICE_HREF_ATTRIBUTE);
    const stored = rawHref == null ? '' : stripControls(String(rawHref)).trim();
    if (!isAllowedHref(stored)) {
      unwrapElement(anchor);
      return;
    }
    anchor.setAttribute(RICH_NOTICE_HREF_ATTRIBUTE, stored);
    if (isExternalHttpHref(stored)) {
      anchor.setAttribute(RICH_NOTICE_REL_ATTRIBUTE, RICH_NOTICE_EXTERNAL_LINK_REL);
    } else {
      anchor.removeAttribute(RICH_NOTICE_REL_ATTRIBUTE);
    }
    Array.from(anchor.attributes).forEach((attr) => {
      if (attr.name !== RICH_NOTICE_HREF_ATTRIBUTE && attr.name !== RICH_NOTICE_REL_ATTRIBUTE) {
        anchor.removeAttribute(attr.name);
      }
    });
  });
  return body.innerHTML;
}

/**
 * @param {string} html
 * @param {boolean} stripEmoji
 * @returns {string}
 */
function fallbackPlain(html, stripEmoji) {
  const plain = stripAllHtmlTags(html);
  return stripEmoji ? stripDisplayEmoji(plain) : plain;
}

/**
 * @param {string} html
 * @param {object} policy
 * @returns {string}
 */
function sanitizeWithPolicy(html, policy) {
  if (!hasDom()) {
    return fallbackPlain(html, policy.stripEmoji);
  }
  try {
    const prepared = prepareFragment(html, policy);
    const engine = getPurify();
    if (!engine) {
      return fallbackPlain(html, policy.stripEmoji);
    }
    const purified = engine.sanitize(prepared, {
      ALLOWED_TAGS: policy.allowedTags,
      ALLOWED_ATTR: policy.allowedAttrs,
      ALLOW_DATA_ATTR: false,
      ALLOW_ARIA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
      ALLOWED_URI_REGEXP: policy.uriRegExp,
      KEEP_CONTENT: true,
      RETURN_TRUSTED_TYPE: false
    });
    const linked = policy.links ? applyLinkPolicy(purified) : purified;
    return policy.stripEmoji ? stripDisplayEmoji(linked) : linked;
  } catch (err) {
    return fallbackPlain(html, policy.stripEmoji);
  }
}

const HEALING_POLICY = Object.freeze({
  allowedTags: HEALING_HTML_ALLOWED_TAGS,
  allowedAttrs: HEALING_HTML_ALLOWED_ATTRIBUTES,
  dropContentTags: RICH_NOTICE_DROP_CONTENT_TAGS,
  uriRegExp: /^(?:)$/,
  links: false,
  stripEmoji: true
});

const NOTICE_POLICY = Object.freeze({
  allowedTags: RICH_NOTICE_ALLOWED_TAGS,
  allowedAttrs: RICH_NOTICE_ALLOWED_ATTRIBUTES,
  dropContentTags: RICH_NOTICE_DROP_CONTENT_TAGS,
  uriRegExp: buildAllowedUriRegExp(RICH_NOTICE_ALLOWED_PROTOCOLS),
  links: true,
  stripEmoji: false
});

/**
 * 신뢰되지 않은 HTML(예: AI 생성 힐링 본문)을 sanitize 한다.
 * 브라우저 환경(window.document)이 없으면 모든 태그를 제거한다.
 * 표시용 이모지도 함께 제거한다 (대시보드 장식 스프라이트 방지).
 *
 * @param {string} html 원본 HTML
 * @returns {string} sanitize 된 HTML (또는 빈 문자열)
 */
export function sanitizeHealingHtml(html) {
  if (typeof html !== 'string' || html.length === 0) {
    return '';
  }
  return sanitizeWithPolicy(html, HEALING_POLICY);
}

/**
 * 공지·웰니스·메시지 본문 HTML 을 정화한다.
 * 허용 태그만 남기고, 링크는 http(s)·mailto 만 통과시킨다.
 * 외부 http(s) 링크에는 rel="noopener noreferrer" 를 붙인다.
 *
 * @param {string} html 원본 HTML
 * @returns {string} 정화된 HTML. 문자열이 아니면 빈 문자열
 */
export function sanitizeRichNoticeHtml(html) {
  if (typeof html !== 'string' || html.length === 0) {
    return '';
  }
  return sanitizeWithPolicy(html, NOTICE_POLICY);
}

/**
 * 공지 본문을 목록 미리보기용 평문으로 만든다.
 * 정화한 뒤 텍스트만 남기고, 꺾쇠는 다시 넣지 않는다.
 *
 * @param {string} html 원본 HTML
 * @returns {string} 평문
 */
export function toPlainNoticePreview(html) {
  const safe = sanitizeRichNoticeHtml(typeof html === 'string' ? html : '');
  if (!safe) {
    return '';
  }
  if (!hasDom()) {
    return stripAllHtmlTags(safe);
  }
  try {
    const doc = new window.DOMParser().parseFromString(safe, 'text/html');
    const text = doc.body ? (doc.body.textContent || '') : '';
    return stripAllHtmlTags(text).replace(/\u00a0/g, ' ').trim();
  } catch (err) {
    return stripAllHtmlTags(safe);
  }
}
