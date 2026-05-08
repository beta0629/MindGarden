/**
 * 심리검사 AI 리포트 마크다운의 psych-prompt-v3 필수 헤딩 검사 (백엔드 PsychAiReportSectionChecks와 동일 규칙).
 *
 * @author CoreSolution
 * @since 2026-05-08
 */

/**
 * @param {string} reportMarkdown
 * @returns {string}
 */
export function normalizePsychReportMarkdown(reportMarkdown) {
  if (!reportMarkdown || typeof reportMarkdown !== 'string') {
    return '';
  }
  return reportMarkdown
    .replaceAll('\uFEFF', '')
    .replaceAll('\r', '')
    .replaceAll('\u00A0', ' ')
    .replaceAll('\u3000', ' ');
}

/**
 * @param {string} reportMarkdown
 * @returns {boolean}
 */
export function hasSummaryAndRecommendationHeadings(reportMarkdown) {
  const normalized = normalizePsychReportMarkdown(reportMarkdown);
  if (!normalized) {
    return false;
  }
  const summaryLineStart = /^\s*[#＃]+[\s\S]*?요약/miu;
  const recommendationLineStart = /^\s*[#＃]+[\s\S]*?권고/miu;
  if (summaryLineStart.test(normalized) && recommendationLineStart.test(normalized)) {
    return true;
  }
  const summaryAnywhere = /[#＃]+[\s\S]*?요약/iu;
  const recommendationAnywhere = /[#＃]+[\s\S]*?권고/iu;
  if (summaryAnywhere.test(normalized) && recommendationAnywhere.test(normalized)) {
    return true;
  }
  if (normalized.includes('요약') && (normalized.includes('권고') || normalized.includes('권고사항'))) {
    return true;
  }
  const lower = normalized.toLowerCase();
  return lower.includes('summary') && (lower.includes('recommendation') || lower.includes('recommendations'));
}

/**
 * @param {string} normalized
 * @param {string} titleAfterHashes
 * @returns {number}
 */
function indexStrictHeading(normalized, titleAfterHashes) {
  if (!titleAfterHashes) {
    return -1;
  }
  const escaped = titleAfterHashes.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const p = new RegExp(`^\\s*[#＃]{1,6}\\s+${escaped}\\s*(?:\\n|:|$)`, 'miu');
  const m = normalized.match(p);
  return m && m.index != null ? m.index : -1;
}

/**
 * @param {string} normalized
 * @returns {number}
 */
function indexFlexibleSummaryHeading(normalized) {
  const p = /^\s*[#＃]{1,6}\s+[^\n]*요약/miu;
  const m = normalized.match(p);
  return m && m.index != null ? m.index : -1;
}

/**
 * @param {string} normalized
 * @returns {number}
 */
function indexFlexibleRecommendationHeading(normalized) {
  const p = /^\s*[#＃]{1,6}\s+[^\n]*권고/miu;
  const m = normalized.match(p);
  return m && m.index != null ? m.index : -1;
}

/**
 * @param {string} reportMarkdown
 * @returns {boolean}
 */
export function hasTciDesignerHeadingsInOrder(reportMarkdown) {
  if (!hasSummaryAndRecommendationHeadings(reportMarkdown)) {
    return false;
  }
  const n = normalizePsychReportMarkdown(reportMarkdown);
  const iSummary = indexFlexibleSummaryHeading(n);
  const iRec = indexFlexibleRecommendationHeading(n);
  if (iSummary < 0 || iRec < 0) {
    return false;
  }
  const iOverview = indexStrictHeading(n, '검사 개요');
  const iProfile = indexStrictHeading(n, '기질·성격 프로필');
  const iScores = indexStrictHeading(n, '점수 해석');
  const iCounsel = indexStrictHeading(n, '상담 시 고려');
  if (iOverview < 0 || iProfile < 0 || iScores < 0 || iCounsel < 0) {
    return false;
  }
  return iSummary < iOverview && iOverview < iProfile && iProfile < iScores && iScores < iCounsel && iCounsel < iRec;
}

/**
 * @param {string} reportMarkdown
 * @returns {boolean}
 */
export function hasMmpiDesignerHeadingsInOrder(reportMarkdown) {
  if (!hasSummaryAndRecommendationHeadings(reportMarkdown)) {
    return false;
  }
  const n = normalizePsychReportMarkdown(reportMarkdown);
  const iSummary = indexFlexibleSummaryHeading(n);
  const iRec = indexFlexibleRecommendationHeading(n);
  if (iSummary < 0 || iRec < 0) {
    return false;
  }
  const iValidity = indexStrictHeading(n, '타당도');
  const iClinical = indexStrictHeading(n, '임상 척도');
  const iRc = indexStrictHeading(n, '재구성 척도');
  const iStrength = indexStrictHeading(n, '강점 및 자원');
  if (iValidity < 0 || iClinical < 0 || iRc < 0 || iStrength < 0) {
    return false;
  }
  return iSummary < iValidity && iValidity < iClinical && iClinical < iRc && iRc < iStrength && iStrength < iRec;
}
