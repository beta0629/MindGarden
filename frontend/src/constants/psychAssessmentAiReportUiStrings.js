/**
 * 심리검사 AI 리포트 모달 UX 문구 (psych-prompt-v3 정합).
 *
 * @author CoreSolution
 * @since 2026-05-08
 */

export const PSYCH_AI_REPORT_UI = {
  LOADING: '리포트를 불러오는 중...',
  SKIPPED_FALLBACK: 'AI 해석을 적용하지 않았습니다.',
  FAILED_NETWORK: 'AI 분석이 완료되지 않았습니다. API 설정 또는 네트워크를 확인해 주세요.',
  FAILED_VALIDATION_INTRO: 'AI 결과가 검증 기준을 통과하지 못했습니다.',
  LEGACY_HEADING_HINT:
    '이 리포트는 최신 템플릿(요약·타당도·척도·권고 등)과 다를 수 있습니다. 최신 형식으로 다시 만들려면 아래를 눌러 주세요.',
  MISSING_SECTIONS_HINT:
    '필수 섹션(헤딩)이 부족합니다. 입력 지표와 파일이 정상인지 확인한 뒤 재생성해 주세요.',
  EMPTY_KEY_HIGHLIGHTS_HINT:
    '주요 소견·근거 하이라이트가 비어 있거나 구 형식입니다. 필요하면 재생성해 주세요.',
  REGENERATE_BUTTON: '리포트 재생성',
  REGENERATE_DISABLED_TITLE: '다른 문서 리포트 생성 중입니다.'
};
