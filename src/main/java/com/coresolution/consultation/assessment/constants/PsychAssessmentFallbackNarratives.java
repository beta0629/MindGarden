package com.coresolution.consultation.assessment.constants;

import com.coresolution.consultation.assessment.model.PsychAssessmentType;

import org.springframework.util.StringUtils;

/**
 * 추출 지표가 없거나 불완전할 때 규칙 기반 마크다운에 넣는 사용자 안내 문구.
 *
 * @author CoreSolution
 * @since 2026-05-08
 */
public final class PsychAssessmentFallbackNarratives {

    private PsychAssessmentFallbackNarratives() {
    }

    /**
     * reason 코드에 따른 안내(기술 용어 최소화). reason이 없으면 일반 안내.
     *
     * @param assessmentType 검사 유형
     * @param reasonCode     extractedJson.reason (nullable)
     * @return 마크다운 본문에 포함할 bullet 블록
     */
    public static String markdownForEmptyMetrics(PsychAssessmentType assessmentType, String reasonCode) {
        if (!StringUtils.hasText(reasonCode)) {
            return defaultEmpty(assessmentType);
        }
        return switch (reasonCode) {
            case PsychAssessmentExtractionReasonCodes.TCI_NO_TEXT ->
                    "- TCI 보고서에서 읽을 수 있는 글자를 찾지 못했습니다. 파일이 이미지 위주이거나 글자가 흐릿하면 이 현상이 날 수 있습니다.\n"
                            + "- 선명한 PDF로 다시 올리거나, 스캔본이면 해상도를 높여 주세요.\n";
            case PsychAssessmentExtractionReasonCodes.TCI_PARSE_PARTIAL ->
                    "- TCI 보고서 일부만 인식되었습니다. 표·백분위 줄이 잘린 경우 점수가 빠질 수 있습니다.\n"
                            + "- 전체 페이지가 포함된 원본에 가깝게 다시 업로드해 주세요.\n";
            case PsychAssessmentExtractionReasonCodes.MMPI_NO_TEXT ->
                    "- MMPI 보고서에서 텍스트를 찾지 못했습니다. 이미지 PDF인 경우 OCR 설정이 필요할 수 있습니다.\n";
            case PsychAssessmentExtractionReasonCodes.MMPI_PARSE_PARTIAL ->
                    "- MMPI 점수 표를 일부만 읽었습니다. 원점수·T점수 행이 잘렸는지 확인해 주세요.\n";
            case PsychAssessmentExtractionReasonCodes.OCR_UNCONFIGURED ->
                    "- 이미지 인식(OCR) 환경이 준비되지 않았습니다. 관리자에게 Tesseract 설정을 요청하거나, 텍스트가 선택되는 PDF로 올려 주세요.\n";
            case PsychAssessmentExtractionReasonCodes.OCR_NO_TEXT ->
                    "- 이미지에서 글자를 읽지 못했습니다. 한글 인식용 설정과 이미지 선명도를 확인해 주세요.\n";
            default -> defaultEmpty(assessmentType);
        };
    }

    private static String defaultEmpty(PsychAssessmentType assessmentType) {
        if (assessmentType == PsychAssessmentType.TCI) {
            return "- TCI 점수를 자동으로 읽지 못했습니다. 원본 형식·스캔 품질을 확인한 뒤 다시 시도해 주세요.\n";
        }
        return "- 추출된 지표가 없어 해석을 생성할 수 없습니다. 원문 품질·양식 확인이 필요합니다.\n";
    }
}
