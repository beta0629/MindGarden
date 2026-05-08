package com.coresolution.consultation.assessment.service.impl;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * {@link PsychAiReportSectionChecks} 단위 검증.
 *
 * @author CoreSolution
 * @since 2026-05-08
 */
class PsychAiReportSectionChecksTest {

    private static final String TCI_VALID = """
## 요약

요약 본문

## 검사 개요

개요

## 기질·성격 프로필

프로필

## 점수 해석

점수

## 상담 시 고려

상담

## 권고

권고 본문
""";

    private static final String MMPI_VALID = """
## 요약

요약

## 타당도

VRIN

## 임상 척도

임상

## 재구성 척도

RC

## 강점 및 자원

강점

## 권고

권고
""";

    @Test
    @DisplayName("TCI: 디자이너 6단 헤딩 순서 충족 시 true")
    void tciDesignerOrder_ok() {
        assertTrue(PsychAiReportSectionChecks.hasTciDesignerHeadingsInOrder(TCI_VALID));
    }

    @Test
    @DisplayName("TCI: 권고가 중간 헤딩보다 앞서면 false")
    void tciRecommendationBeforeMiddle_false() {
        String bad = """
## 요약

a
## 권고

early
## 검사 개요

b
## 기질·성격 프로필

c
## 점수 해석

d
## 상담 시 고려

e
""";
        assertFalse(PsychAiReportSectionChecks.hasTciDesignerHeadingsInOrder(bad));
    }

    @Test
    @DisplayName("TCI: 본문 키워드만 있고 헤딩이 없으면 false")
    void tciKeywordsOnly_false() {
        String bodyOnly = "검사 개요 내용. 기질 프로필. 점수 해석. 상담 시 고려할 점. 요약 권고";
        assertFalse(PsychAiReportSectionChecks.hasTciDesignerHeadingsInOrder(bodyOnly));
    }

    @Test
    @DisplayName("MMPI: 디자이너 6단 헤딩 순서 충족 시 true")
    void mmpiDesignerOrder_ok() {
        assertTrue(PsychAiReportSectionChecks.hasMmpiDesignerHeadingsInOrder(MMPI_VALID));
    }

    @Test
    @DisplayName("MMPI: 재구성 척도 헤딩 누락 시 false")
    void mmpiMissingRc_false() {
        String missing = """
## 요약

a
## 타당도

b
## 임상 척도

c
## 강점 및 자원

d
## 권고

e
""";
        assertFalse(PsychAiReportSectionChecks.hasMmpiDesignerHeadingsInOrder(missing));
    }

    @Test
    @DisplayName("요약·권고: 공백·권고사항 변형 허용")
    void summaryRecommendation_flexible() {
        String md = "##  요약\n\nx\n\n### 권고사항\n\ny\n";
        assertTrue(PsychAiReportSectionChecks.hasSummaryAndRecommendationHeadings(md));
    }

    @Test
    @DisplayName("요약·권고: 한 줄에 두 헤딩이 있어도 인정")
    void summaryRecommendation_singleLine() {
        String md = "## 요약 내용 ## 권고 내용";
        assertTrue(PsychAiReportSectionChecks.hasSummaryAndRecommendationHeadings(md));
    }

    @Test
    @DisplayName("MMPI: 요약·권고만 있으면 확장 검증 false")
    void mmpiOnlySummaryRec_false() {
        String md = "## 요약\n\na\n\n## 권고\n\nb\n";
        assertTrue(PsychAiReportSectionChecks.hasSummaryAndRecommendationHeadings(md));
        assertFalse(PsychAiReportSectionChecks.hasMmpiDesignerHeadingsInOrder(md));
    }
}
