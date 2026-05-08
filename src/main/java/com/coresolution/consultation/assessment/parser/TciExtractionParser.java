package com.coresolution.consultation.assessment.parser;

import com.fasterxml.jackson.databind.ObjectMapper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * TCI(기질·성격) 해석 보고서류 PDF 텍스트에서 척도·백분위 등을 정규식으로 추출.
 * 상용 보고서 문장을 복제하지 않도록 구조·수치만 파싱한다.
 * <p>
 * 로컬 통합: PDFBox 등으로 사용자 환경의 PDF에서 평문만 추출한 뒤 {@link #parse(String)}에 전달하면 된다.
 * 원본 PDF 파일은 저장소에 커밋하지 않는다.
 * </p>
 *
 * @author CoreSolution
 * @since 2026-05-08
 */
public class TciExtractionParser {

    private static final Logger log = LoggerFactory.getLogger(TciExtractionParser.class);
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    /** 기대 척도 수(기질 4 + 성격 3) */
    private static final int EXPECTED_SCALE_COUNT = 7;

    /** 백분위·Percentile·P.R.·PR(단독 열) 등 — 값·괄호 설명 캡처 */
    private static final Pattern PERCENTILE_LINE = Pattern.compile(
            "(?i)(?:백\\s*분위|Percentile|P\\.\\s*R\\.|(?<![A-Za-z0-9가-힣_])PR(?![A-Za-z가-힣]))"
                    + "\\s*[:：]?\\s*(\\d+)\\s*\\(([^)]+)\\)");
    private static final Pattern PERCENTILE_INLINE = Pattern.compile(
            "(?i)(?:백\\s*분위|Percentile|P\\.\\s*R\\.|(?<![A-Za-z0-9가-힣_])PR(?![A-Za-z가-힣]))"
                    + "\\s*[:：]?\\s*(\\d+)");
    /** 본문·헤더 묶음에서 표 신호 탐지(단일 진실) */
    private static final Pattern PERCENTILE_HEADER_SIGNAL = Pattern.compile(
            "(?i)백\\s*분위|Percentile|P\\.\\s*R\\.|(?<![A-Za-z0-9가-힣_])PR(?![A-Za-z가-힣])");
    private static final Pattern RAW_OR_T_HEADER_SIGNAL = Pattern.compile(
            "(?i)(?:원\\s*점수|표준점수|T\\s*점수|T\\s*[- ]?score|(?<![A-Za-z])Raw(?![A-Za-z]))");
    private static final Pattern INTEGER_PATTERN = Pattern.compile("\\d+");
    private static final Pattern TYPE_CODE_LETTERS = Pattern.compile("(?<![A-Za-z가-힣])([LH]{3})(?![A-Za-z가-힣])");
    private static final Pattern TYPE_NEAR_LABEL = Pattern.compile(
            "(?:유형|형태|코드|타입)\\s*[:：\\s]*([LH]{3})", Pattern.CASE_INSENSITIVE);

    private TciExtractionParser() {
    }

    private record ScaleSpec(String scaleCode, String scaleLabel, String[] keywordsKo) {
    }

    private static final List<ScaleSpec> SCALE_SPECS = List.of(
            new ScaleSpec("NS", "탐색성(기질)", new String[]{"탐색성", "호기심", "자극추구", "NS"}),
            new ScaleSpec("HA", "우려성(기질)", new String[]{"우려성", "불안성", "위험회피", "HA"}),
            new ScaleSpec("RD", "보상의존성(기질)", new String[]{"보상의존", "사회적민감성", "애착", "RD"}),
            new ScaleSpec("P", "인내력(기질)", new String[]{"인내력", "끈기", "고집", "P"}),
            new ScaleSpec("SD", "자율성(성격)", new String[]{"자율성", "자기지향", "SD"}),
            new ScaleSpec("C", "연대감(성격)", new String[]{"연대감", "협력성", "타인중심", "C"}),
            new ScaleSpec("ST", "자기초월(성격)", new String[]{"자기초월", "초월", "ST"})
    );

    /**
     * PDF/OCR 평문에서 TCI 메트릭 JSON 생성.
     *
     * @param plainText 추출 텍스트
     * @return {@code {"metrics":[...], "personalityTypeCode":"LLL"?}} JSON 또는 null(본문 없음)
     */
    public static String parse(String plainText) {
        if (!StringUtils.hasText(plainText)) {
            log.debug("TciExtractionParser: plainText 비어 있음");
            return null;
        }
        String normalized = normalizeExtractedPlainText(plainText);
        ParseResult result = parseInternal(normalized);
        if (result.metrics().isEmpty()) {
            log.debug("TciExtractionParser: metrics 없음, textLen={}", plainText.length());
            return null;
        }
        try {
            Map<String, Object> root = new LinkedHashMap<>();
            root.put("metrics", result.metrics());
            if (StringUtils.hasText(result.personalityTypeCode())) {
                root.put("personalityTypeCode", result.personalityTypeCode());
            }
            return OBJECT_MAPPER.writeValueAsString(root);
        } catch (Exception e) {
            log.warn("TciExtractionParser: JSON 직렬화 실패: {}", e.getMessage());
            return null;
        }
    }

    private record ParseResult(List<Map<String, Object>> metrics, String personalityTypeCode) {
    }

    private static ParseResult parseInternal(String text) {
        List<Map<String, Object>> metrics = new ArrayList<>();
        Set<String> seenCodes = new LinkedHashSet<>();
        for (ScaleSpec spec : SCALE_SPECS) {
            MetricHit hit = findMetricForScale(text, spec);
            if (hit != null && !seenCodes.contains(spec.scaleCode())) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("scaleCode", spec.scaleCode());
                m.put("scaleLabel", spec.scaleLabel());
                if (hit.rawScore() != null) {
                    m.put("rawScore", hit.rawScore());
                }
                if (hit.percentile() != null) {
                    m.put("percentile", hit.percentile());
                }
                if (hit.tScore() != null) {
                    m.put("tScore", hit.tScore());
                }
                if (StringUtils.hasText(hit.cutoffTag())) {
                    m.put("cutoffTag", hit.cutoffTag());
                }
                metrics.add(m);
                seenCodes.add(spec.scaleCode());
            }
        }
        String typeCode = extractPersonalityTypeCode(text);
        return new ParseResult(metrics, typeCode);
    }

    private record MetricHit(Double rawScore, Double percentile, Double tScore, String cutoffTag) {
    }

    private static MetricHit findMetricForScale(String text, ScaleSpec spec) {
        int bestPos = Integer.MAX_VALUE;
        String window = null;
        for (String kw : spec.keywordsKo()) {
            int idx = findKeywordPosition(text, kw);
            if (idx >= 0 && idx < bestPos) {
                bestPos = idx;
                int end = Math.min(text.length(), idx + 420);
                window = text.substring(idx, end);
            }
        }
        if (window == null) {
            return null;
        }
        Matcher mLine = PERCENTILE_LINE.matcher(window);
        if (mLine.find()) {
            double p = Double.parseDouble(mLine.group(1));
            String level = normalizeLevel(mLine.group(2));
            Double raw = findOptionalRaw(window);
            Double t = findOptionalT(window);
            return new MetricHit(raw, p, t, level);
        }
        Matcher mIn = PERCENTILE_INLINE.matcher(window);
        if (mIn.find()) {
            double p = Double.parseDouble(mIn.group(1));
            Double raw = findOptionalRaw(window);
            Double t = findOptionalT(window);
            return new MetricHit(raw, p, t, null);
        }
        MetricHit tableRowHit = findTableRowMetric(text, spec);
        if (tableRowHit != null) {
            return tableRowHit;
        }
        return null;
    }

    private static int findKeywordPosition(String text, String keyword) {
        if (text == null || keyword == null) {
            return -1;
        }
        if (keyword.chars().allMatch(ch -> ch >= 'A' && ch <= 'Z')) {
            Matcher matcher = Pattern.compile("(?<![A-Za-z])" + Pattern.quote(keyword) + "(?![A-Za-z])",
                    Pattern.CASE_INSENSITIVE).matcher(text);
            return matcher.find() ? matcher.start() : -1;
        }
        int exact = indexOfIgnoreCase(text, keyword);
        if (exact >= 0) {
            return exact;
        }
        String compactText = text.replaceAll("\\s+", "");
        String compactKeyword = keyword.replaceAll("\\s+", "");
        int compactIndex = indexOfIgnoreCase(compactText, compactKeyword);
        if (compactIndex < 0) {
            return -1;
        }
        return approximateOriginalIndex(text, compactIndex);
    }

    private static int approximateOriginalIndex(String text, int compactIndex) {
        int nonWhitespaceCount = 0;
        for (int i = 0; i < text.length(); i++) {
            if (!Character.isWhitespace(text.charAt(i))) {
                if (nonWhitespaceCount == compactIndex) {
                    return i;
                }
                nonWhitespaceCount++;
            }
        }
        return -1;
    }

    private static int indexOfIgnoreCase(String text, String sub) {
        if (text == null || sub == null) {
            return -1;
        }
        String lower = text.toLowerCase(Locale.ROOT);
        String s = sub.toLowerCase(Locale.ROOT);
        return lower.indexOf(s);
    }

    private static MetricHit findTableRowMetric(String text, ScaleSpec spec) {
        if (!hasTciScoreTableHeader(text)) {
            return null;
        }
        String[] lines = text.split("[\\r\\n]+");
        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();
            if (!containsScaleKeyword(line, spec) || !hasNearbyPercentileHeader(lines, i)) {
                continue;
            }
            MetricHit hit = extractMetricFromTableRow(line);
            if (hit != null) {
                return hit;
            }
        }
        return null;
    }

    private static boolean hasTciScoreTableHeader(String text) {
        return hasScoreTableSignals(text);
    }

    private static boolean hasNearbyPercentileHeader(String[] lines, int currentIndex) {
        int start = Math.max(0, currentIndex - 10);
        int end = Math.min(lines.length - 1, currentIndex + 1);
        StringBuilder joined = new StringBuilder();
        for (int i = start; i <= end; i++) {
            joined.append(' ').append(lines[i]);
        }
        return hasScoreTableHeaderSignals(joined.toString());
    }

    /**
     * 한 줄 또는 인접 줄을 이어붙인 문자열에 표 헤더 신호(백분위류 + 원점수/T류)가 모두 있는지.
     * {@link #hasScoreTableSignals(String)} 과 동일 패턴을 사용한다.
     */
    private static boolean hasScoreTableHeaderSignals(String textChunk) {
        if (!StringUtils.hasText(textChunk)) {
            return false;
        }
        return PERCENTILE_HEADER_SIGNAL.matcher(textChunk).find()
                && RAW_OR_T_HEADER_SIGNAL.matcher(textChunk).find();
    }

    private static boolean containsScaleKeyword(String line, ScaleSpec spec) {
        for (String keyword : spec.keywordsKo()) {
            if (findKeywordPosition(line, keyword) >= 0) {
                return true;
            }
        }
        return false;
    }

    private static MetricHit extractMetricFromTableRow(String line) {
        List<Integer> numbers = extractNumberSequence(line);
        if (numbers.size() < 2) {
            return null;
        }
        int last = numbers.size() - 1;
        Double percentile = toPercentile(numbers.get(last));
        if (percentile == null) {
            return null;
        }
        Double tScore = null;
        Double rawScore = null;
        if (numbers.size() >= 3) {
            tScore = numbers.get(last - 1).doubleValue();
            rawScore = numbers.get(last - 2).doubleValue();
        } else {
            rawScore = numbers.get(0).doubleValue();
        }
        return new MetricHit(rawScore, percentile, tScore, null);
    }

    private static List<Integer> extractNumberSequence(String line) {
        List<Integer> numbers = new ArrayList<>();
        Matcher matcher = INTEGER_PATTERN.matcher(line);
        while (matcher.find()) {
            try {
                numbers.add(Integer.parseInt(matcher.group()));
            } catch (NumberFormatException ignored) {
                // 숫자 열 파싱 실패 값은 건너뛴다.
            }
        }
        return numbers;
    }

    private static Double toPercentile(Integer value) {
        if (value == null || value < 0 || value > 100) {
            return null;
        }
        return value.doubleValue();
    }

    private static String normalizeLevel(String raw) {
        if (raw == null) {
            return null;
        }
        String t = raw.replaceAll("\\s+", "").trim();
        if (t.contains("낮")) {
            return "낮음";
        }
        if (t.contains("높")) {
            return "높음";
        }
        if (t.contains("보통") || t.contains("평균") || t.contains("중간")) {
            return "보통";
        }
        return t.length() > 12 ? t.substring(0, 12) : t;
    }

    private static final Pattern RAW_SCORE_NEAR_LABEL = Pattern.compile(
            "(?i)(?:원\\s*점수|(?<![A-Za-z])Raw(?![A-Za-z]))\\s*[:：]?\\s*(\\d+)");
    private static final Pattern T_SCORE_LABELED = Pattern.compile(
            "(?i)(?:T\\s*점수|T\\s*[- ]?score)\\s*[:：]?\\s*(\\d+)");
    private static final Pattern T_SCORE_FALLBACK = Pattern.compile("T\\s*[:：]?\\s*(\\d{2,3})");

    private static Double findOptionalRaw(String window) {
        Matcher m = RAW_SCORE_NEAR_LABEL.matcher(window);
        if (m.find()) {
            return Double.parseDouble(m.group(1));
        }
        return null;
    }

    private static Double findOptionalT(String window) {
        Matcher m = T_SCORE_LABELED.matcher(window);
        if (m.find()) {
            return Double.parseDouble(m.group(1));
        }
        m = T_SCORE_FALLBACK.matcher(window);
        if (m.find()) {
            return Double.parseDouble(m.group(1));
        }
        return null;
    }

    private static String extractPersonalityTypeCode(String text) {
        Matcher m1 = TYPE_NEAR_LABEL.matcher(text);
        if (m1.find()) {
            return m1.group(1).toUpperCase(Locale.ROOT);
        }
        Matcher m2 = TYPE_CODE_LETTERS.matcher(text);
        while (m2.find()) {
            String code = m2.group(1).toUpperCase(Locale.ROOT);
            if (code.chars().allMatch(ch -> ch == 'L' || ch == 'H')) {
                int pos = m2.start();
                String ctx = text.substring(Math.max(0, pos - 80), Math.min(text.length(), pos + 40));
                if (ctx.contains("자율") || ctx.contains("연대") || ctx.contains("초월") || ctx.contains("성격")) {
                    return code;
                }
            }
        }
        return null;
    }

    /**
     * 파싱이 기대 척도보다 적으면 부분 성공로 본다.
     *
     * @param jsonOrNull {@link #parse(String)} 결과
     * @return true 이면 reason {@code tci_parse_partial} 후보
     */
    public static boolean isPartialResult(String jsonOrNull) {
        if (!StringUtils.hasText(jsonOrNull)) {
            return false;
        }
        try {
            var root = OBJECT_MAPPER.readTree(jsonOrNull);
            if (!root.path("metrics").isArray()) {
                return false;
            }
            int n = root.path("metrics").size();
            return n > 0 && n < EXPECTED_SCALE_COUNT;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * 점수 표 파서가 기대하는 헤더 신호(백분위 + 원점수/표준점수/T)가 평문에 있는지.
     * 드래그 가능 PDF여도 표 용어가 다르면 false가 될 수 있다.
     */
    public static boolean hasScoreTableSignals(String plainText) {
        if (!StringUtils.hasText(plainText)) {
            return false;
        }
        String t = normalizeExtractedPlainText(plainText);
        return hasScoreTableHeaderSignals(t);
    }

    /**
     * PDFBox 평문 진단 한 줄(본문 전체·점수 값 미기록, 민감도 낮춤).
     */
    public static String diagnosticSummary(String plainText) {
        if (!StringUtils.hasText(plainText)) {
            return "empty";
        }
        String n = normalizeExtractedPlainText(plainText);
        boolean pctWord = PERCENTILE_HEADER_SIGNAL.matcher(n).find();
        boolean rawOrT = RAW_OR_T_HEADER_SIGNAL.matcher(n).find();
        return String.format(Locale.ROOT,
                "len=%d, scoreTableSignals=%b, looksLikeTci=%b, hasPercentileWord=%b, hasRawOrT=%b, has탐색성=%b, has우려성=%b",
                n.length(), hasScoreTableSignals(n), looksLikeTciReport(n), pctWord, rawOrT,
                n.contains("탐색성"), n.contains("우려성"));
    }

    /**
     * 본문에 TCI/기질·성격 보고서로 추정되는 토큰이 있는지.
     */
    public static boolean looksLikeTciReport(String plainText) {
        if (!StringUtils.hasText(plainText)) {
            return false;
        }
        String t = plainText;
        return t.contains("기질") && t.contains("성격")
                || t.contains("TCI")
                || t.contains("자율성") && t.contains("연대감")
                || t.contains("해석상담") && t.contains("보고서");
    }

    /**
     * PDFBox 등 추출 평문 공백·개행 정규화.
     */
    private static String normalizeExtractedPlainText(String plainText) {
        if (plainText == null) {
            return "";
        }
        return plainText.replace("\r\n", "\n").replace('\r', '\n')
                .replace('\u00A0', ' ').replace('\u3000', ' ');
    }
}
