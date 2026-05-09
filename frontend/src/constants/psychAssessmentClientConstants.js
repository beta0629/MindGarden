/**
 * 내담자 맥락 심리검사(TCI/MMPI) 요약 — API·표시 라벨 SSOT.
 * 검사 구분은 서버 assessmentType 코드만 사용한다.
 */

/** @param {string|number} clientId */
export const psychClientSummaryEndpoint = (clientId) =>
  `/api/v1/assessments/psych/clients/${encodeURIComponent(String(clientId))}/summary`;

/** @type {Record<string, { shortLabel: string, fullLabel: string }>} */
export const PSYCH_ASSESSMENT_TYPE_UI = {
  TCI: { shortLabel: 'TCI', fullLabel: 'TCI' },
  MMPI: { shortLabel: 'MMPI', fullLabel: 'MMPI' }
};

/**
 * @param {string|null|undefined} assessmentType 서버 enum 문자열
 * @returns {{ shortLabel: string, fullLabel: string }}
 */
export const getPsychAssessmentTypeUi = (assessmentType) => {
  const key = assessmentType != null ? String(assessmentType).trim().toUpperCase() : '';
  if (PSYCH_ASSESSMENT_TYPE_UI[key]) {
    return PSYCH_ASSESSMENT_TYPE_UI[key];
  }
  return { shortLabel: '검사', fullLabel: '검사' };
};
