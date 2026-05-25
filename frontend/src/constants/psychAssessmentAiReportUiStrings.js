/**
 * 심리검사 AI 리포트 모달 UX 문구의 i18n 키 (psych-prompt-v3 정합).
 * 실제 문구는 `report.json:psychAi.*` 에서 관리하며, 본 모듈은 키 레지스트리만 제공.
 *
 * @author CoreSolution
 * @since 2026-05-08
 */

export const PSYCH_AI_REPORT_UI = {
  LOADING: 'report:psychAi.loading',
  SKIPPED_FALLBACK: 'report:psychAi.skippedFallback',
  FAILED_NETWORK: 'report:psychAi.failedNetwork',
  FAILED_VALIDATION_INTRO: 'report:psychAi.failedValidationIntro',
  LEGACY_HEADING_HINT: 'report:psychAi.legacyHeadingHint',
  MISSING_SECTIONS_HINT: 'report:psychAi.missingSectionsHint',
  EMPTY_KEY_HIGHLIGHTS_HINT: 'report:psychAi.emptyKeyHighlightsHint',
  REGENERATE_BUTTON: 'report:psychAi.regenerateButton',
  REGENERATE_DISABLED_TITLE: 'report:psychAi.regenerateDisabledTitle'
};
