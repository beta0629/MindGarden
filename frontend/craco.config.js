/**
 * CRACO 설정 - Create React App 커스터마이징
 *
 * mini-css-extract-plugin conflicting order 경고 해결
 * - lazy-loaded chunks에서 CSS import 순서가 달라 발생하는 경고 억제
 * - 프로젝트는 mg-v2-*, BEM 스코핑으로 CSS 순서 의존성 최소화 → ignoreOrder 적용 적합
 *
 * SCT E2E 하네스 (`sctHarness` / `e2e-sct-viewport.html`)
 * - 기본 빌드·개발 서버에서는 생성하지 않음 (운영 정적 자산 노출 방지)
 * - `REACT_APP_SCT_E2E_HARNESS=true|1` 또는 `SCT_E2E_HARNESS=true|1` 일 때만 entry·HtmlWebpackPlugin 추가
 *
 * @see docs/standards/FRONTEND_DEVELOPMENT_STANDARD.md
 * @see .cursor/skills/core-solution-frontend
 */

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

/**
 * src 밖에서 import 를 허용하는 파일 — 로그인 비밀번호 정책 BE/FE 공용 픽스처 하나뿐.
 * constants/passwordPolicyUi.js 가 길이·특수문자·일반 단어 목록을 여기서만 읽는다.
 */
const SHARED_OUTSIDE_SRC_FILES = [
  path.resolve(__dirname, '../src/test/resources/password-policy/login-password-policy-parity.json')
];

/**
 * Playwright SCT 뷰포트 하네스 빌드 여부.
 * 프로덕션 `npm run build` / `build:ci` 에서는 반드시 false 여야 한다.
 *
 * @returns {boolean}
 */
function isSctE2eHarnessEnabled() {
  const flag = process.env.REACT_APP_SCT_E2E_HARNESS || process.env.SCT_E2E_HARNESS || '';
  return flag === '1' || flag === 'true';
}

/**
 * webpack entry 에 sctHarness 청크를 추가한다.
 *
 * @param {string|string[]|Record<string, unknown>} entry
 * @param {string} harnessEntry
 * @returns {Record<string, unknown>}
 */
function withSctHarnessEntry(entry, harnessEntry) {
  if (Array.isArray(entry)) {
    return { main: entry, sctHarness: harnessEntry };
  }
  if (typeof entry === 'string') {
    return { main: entry, sctHarness: harnessEntry };
  }
  if (entry && typeof entry === 'object') {
    return { ...entry, sctHarness: harnessEntry };
  }
  return { main: entry, sctHarness: harnessEntry };
}

/**
 * 메인 HtmlWebpackPlugin 이 sctHarness 청크를 주입하지 않도록 chunks 를 main 으로 고정한다.
 *
 * @param {import('webpack').Configuration} webpackConfig
 */
function pinMainHtmlChunks(webpackConfig) {
  webpackConfig.plugins
    .filter((p) => p.constructor && p.constructor.name === 'HtmlWebpackPlugin')
    .forEach((plugin) => {
      const options = plugin.userOptions || plugin.options;
      if (!options) {
        return;
      }
      const htmlName = options.filename || 'index.html';
      if (htmlName === 'e2e-sct-viewport.html') {
        return;
      }
      options.chunks = ['main'];
      if (plugin.userOptions) {
        plugin.userOptions.chunks = ['main'];
      }
      if (plugin.options) {
        plugin.options.chunks = ['main'];
      }
    });
}

/**
 * SCT E2E 뷰포트 하네스 entry·HTML 을 webpack 설정에 추가한다.
 *
 * @param {import('webpack').Configuration} webpackConfig
 */
function applySctE2eHarness(webpackConfig) {
  const harnessEntry = path.resolve(__dirname, 'src/__e2e__/mountSctHarness.js');
  webpackConfig.entry = withSctHarnessEntry(webpackConfig.entry, harnessEntry);
  pinMainHtmlChunks(webpackConfig);
  webpackConfig.plugins.push(
    new HtmlWebpackPlugin({
      inject: true,
      template: path.resolve(__dirname, 'e2e-harness/sct-viewport.html'),
      filename: 'e2e-sct-viewport.html',
      chunks: ['sctHarness']
    })
  );
}

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

      if (isSctE2eHarnessEnabled()) {
        applySctE2eHarness(webpackConfig);
      }

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
          '<rootDir>/node_modules/@portone/browser-sdk/dist/v2.cjs',
        // axios 1.x ESM entry breaks Jest (import outside module)
        '^axios$': '<rootDir>/node_modules/axios/dist/node/axios.cjs',
        // guardrail findRelatedTests: node_modules에 패키지가 없어도 스위트 로드
        '^dompurify$': '<rootDir>/jest-stubs/dompurify.js',
        '^@fullcalendar/luxon3$': '<rootDir>/jest-stubs/fullcalendarLuxon3.js'
      };
      return jestConfig;
    }
  }
};
