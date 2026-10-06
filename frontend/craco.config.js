/**
 * CRACO 설정 - Create React App 커스터마이징
 *
 * mini-css-extract-plugin conflicting order 경고 해결
 * - lazy-loaded chunks에서 CSS import 순서가 달라 발생하는 경고 억제
 * - 프로젝트는 mg-v2-*, BEM 스코핑으로 CSS 순서 의존성 최소화 → ignoreOrder 적용 적합
 *
 * @see docs/standards/FRONTEND_DEVELOPMENT_STANDARD.md
 * @see .cursor/skills/core-solution-frontend
 */

const path = require('path');

/**
 * src 밖에서 import 를 허용하는 파일 — 로그인 비밀번호 정책 BE/FE 공용 픽스처 하나뿐.
 * constants/passwordPolicyUi.js 가 길이·특수문자·일반 단어 목록을 여기서만 읽는다.
 */
const SHARED_OUTSIDE_SRC_FILES = [
  path.resolve(__dirname, '../src/test/resources/password-policy/login-password-policy-parity.json')
];

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      const plugin = webpackConfig.plugins.find(
        (p) => p.constructor.name === 'MiniCssExtractPlugin'
      );
      if (plugin && plugin.options) {
        plugin.options.ignoreOrder = true;
      }
      const resolvePlugins = (webpackConfig.resolve && webpackConfig.resolve.plugins) || [];
      resolvePlugins
        .filter((p) => p.constructor.name === 'ModuleScopePlugin' && p.allowedFiles instanceof Set)
        .forEach((p) => SHARED_OUTSIDE_SRC_FILES.forEach((file) => p.allowedFiles.add(file)));
      return webpackConfig;
    }
  },
  jest: {
    configure: (jestConfig) => {
      jestConfig.moduleNameMapper = {
        ...jestConfig.moduleNameMapper,
        '^react-router-dom$': '<rootDir>/node_modules/react-router-dom/dist/index.js',
        '^react-router$': '<rootDir>/node_modules/react-router/dist/development/index.js',
        '^react-router/dom$':
          '<rootDir>/node_modules/react-router/dist/development/dom-export.js',
        '^@portone/browser-sdk/v2$':
          '<rootDir>/node_modules/@portone/browser-sdk/dist/v2.cjs'
      };
      return jestConfig;
    }
  }
};
