package com.coresolution.consultation.assessment.support;

/**
 * 심리검사 리포트 마크다운에서 섹션 본문 추출.
 *
 * @author CoreSolution
 * @since 2026-05-09
 */
public final class PsychAssessmentMarkdownSections {

    private PsychAssessmentMarkdownSections() {
    }

    /**
     * 지정한 헤더(예: "## 요약") 다음 본문을 추출한다.
     *
     * @param markdown      전체 리포트 마크다운
     * @param sectionHeader "## 요약", "## 권고" 등
     * @return 해당 섹션 본문(trim), 없거나 빈 본문이면 null
     */
    public static String extractSection(String markdown, String sectionHeader) {
        if (markdown == null || sectionHeader == null) {
            return null;
        }
        int start = markdown.indexOf(sectionHeader);
        if (start < 0) {
            return null;
        }
        int contentStart = markdown.indexOf('\n', start);
        if (contentStart < 0) {
            return null;
        }
        contentStart++;
        int nextSection = markdown.indexOf("\n## ", contentStart);
        String content = nextSection < 0
                ? markdown.substring(contentStart)
                : markdown.substring(contentStart, nextSection);
        String trimmed = content.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
