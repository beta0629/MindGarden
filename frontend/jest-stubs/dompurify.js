/**
 * Jest stub for dompurify — guardrail/findRelatedTests 환경에 패키지가 없을 때 스위트 로드용.
 * sanitize 는 입력을 그대로 반환한다 (테스트는 XSS 제거가 아닌 로드·표시 경로 검증).
 *
 * @author CoreSolution
 * @since 2026-10-21
 */
module.exports = {
  __esModule: true,
  default: {
    sanitize: (html) => html
  }
};
