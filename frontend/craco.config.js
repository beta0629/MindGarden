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

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      const plugin = webpackConfig.plugins.find(
        (p) => p.constructor.name === 'MiniCssExtractPlugin'
      );
      if (plugin && plugin.options) {
        plugin.options.ignoreOrder = true;
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
          '<rootDir>/node_modules/react-router/dist/development/dom-export.js'
      };
      return jestConfig;
    }
  }
};
