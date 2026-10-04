package com.coresolution.consultation.assessment.service;

import com.coresolution.consultation.assessment.model.PsychAssessmentType;

import java.util.List;

public interface PsychAiService {

    /**
     * 이름 식별자 없이 보고서 생성 (패턴 마스킹만).
     */
    default AiResult generateKoreanReport(PsychAssessmentType assessmentType, List<MetricInput> metrics,
            String baseMarkdown) {
        return generateKoreanReport(assessmentType, metrics, baseMarkdown, List.of());
    }

    /**
     * 보고서 생성. {@code maskingIdentifiers}(내담자·담당 상담사 이름 등)는 AI 전송 전과 사용 로그 저장 전에 {@code [이름]}
     * 으로 치환된다.
     *
     * @param assessmentType     검사 종류
     * @param metrics            지표
     * @param baseMarkdown       규칙 기반 본문
     * @param maskingIdentifiers 같은 테넌트에서 조회한 이름 식별자 (null 허용)
     * @return AI 결과
     */
    AiResult generateKoreanReport(PsychAssessmentType assessmentType, List<MetricInput> metrics, String baseMarkdown,
            List<String> maskingIdentifiers);

    record MetricInput(String scaleCode, String scaleLabel, Double rawScore, Double tScore, Double percentile, String cutoffTag) {}

    record AiResult(String reportMarkdown, String evidenceJson, String modelName, String promptVersion) {}
}


