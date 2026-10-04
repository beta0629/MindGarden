/**
 * Next.js SWC compiler 옵션. 운영 빌드에서는 console.error 만 남기고 나머지 console 호출을 번들에서 제거한다.
 *
 * @author CoreSolution
 * @since 2026-10-04
 */

const PRODUCTION_ENV = "production";
const KEPT_CONSOLE_METHODS = ["error"];

function buildCompilerOptions(nodeEnv) {
  if (nodeEnv !== PRODUCTION_ENV) {
    return {};
  }
  return {
    removeConsole: {
      exclude: [...KEPT_CONSOLE_METHODS],
    },
  };
}

module.exports = { buildCompilerOptions, KEPT_CONSOLE_METHODS };
