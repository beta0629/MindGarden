package com.coresolution.consultation.assessment.constants;

/**
 * 심리검사 추출 결과의 {@code reason} 코드(스네이크 케이스).
 * extractedJson 루트 필드 및 프론트 라벨 매핑과 동일 문자열을 유지한다.
 *
 * @author CoreSolution
 * @since 2026-05-08
 */
public final class PsychAssessmentExtractionReasonCodes {

    public static final String TCI_NO_TEXT = "tci_no_text";
    /** metrics 1~(EXPECTED-1)개: 일부 척도만 인식 */
    public static final String TCI_PARSE_PARTIAL = "tci_parse_partial";
    /** 본문은 TCI로 보이나 점수 표 패턴을 전혀 읽지 못함(metrics 빈 배열) */
    public static final String TCI_LAYOUT_UNMATCHED = "tci_layout_unmatched";
    public static final String MMPI_NO_TEXT = "mmpi_no_text";
    public static final String MMPI_PARSE_PARTIAL = "mmpi_parse_partial";
    public static final String OCR_UNCONFIGURED = "ocr_unconfigured";
    public static final String OCR_NO_TEXT = "ocr_no_text";

    private PsychAssessmentExtractionReasonCodes() {
    }
}
