package com.coresolution.consultation.assessment.parser;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * TCI 텍스트 추출 파서 단위 테스트. 실제 상용 보고서 PDF는 커밋하지 않는다.
 * 로컬에서 사용자 PDF로 검증할 때는 PDF를 텍스트로 추출한 뒤 {@link TciExtractionParser#parse(String)}에 넣어 확인하면 된다.
 *
 * @author CoreSolution
 * @since 2026-05-08
 */
class TciExtractionParserTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Test
    void parseClasspathFixture_extractsMetricsAndTypeCode() throws Exception {
        var res = new ClassPathResource("psych-assessment/tci-sample-fake.txt");
        String text = res.getContentAsString(StandardCharsets.UTF_8);
        String json = TciExtractionParser.parse(text);
        assertNotNull(json);
        JsonNode root = MAPPER.readTree(json);
        assertTrue(root.path("metrics").isArray());
        assertEquals(7, root.path("metrics").size());
        assertEquals("LHL", root.path("personalityTypeCode").asText());
        JsonNode first = root.path("metrics").get(0);
        assertEquals("NS", first.path("scaleCode").asText());
        assertEquals(45.0, first.path("percentile").asDouble());
    }

    @Test
    void parsePdfBoxTableFixture_extractsCanonicalScaleRows() throws Exception {
        var res = new ClassPathResource("psych-assessment/tci-sample-pdfbox-table-fake.txt");
        String text = res.getContentAsString(StandardCharsets.UTF_8);
        String json = TciExtractionParser.parse(text);
        assertNotNull(json);
        JsonNode root = MAPPER.readTree(json);
        assertEquals(7, root.path("metrics").size());
        assertEquals("HHL", root.path("personalityTypeCode").asText());

        JsonNode third = root.path("metrics").get(2);
        assertEquals("RD", third.path("scaleCode").asText());
        assertEquals(20.0, third.path("rawScore").asDouble());
        assertEquals(58.0, third.path("tScore").asDouble());
        assertEquals(72.0, third.path("percentile").asDouble());
    }

    @Test
    void parseMixedEnKoTableHeaderFixture_extractsSevenScales() throws Exception {
        var res = new ClassPathResource("psych-assessment/tci-sample-mixed-en-ko-table-fake.txt");
        String text = res.getContentAsString(StandardCharsets.UTF_8);
        assertTrue(TciExtractionParser.hasScoreTableSignals(text));
        String json = TciExtractionParser.parse(text);
        assertNotNull(json);
        JsonNode root = MAPPER.readTree(json);
        assertEquals(7, root.path("metrics").size());
        assertEquals("HLH", root.path("personalityTypeCode").asText());
    }

    @Test
    void parseSpacedPercentileAndEnglishLabelsFixture_extractsMetrics() throws Exception {
        var res = new ClassPathResource("psych-assessment/tci-sample-spaced-percentile-block-fake.txt");
        String text = res.getContentAsString(StandardCharsets.UTF_8);
        assertTrue(TciExtractionParser.hasScoreTableSignals(text));
        String json = TciExtractionParser.parse(text);
        assertNotNull(json);
        JsonNode root = MAPPER.readTree(json);
        assertEquals(7, root.path("metrics").size());
        assertEquals("LHL", root.path("personalityTypeCode").asText());
        JsonNode ns = root.path("metrics").get(0);
        assertEquals("NS", ns.path("scaleCode").asText());
        assertEquals(45.0, ns.path("percentile").asDouble());
        assertEquals(20.0, ns.path("rawScore").asDouble());
        assertEquals(52.0, ns.path("tScore").asDouble());
    }

    @Test
    void hasScoreTableSignals_trueWhenOnlyStandardDotNotStandardSoo() {
        // dev 로그: hasPercentileWord=true, hasRawOrT=false — '표준점' 단독 열 등
        assertTrue(TciExtractionParser.hasScoreTableSignals(
                "TCI\n백분위\t표준점\t원천점수\n"));
    }

    @Test
    void parseFullwidthLatinHeader_normalizesNfkcAndExtractsMetrics() {
        // PDFBox가 열 헤더를 전각 라틴(Ｔ U+FF34)으로 뽑는 경우
        String text = "TCI 기질·성격\n"
                + "백분위\tＴ\t점수\t원천\n"
                + "탐색성\t45\t52\t20\n"
                + "우려성\t50\t50\t15\n"
                + "보상의존\t55\t48\t18\n"
                + "지속성\t40\t45\t22\n"
                + "자율성\t60\t55\t25\n"
                + "연대감\t35\t40\t10\n"
                + "자기초월\t50\t50\t20\n"
                + "유형: LHL\n";
        assertTrue(TciExtractionParser.hasScoreTableSignals(text));
        String json = TciExtractionParser.parse(text);
        assertNotNull(json);
    }

    @Test
    void looksLikeTciReport_trueForFixture() throws Exception {
        var res = new ClassPathResource("psych-assessment/tci-sample-fake.txt");
        String text = res.getContentAsString(StandardCharsets.UTF_8);
        assertTrue(TciExtractionParser.looksLikeTciReport(text));
    }

    @Test
    void isPartialResult_whenFewerThanSevenScales() {
        String partial = "{\"metrics\":[{\"scaleCode\":\"NS\",\"percentile\":50}]}";
        assertTrue(TciExtractionParser.isPartialResult(partial));
    }

    @Test
    void isPartialResult_falseWhenSevenScalesInFixture() throws Exception {
        var res = new ClassPathResource("psych-assessment/tci-sample-fake.txt");
        String text = res.getContentAsString(StandardCharsets.UTF_8);
        String json = TciExtractionParser.parse(text);
        assertNotNull(json);
        assertFalse(TciExtractionParser.isPartialResult(json));
    }
}
