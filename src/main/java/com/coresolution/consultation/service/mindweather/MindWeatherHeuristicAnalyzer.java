package com.coresolution.consultation.service.mindweather;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import com.coresolution.consultation.constant.MindWeatherConstants;
import com.coresolution.consultation.dto.mindweather.MindWeatherKeywordPayload;
import org.springframework.stereotype.Component;

/**
 * 텍스트 기반 마음 날씨 휴리스틱 분석 (Expo mock과 동일 계열, LLM 없음).
 *
 * @author MindGarden
 * @since 2026-05-13
 */
@Component
public class MindWeatherHeuristicAnalyzer {

    private static final double MIXED_BAND = 0.2d;

    private static final List<KeywordDef> KEYWORDS = List.of(
        new KeywordDef("anxiety", "불안", -1, List.of("불안", "걱정", "초조", "두려", "무서", "떨려")),
        new KeywordDef("depression", "우울", -1, List.of("우울", "무기력", "슬프", "눈물", "울적", "허무")),
        new KeywordDef("anger", "화남", -1, List.of("화", "짜증", "분노", "열받", "억울", "서운")),
        new KeywordDef("loneliness", "외로움", -1, List.of("외로", "혼자", "쓸쓸", "소외")),
        new KeywordDef("fatigue", "피곤", -1, List.of("피곤", "지치", "졸려", "힘들", "번아웃")),
        new KeywordDef("stress", "스트레스", -1, List.of("스트레스", "압박", "부담", "치이")),
        new KeywordDef("calm", "평온", 1, List.of("평온", "차분", "편안", "안정", "잔잔")),
        new KeywordDef("gratitude", "감사", 1, List.of("감사", "고마", "다행")),
        new KeywordDef("happy", "행복", 1, List.of("행복", "기쁘", "즐거", "신나", "웃")),
        new KeywordDef("excited", "설렘", 1, List.of("설레", "두근", "기대", "신기"))
    );

    private static final String SUMMARY_POSITIVE =
        "오늘은 비교적 따뜻한 마음 결을 보이고 있어요.";
    private static final String SUMMARY_MIXED = "여러 감정이 섞여 있는 하루였어요.";
    private static final String SUMMARY_NEGATIVE = "오늘은 마음에 무게가 조금 느껴지는 하루였어요.";
    private static final String SUMMARY_EMPTY = "아직 마음 날씨를 분석할 만한 단서를 찾지 못했어요.";

    /**
     * 분석 결과.
     *
     * @param keywords 키워드 목록
     * @param tone       tone 코드
     * @param summary    한 줄 요약
     */
    public record AnalysisResult(List<MindWeatherKeywordPayload> keywords, String tone, String summary) {
    }

    /**
     * 입력 텍스트를 분석한다.
     *
     * @param text 원문
     * @return 키워드·톤·요약
     */
    public AnalysisResult analyze(String text) {
        if (text == null || text.isBlank()) {
            return new AnalysisResult(List.of(), MindWeatherConstants.TONE_EMPTY, SUMMARY_EMPTY);
        }
        String lowered = text.toLowerCase(Locale.ROOT);
        List<Hit> hits = new ArrayList<>();
        for (KeywordDef def : KEYWORDS) {
            int count = 0;
            for (String matcher : def.matchers()) {
                if (matcher != null && !matcher.isEmpty() && lowered.contains(matcher.toLowerCase(Locale.ROOT))) {
                    count++;
                }
            }
            if (count > 0) {
                hits.add(new Hit(def, count));
            }
        }
        if (hits.isEmpty()) {
            return new AnalysisResult(List.of(), MindWeatherConstants.TONE_EMPTY, SUMMARY_EMPTY);
        }
        int total = hits.stream().mapToInt(h -> h.hits).sum();
        hits.sort(Comparator.comparingInt((Hit h) -> h.hits).reversed());
        List<MindWeatherKeywordPayload> keywords = new ArrayList<>();
        int limit = Math.min(MindWeatherConstants.KEYWORD_DISPLAY_LIMIT, hits.size());
        for (int i = 0; i < limit; i++) {
            Hit h = hits.get(i);
            double weight = total > 0 ? (double) h.hits / (double) total : 0d;
            keywords.add(new MindWeatherKeywordPayload(
                h.def.key(), h.def.label(), weight, h.def.polarity()));
        }
        String tone = pickTone(keywords);
        String summary = buildSummary(keywords, tone);
        return new AnalysisResult(keywords, tone, summary);
    }

    private static String pickTone(List<MindWeatherKeywordPayload> keywords) {
        if (keywords.isEmpty()) {
            return MindWeatherConstants.TONE_EMPTY;
        }
        double positive = 0d;
        double negative = 0d;
        for (MindWeatherKeywordPayload k : keywords) {
            if (k.getPolarity() > 0) {
                positive += k.getWeight();
            } else if (k.getPolarity() < 0) {
                negative += k.getWeight();
            }
        }
        if (positive > 0 && negative > 0 && Math.abs(positive - negative) < MIXED_BAND) {
            return MindWeatherConstants.TONE_MIXED;
        }
        if (positive > negative) {
            return MindWeatherConstants.TONE_POSITIVE;
        }
        if (negative > positive) {
            return MindWeatherConstants.TONE_NEGATIVE;
        }
        return MindWeatherConstants.TONE_MIXED;
    }

    private static String buildSummary(List<MindWeatherKeywordPayload> keywords, String tone) {
        String base = switch (tone) {
            case MindWeatherConstants.TONE_POSITIVE -> SUMMARY_POSITIVE;
            case MindWeatherConstants.TONE_NEGATIVE -> SUMMARY_NEGATIVE;
            case MindWeatherConstants.TONE_MIXED -> SUMMARY_MIXED;
            default -> SUMMARY_EMPTY;
        };
        if (keywords.isEmpty()) {
            return base;
        }
        String lead = keywords.get(0).getLabel();
        if (lead == null || lead.isBlank()) {
            return base;
        }
        if (MindWeatherConstants.TONE_POSITIVE.equals(tone)) {
            return base + " 특히 '" + lead + "' 결이 두드러져요.";
        }
        if (MindWeatherConstants.TONE_NEGATIVE.equals(tone)) {
            return base + " '" + lead + "' 키워드가 자주 보였어요.";
        }
        if (MindWeatherConstants.TONE_MIXED.equals(tone)) {
            return base + " '" + lead + "' 등 여러 감정이 함께 보여요.";
        }
        return base;
    }

    private record KeywordDef(String key, String label, int polarity, List<String> matchers) {
    }

    private record Hit(KeywordDef def, int hits) {
    }
}
