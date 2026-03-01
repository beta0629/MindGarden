package com.coresolution.consultation.assessment.parser;

import com.fasterxml.jackson.databind.ObjectMapper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * MMPI-2 PDF 텍스트에서 척도·원점수·T점수 파싱.
 * mmpi_이혁진.pdf 기준 테이블형 구조 인식.
 *
 * @author CoreSolution
 * @since 2025-03-02
 */
public class Mmpi2ExtractionParser {

    private static final Logger log = LoggerFactory.getLogger(Mmpi2ExtractionParser.class);
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private Mmpi2ExtractionParser() {
    }

    /** MMPI-2 표준 척도 순서 (원점수/전체규준 T 행과 열 위치 매칭용) */
    private static final String[] MMPI2_SCALE_CODES = {
            "VRIN", "TRIN", "F", "F(B)", "F(P)", "FBS", "L", "K", "S",
            "Hs", "D", "Hy", "Pd", "Mf", "Pa", "Pt", "Sc", "Ma", "Si"
    };

    /**
     * PDF에서 추출한 텍스트에서 MMPI-2 메트릭 파싱.
     *
     * @param pdfText PDF 텍스트 (PDFTextStripper 추출 결과)
     * @return JSON 문자열 {@code {"metrics":[{scaleCode, rawScore, tScore}, ...]}} 또는 null
     */
    public static String parse(String pdfText) {
        if (!StringUtils.hasText(pdfText)) {
            log.debug("Mmpi2ExtractionParser: pdfText 빈 문자열");
            return null;
        }
        List<Map<String, Object>> metrics = parseMetrics(pdfText);
        if (metrics.isEmpty()) {
            log.debug("Mmpi2ExtractionParser: parseMetrics 빈 리스트 반환");
            return null;
        }
        try {
            Map<String, Object> root = new LinkedHashMap<>();
            root.put("metrics", metrics);
            return OBJECT_MAPPER.writeValueAsString(root);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * 원점수 라인 패턴: "원점수", "Raw Score", "Raw", "RawScore", "원 점수"
     */
    private static boolean isRawScoreLine(String line) {
        return line.contains("원점수") || line.contains("원 점수")
                || line.contains("Raw Score") || line.contains("RawScore") || line.contains("Raw");
    }

    /**
     * 전체규준 T 라인 패턴: "전체규준", "전체 규준", "T점수", "T 점수", "전체규준T", "전체규준 T", "T-점수"
     */
    private static boolean isTScoreLine(String line) {
        return line.contains("전체규준") || line.contains("전체 규준")
                || line.contains("T점수") || line.contains("T 점수")
                || line.contains("전체규준T") || line.contains("전체규준 T")
                || line.contains("T-점수");
    }

    /**
     * 원점수 / 전체규준 T 라인에서 숫자 시퀀스 추출 후 척도별 rawScore, tScore 매칭.
     */
    private static List<Map<String, Object>> parseMetrics(String pdfText) {
        List<Map<String, Object>> result = new ArrayList<>();
        String[] lines = pdfText.split("[\r\n]+");
        List<Integer> rawScores = null;
        List<Integer> tScores = null;

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();
            if (isRawScoreLine(line)) {
                rawScores = extractNumberSequence(line);
                if (rawScores.isEmpty() && i + 1 < lines.length) {
                    rawScores = extractNumberSequence(lines[i + 1].trim());
                }
            } else if (isTScoreLine(line)) {
                tScores = extractNumberSequence(line);
                if (tScores.isEmpty() && i + 1 < lines.length) {
                    tScores = extractNumberSequence(lines[i + 1].trim());
                }
            }
        }

        if (rawScores == null || tScores == null) {
            log.debug("원점수/전체규준 패턴 미발견: rawScores={}, tScores={}",
                    rawScores == null ? "null" : "found", tScores == null ? "null" : "found");
            return result;
        }

        int count = Math.min(MMPI2_SCALE_CODES.length,
                Math.min(rawScores.size(), tScores.size()));

        for (int j = 0; j < count; j++) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("scaleCode", MMPI2_SCALE_CODES[j]);
            m.put("rawScore", rawScores.get(j).doubleValue());
            m.put("tScore", tScores.get(j).doubleValue());
            result.add(m);
        }
        return result;
    }

    /**
     * 라인에서 연속된 정수 추출. "53F" 등 접미사 제거 후 숫자만 추출.
     */
    private static List<Integer> extractNumberSequence(String line) {
        List<Integer> nums = new ArrayList<>();
        Pattern p = Pattern.compile("\\d+");
        Matcher m = p.matcher(line);
        while (m.find()) {
            try {
                nums.add(Integer.parseInt(m.group()));
            } catch (NumberFormatException ignored) {
                // skip
            }
        }
        return nums;
    }
}
