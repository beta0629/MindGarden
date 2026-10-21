/**
 * Jest resolver for dompurify.
 * 패키지가 있으면 실제 엔진을 쓰고, 없을 때만 스위트 로드용 factory 를 쓴다.
 * default 는 DOMPurify(window) 형태여야 한다. 객체 { sanitize } 는 getPurify 가 깨진다.
 *
 * @author CoreSolution
 * @since 2026-10-21
 */
const fs = require('fs');
const path = require('path');

const realPackageJson = path.join(__dirname, '..', 'node_modules', 'dompurify', 'package.json');

function createLoadOnlyFactory() {
  const factory = function loadOnlyPurify() {
    return {
      sanitize: (html) => (typeof html === 'string' ? html : '')
    };
  };
  factory.sanitize = (html) => (typeof html === 'string' ? html : '');
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
