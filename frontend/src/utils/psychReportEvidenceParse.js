/**
 * 심리검사 리포트 evidenceJson 파싱 (빌드 래퍼 vs evidence 단독 객체 호환).
 *
 * @author CoreSolution
 * @since 2026-05-08
 */

/**
 * @typedef {Object} PsychReportEvidenceParsed
 * @property {string|null} aiStatus
 * @property {string|null} reason
 * @property {unknown[]} highlights
 * @property {boolean} hasWrappedStatus
 * @property {Record<string, unknown>|null} quality
 */

/**
 * @param {string|null|undefined} evidenceJson
 * @returns {PsychReportEvidenceParsed}
 */
export function parsePsychReportEvidence(evidenceJson) {
  const empty = {
    aiStatus: null,
    reason: null,
    highlights: [],
    hasWrappedStatus: false,
    quality: null
  };
  if (!evidenceJson || typeof evidenceJson !== 'string') {
    return empty;
  }
  try {
    const parsed = JSON.parse(evidenceJson);
    if (!parsed || typeof parsed !== 'object') {
      return empty;
    }
    if (typeof parsed.ai === 'string') {
      return {
        aiStatus: parsed.ai,
        reason: typeof parsed.reason === 'string' ? parsed.reason : null,
        highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
        hasWrappedStatus: true,
        quality: parsed.quality && typeof parsed.quality === 'object' ? parsed.quality : null
      };
    }
    return {
      aiStatus: null,
      reason: null,
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      hasWrappedStatus: false,
      quality: parsed.quality && typeof parsed.quality === 'object' ? parsed.quality : null
    };
  } catch {
    return empty;
  }
}

/**
 * 마크다운에서 지정 헤더 다음 본문 추출 (백엔드 PsychAssessmentController.extractMarkdownSection와 동일).
 *
 * @param {string|null|undefined} markdown
 * @param {string} sectionHeader 예: "## 임상 척도"
 * @returns {string|null}
 */
export function extractMarkdownSection(markdown, sectionHeader) {
  if (markdown == null || sectionHeader == null) {
    return null;
  }
  const start = markdown.indexOf(sectionHeader);
  if (start < 0) {
    return null;
  }
  let contentStart = markdown.indexOf('\n', start);
  if (contentStart < 0) {
    return null;
  }
  contentStart += 1;
  const nextSection = markdown.indexOf('\n## ', contentStart);
  const content = nextSection < 0 ? markdown.slice(contentStart) : markdown.slice(contentStart, nextSection);
  const trimmed = content.trim();
  return trimmed === '' ? null : trimmed;
}
