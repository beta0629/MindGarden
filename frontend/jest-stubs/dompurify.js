/**
 * Jest stub for dompurify — 패키지가 node_modules 에 없을 때만 craco mapper 가 사용.
 * 실제 DOMPurify 는 함수이며 `DOMPurify(window).sanitize(html, cfg)` 계약이다.
 * identity sanitize 는 style/onclick 을 남겨 XSS 테스트를 거짓 통과시킨다.
 * 폴백은 허용 태그만 두고 허용 목록 밖 속성은 모두 제거하며, script 내용은 버린다.
 *
 * @author CoreSolution
 * @since 2026-10-21
 */

const DEFAULT_ALLOWED_TAGS = Object.freeze([
  'p', 'br', 'span', 'div', 'strong', 'em', 'b', 'i', 'u',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'a'
]);

const DROP_CONTENT_TAGS = Object.freeze(['script', 'style', 'iframe']);

const DROP_CONTENT_PATTERN = /<(script|style|iframe)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;

const COMMENT_PATTERN = /<!--[\s\S]*?-->/g;

const TAG_PATTERN = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;

/**
 * @param {unknown} names
 * @returns {Set<string>}
 */
function toNameSet(names) {
  if (!Array.isArray(names)) {
    return new Set();
  }
  return new Set(names.map((name) => String(name).toLowerCase()));
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
 * @param {string} html
 * @param {Set<string>} allowedTags
 * @param {Set<string>} allowedAttrs
 * @returns {string}
 */
function sanitizeWithDom(html, allowedTags, allowedAttrs) {
  const doc = new window.DOMParser().parseFromString(html, 'text/html');
  const body = doc.body;
  if (!body) {
    return '';
  }
  const elements = Array.from(body.querySelectorAll('*'));
  for (let index = elements.length - 1; index >= 0; index -= 1) {
    const element = elements[index];
    if (!element.parentNode) {
      continue;
    }
    const tag = String(element.tagName || '').toLowerCase();
    if (DROP_CONTENT_TAGS.indexOf(tag) >= 0) {
      element.remove();
      continue;
    }
    if (!allowedTags.has(tag)) {
      unwrapElement(element);
      continue;
    }
    Array.from(element.attributes).forEach((attr) => {
      if (!allowedAttrs.has(String(attr.name).toLowerCase())) {
        element.removeAttribute(attr.name);
      }
    });
  }
  return body.innerHTML;
}

/**
 * DOM 이 없을 때 태그만 남기고 속성과 drop 태그 내용을 제거한다.
 *
 * @param {string} html
 * @param {Set<string>} allowedTags
 * @returns {string}
 */
function sanitizeWithRegex(html, allowedTags) {
  let current = html.replace(COMMENT_PATTERN, '');
  let previous;
  do {
    previous = current;
    current = current.replace(DROP_CONTENT_PATTERN, '');
  } while (current !== previous);
  return current.replace(TAG_PATTERN, (fullMatch, rawName) => {
    const name = String(rawName || '').toLowerCase();
    if (DROP_CONTENT_TAGS.indexOf(name) >= 0) {
      return '';
    }
    if (!allowedTags.has(name)) {
      return '';
    }
    const isClose = /^<\s*\//.test(fullMatch);
    return isClose ? `</${name}>` : `<${name}>`;
  });
}

/**
 * @param {unknown} html
 * @param {object} [cfg]
 * @returns {string}
 */
function sanitize(html, cfg) {
  if (typeof html !== 'string' || html.length === 0) {
    return '';
  }
  const allowedTags = toNameSet(
    cfg && Array.isArray(cfg.ALLOWED_TAGS) ? cfg.ALLOWED_TAGS : DEFAULT_ALLOWED_TAGS
  );
  const allowedAttrs = toNameSet(
    cfg && Array.isArray(cfg.ALLOWED_ATTR) ? cfg.ALLOWED_ATTR : []
  );
  const hasDom = typeof window !== 'undefined'
    && typeof window.document !== 'undefined'
    && typeof window.DOMParser === 'function';
  if (hasDom) {
    return sanitizeWithDom(html, allowedTags, allowedAttrs);
  }
  return sanitizeWithRegex(html, allowedTags);
}

function createPurify() {
  return {
    sanitize
  };
}

function DOMPurify() {
  return createPurify();
}

DOMPurify.sanitize = sanitize;

module.exports = DOMPurify;
module.exports.default = DOMPurify;
