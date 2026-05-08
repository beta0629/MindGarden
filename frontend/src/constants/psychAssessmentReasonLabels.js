/**
 * 심리검사 AI·추출 evidence / reason 코드 → 사용자 안내 라벨 (한국어).
 * 백엔드 PsychAssessmentExtractionReasonCodes·OpenAIPsychAiServiceImpl buildEvidenceJson reason과 동기화.
 */
import { toDisplayString } from '../utils/safeDisplay';

export const PSYCH_ASSESSMENT_REASON_LABELS = {
  no_metrics: '자동으로 읽은 점수가 없어 AI 해석을 건너뛰었습니다. 원본을 확인한 뒤 다시 시도해 주세요.',
  tci_no_text: 'TCI 보고서에서 글자를 찾지 못했습니다. 텍스트가 있는 PDF인지 확인해 주세요.',
  tci_parse_partial: 'TCI 점수 일부만 읽혔습니다. 전체 페이지가 포함된 선명한 파일로 다시 올려 주세요.',
  tci_layout_unmatched:
    'TCI 문서는 감지됐으나 점수 표를 자동으로 읽지 못했습니다. 텍스트 선택 가능한 PDF·선명한 스캔으로 다시 시도하거나 재추출해 주세요.',
  mmpi_no_text: 'MMPI 보고서에서 텍스트를 찾지 못했습니다.',
  mmpi_parse_partial: 'MMPI 점수 일부만 읽혔습니다.',
  ocr_unconfigured: '이미지 인식(OCR) 설정이 되어 있지 않습니다. 관리자에게 문의하거나 PDF로 올려 주세요.',
  ocr_no_text: '이미지에서 글자를 읽지 못했습니다. 선명한 스캔본인지 확인해 주세요.',
  empty_response: 'AI 응답이 비어 있습니다.',
  unparsed: 'AI 응답 형식을 해석하지 못했습니다.',
  non_korean: 'AI 출력 언어 검증에 맞지 않았습니다.',
  forbidden_text: 'AI 출력에 허용되지 않은 표현이 포함되어 제외되었습니다.',
  missing_required_sections:
    'psych-prompt-v3 기준 필수 섹션(헤딩)이 부족합니다. 재생성하거나 원본 추출 상태를 확인해 주세요.',
  missing_evidence: 'AI 근거(evidence) 하이라이트가 없습니다. 재생성하면 보강될 수 있습니다.',
  evidence_skipped: '근거 검증만 생략되었고 본문은 표시됩니다. 필요 시 재생성해 주세요.',
  invalid_json_root: 'AI 출력 JSON 구조가 올바르지 않습니다.',
  missing_report_markdown: 'AI 출력에 리포트 본문(reportMarkdown)이 없습니다.',
  invalid_evidence_structure: 'AI 근거(evidence) 구조가 올바르지 않습니다.',
  insufficient_evidence: '핵심 근거 하이라이트 개수가 부족합니다. 재생성해 주세요.',
  missing_basedOn: '근거 하이라이트에 척도 연결(basedOn)이 없습니다.',
  missing_scaleCode: '근거에 척도 코드(scaleCode)가 누락되었습니다.',
  hallucinated_scaleCode: '근거에 입력에 없는 척도 코드가 포함되어 제외되었습니다.'
};

const INSUFFICIENT_EVIDENCE_PREFIX = 'insufficient_evidence:';
const HALLUCINATED_PREFIX = 'hallucinated_scaleCode:';

/**
 * @param {string|null|undefined} reason
 * @returns {string}
 */
export function getPsychAssessmentEvidenceReasonLabel(reason) {
  if (!reason || typeof reason !== 'string') {
    return '';
  }
  if (PSYCH_ASSESSMENT_REASON_LABELS[reason]) {
    return PSYCH_ASSESSMENT_REASON_LABELS[reason];
  }
  if (reason.startsWith(INSUFFICIENT_EVIDENCE_PREFIX)) {
    return PSYCH_ASSESSMENT_REASON_LABELS.insufficient_evidence;
  }
  if (reason.startsWith(HALLUCINATED_PREFIX)) {
    return PSYCH_ASSESSMENT_REASON_LABELS.hallucinated_scaleCode;
  }
  return toDisplayString(reason, '알 수 없는 사유입니다.');
}
