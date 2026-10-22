/**
 * Jest resolver for dompurify.
 * 패키지가 있으면 실제 엔진을 쓰고, 없을 때는 ALLOWED_TAGS/ATTR 정책을 적용하는
 * factory 를 쓴다. default 는 DOMPurify(window) 형태여야 한다.
 *
 * @author CoreSolution
 * @since 2026-10-21
 */
const fs = require('fs');
const path = require('path');

const URI_ATTRS = new Set(['href', 'src', 'xlink:href', 'action']);
const realPackageJson = path.join(__dirname, '..', 'node_modules', 'dompurify', 'package.json');

/**
 * @param {string} html
 * @param {object} [config]
 * @returns {string}
 */
function sanitizeWithPolicy(html, config) {
  if (typeof html !== 'string') {
    return '';
  }
  const options = config && typeof config === 'object' ? config : {};
  const allowedTags = new Set(
    (Array.isArray(options.ALLOWED_TAGS) ? options.ALLOWED_TAGS : []).map((tag) => String(tag).toLowerCase())
  );
  const allowedAttrs = new Set(
    (Array.isArray(options.ALLOWED_ATTR) ? options.ALLOWED_ATTR : []).map((attr) => String(attr).toLowerCase())
  );
  const uriRegExp = options.ALLOWED_URI_REGEXP instanceof RegExp ? options.ALLOWED_URI_REGEXP : null;
  const keepContent = options.KEEP_CONTENT !== false;
  if (typeof window === 'undefined' || typeof window.DOMParser !== 'function') {
    return html;
  }
  const doc = new window.DOMParser().parseFromString(html, 'text/html');
  const roots = [doc.head, doc.body].filter(Boolean);
  roots.forEach((root) => {
    const elements = Array.from(root.querySelectorAll('*'));
    for (let index = elements.length - 1; index >= 0; index -= 1) {
      const element = elements[index];
      if (!element.parentNode) {
        continue;
      }
      const tag = String(element.tagName || '').toLowerCase();
      if (!allowedTags.has(tag)) {
        if (keepContent) {
          while (element.firstChild) {
            element.parentNode.insertBefore(element.firstChild, element);
          }
        }
        element.parentNode.removeChild(element);
        continue;
      }
      Array.from(element.attributes).forEach((attr) => {
        const name = String(attr.name || '').toLowerCase();
        if (!allowedAttrs.has(name)) {
          element.removeAttribute(attr.name);
          return;
        }
        if (uriRegExp && URI_ATTRS.has(name) && !uriRegExp.test(String(attr.value || ''))) {
          element.removeAttribute(attr.name);
        }
      });
    }
  });
  return doc.body ? doc.body.innerHTML : '';
}

function createPolicyFactory() {
  const factory = function policyPurify() {
    return {
      sanitize: sanitizeWithPolicy
    };
  };
  factory.sanitize = sanitizeWithPolicy;
  return factory;
}

if (fs.existsSync(realPackageJson)) {
  module.exports = require(path.join(__dirname, '..', 'node_modules', 'dompurify'));
} else {
  const factory = createPolicyFactory();
  module.exports = factory;
  module.exports.__esModule = true;
  module.exports.default = factory;
}
