/**
 * Jest resolver for dompurify.
 * 패키지가 있으면 실제 엔진을 쓰고, 없을 때만 스위트 로드·XSS 가드 계약용 factory 를 쓴다.
 * default 는 DOMPurify(window) 형태여야 한다. 객체 { sanitize } 는 getPurify 가 깨진다.
 * load-only 경로도 ALLOWED_TAGS/ALLOWED_ATTR 을 반영해 속성을 남기지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-21
 */
const fs = require('fs');
const path = require('path');

const realPackageJson = path.join(__dirname, '..', 'node_modules', 'dompurify', 'package.json');

/** script·style·iframe 은 태그와 내용을 함께 버린다. */
const DROP_CONTENT_TAGS = new Set(['script', 'style', 'iframe']);

/**
 * @param {string} html
 * @param {{ ALLOWED_TAGS?: string[], ALLOWED_ATTR?: string[] }} [config]
 * @returns {string}
 */
function sanitizeWithDom(html, config) {
  if (typeof html !== 'string') {
    return '';
  }
  if (typeof window === 'undefined' || typeof window.DOMParser !== 'function') {
    return html;
  }
  const allowedTags = new Set(
    (config && Array.isArray(config.ALLOWED_TAGS) ? config.ALLOWED_TAGS : [])
      .map((tag) => String(tag).toLowerCase())
  );
  const allowedAttr = new Set(
    (config && Array.isArray(config.ALLOWED_ATTR) ? config.ALLOWED_ATTR : [])
      .map((attr) => String(attr).toLowerCase())
  );
  const doc = new window.DOMParser().parseFromString(html, 'text/html');
  const body = doc.body;
  if (!body) {
    return '';
  }
  cleanNode(body, allowedTags, allowedAttr);
  return body.innerHTML;
}

/**
 * @param {ParentNode} node
 * @param {Set<string>} allowedTags
 * @param {Set<string>} allowedAttr
 * @returns {void}
 */
function cleanNode(node, allowedTags, allowedAttr) {
  Array.from(node.childNodes).forEach((child) => {
    if (child.nodeType === 8) {
      node.removeChild(child);
      return;
    }
    if (child.nodeType !== 1) {
      return;
    }
    const tag = String(child.tagName || '').toLowerCase();
    if (DROP_CONTENT_TAGS.has(tag)) {
      node.removeChild(child);
      return;
    }
    cleanNode(child, allowedTags, allowedAttr);
    if (allowedTags.size > 0 && !allowedTags.has(tag)) {
      unwrapElement(child);
      return;
    }
    Array.from(child.attributes || []).forEach((attr) => {
      if (!allowedAttr.has(String(attr.name).toLowerCase())) {
        child.removeAttribute(attr.name);
      }
    });
  });
}

/**
 * @param {Element} element
 * @returns {void}
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

function createLoadOnlyFactory() {
  const factory = function loadOnlyPurify() {
    return {
      sanitize: sanitizeWithDom
    };
  };
  factory.sanitize = sanitizeWithDom;
  return factory;
}

if (fs.existsSync(realPackageJson)) {
  module.exports = require(path.join(__dirname, '..', 'node_modules', 'dompurify'));
} else {
  const factory = createLoadOnlyFactory();
  module.exports = factory;
  module.exports.__esModule = true;
  module.exports.default = factory;
}
