package com.coresolution.consultation.assessment.service.impl;

import org.springframework.util.StringUtils;

import java.util.regex.Pattern;

/**
 * 심리검사 AI 리포트 마크다운의 필수 섹션(헤딩) 검증.
 * OpenAIPsychAiServiceImpl과 단위 테스트에서 공유한다.
 *
 * @author CoreSolution
 * @since 2026-05-08
 */
final class PsychAiReportSectionChecks {

    private PsychAiReportSectionChecks() {
    }

    /**
     * 요약·권고 마크다운 헤딩 변형 허용. BOM·공백·전각·줄바꿈·영문 헤더 fallback 대응.
     * 기존 저장 리포트·모델 출력 변형과의 호환을 위해 완화 규칙을 유지한다.
     */
    static boolean hasSummaryAndRecommendationHeadings(String reportMarkdown) {
        if (!StringUtils.hasText(reportMarkdown)) {
            return false;
        }
        String normalized = normalizeWhitespace(reportMarkdown);
        Pattern summaryLineStart = Pattern.compile("^\\s*[#＃]+[\\s\\S]*?요약", Pattern.MULTILINE | Pattern.UNICODE_CASE);
        Pattern recommendationLineStart = Pattern.compile("^\\s*[#＃]+[\\s\\S]*?권고", Pattern.MULTILINE | Pattern.UNICODE_CASE);
        if (summaryLineStart.matcher(normalized).find() && recommendationLineStart.matcher(normalized).find()) {
            return true;
        }
        Pattern summaryAnywhere = Pattern.compile("[#＃]+[\\s\\S]*?요약", Pattern.UNICODE_CASE);
        Pattern recommendationAnywhere = Pattern.compile("[#＃]+[\\s\\S]*?권고", Pattern.UNICODE_CASE);
        if (summaryAnywhere.matcher(normalized).find() && recommendationAnywhere.matcher(normalized).find()) {
            return true;
        }
        if (normalized.contains("요약") && (normalized.contains("권고") || normalized.contains("권고사항"))) {
            return true;
        }
        String lower = normalized.toLowerCase(java.util.Locale.ROOT);
        return lower.contains("summary") && (lower.contains("recommendation") || lower.contains("recommendations"));
    }

    /**
     * TCI: 시스템 프롬프트에 정의된 6단 헤딩이 등장 순서대로 존재하는지 검사한다.
     */
    static boolean hasTciDesignerHeadingsInOrder(String reportMarkdown) {
        if (!hasSummaryAndRecommendationHeadings(reportMarkdown)) {
            return false;
        }
        String n = normalizeWhitespace(reportMarkdown);
        int iSummary = indexFlexibleSummaryHeading(n);
        int iRec = indexFlexibleRecommendationHeading(n);
        if (iSummary < 0 || iRec < 0) {
            return false;
        }
        int iOverview = indexStrictH2Heading(n, "검사 개요");
        int iProfile = indexStrictH2Heading(n, "기질·성격 프로필");
        int iScores = indexStrictH2Heading(n, "점수 해석");
        int iCounsel = indexStrictH2Heading(n, "상담 시 고려");
        if (iOverview < 0 || iProfile < 0 || iScores < 0 || iCounsel < 0) {
            return false;
        }
        return iSummary < iOverview && iOverview < iProfile && iProfile < iScores && iScores < iCounsel && iCounsel < iRec;
    }

    /**
     * MMPI: 타당도·임상·재구성·강점·권고 구조의 필수 헤딩이 순서대로 존재하는지 검사한다.
     */
    static boolean hasMmpiDesignerHeadingsInOrder(String reportMarkdown) {
        if (!hasSummaryAndRecommendationHeadings(reportMarkdown)) {
            return false;
        }
        String n = normalizeWhitespace(reportMarkdown);
        int iSummary = indexFlexibleSummaryHeading(n);
        int iRec = indexFlexibleRecommendationHeading(n);
        if (iSummary < 0 || iRec < 0) {
            return false;
        }
        int iValidity = indexStrictH2Heading(n, "타당도");
        int iClinical = indexStrictH2Heading(n, "임상 척도");
        int iRc = indexStrictH2Heading(n, "재구성 척도");
        int iStrength = indexStrictH2Heading(n, "강점 및 자원");
        if (iValidity < 0 || iClinical < 0 || iRc < 0 || iStrength < 0) {
            return false;
        }
        return iSummary < iValidity && iValidity < iClinical && iClinical < iRc && iRc < iStrength && iStrength < iRec;
    }

    static String normalizeWhitespace(String reportMarkdown) {
        return reportMarkdown
                .replace("\uFEFF", "")
                .replace("\r", "")
                .replace("\u00A0", " ")
                .replace("\u3000", " ");
    }

    static int indexFlexibleSummaryHeading(String normalized) {
        Pattern p = Pattern.compile("^\\s*[#＃]{1,6}\\s+[^\\n]*요약", Pattern.MULTILINE | Pattern.UNICODE_CASE);
        var m = p.matcher(normalized);
        return m.find() ? m.start() : -1;
    }

    static int indexFlexibleRecommendationHeading(String normalized) {
        Pattern p = Pattern.compile("^\\s*[#＃]{1,6}\\s+[^\\n]*권고", Pattern.MULTILINE | Pattern.UNICODE_CASE);
        var m = p.matcher(normalized);
        return m.find() ? m.start() : -1;
    }

    /**
     * 줄 시작의 마크다운 헤딩(##~######) 뒤에 제목 문구가 오는 경우의 시작 인덱스.
     */
    static int indexStrictH2Heading(String normalized, String titleAfterHashes) {
        if (!StringUtils.hasText(titleAfterHashes)) {
            return -1;
        }
        Pattern p = Pattern.compile("^\\s*[#＃]{1,6}\\s+" + Pattern.quote(titleAfterHashes) + "\\s*(?:\\n|:|$)",
                Pattern.MULTILINE | Pattern.UNICODE_CASE);
        var m = p.matcher(normalized);
        return m.find() ? m.start() : -1;
    }
}
