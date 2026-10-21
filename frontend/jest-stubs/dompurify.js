/**
 * Jest stub for dompurify — 패키지가 node_modules 에 없을 때만 craco mapper 가 사용.
 * 실제 DOMPurify 는 함수이며 `DOMPurify(window).sanitize(html, cfg)` 계약이다.
 * 객체 `{ sanitize }` 를 default 로 두면 호출이 실패하고 safeHtml 이 태그를 전부 벗긴다.
 *
 * @author CoreSolution
 * @since 2026-10-21
 */

function identitySanitize(html) {
  return typeof html === 'string' ? html : '';
}

function createPurify() {
  return {
    sanitize: identitySanitize
  };
}

function DOMPurify() {
  return createPurify();
}

DOMPurify.sanitize = identitySanitize;

module.exports = DOMPurify;
module.exports.default = DOMPurify;
