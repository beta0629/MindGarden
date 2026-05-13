package com.coresolution.consultation.service.mindweather;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.coresolution.consultation.constant.MindWeatherConstants;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link MindWeatherHeuristicAnalyzer} 단위 테스트 (LLM 없이 키워드·톤 산출 검증).
 *
 * @author MindGarden
 * @since 2026-05-13
 */
@DisplayName("MindWeatherHeuristicAnalyzer")
class MindWeatherHeuristicAnalyzerTest {

    private MindWeatherHeuristicAnalyzer analyzer;

    @BeforeEach
    void setUp() {
        analyzer = new MindWeatherHeuristicAnalyzer();
    }

    @Test
    @DisplayName("불안·걱정 어휘에서 불안 키워드와 부정 톤을 산출한다")
    void analyze_anxietyKeywords_negativeTone() {
        MindWeatherHeuristicAnalyzer.AnalysisResult r =
            analyzer.analyze("오늘 너무 불안하고 걱정돼서 초조했어요.");

        assertFalse(r.keywords().isEmpty(), "키워드가 최소 1개는 나와야 한다");
        assertEquals("anxiety", r.keywords().get(0).getKey());
        assertEquals(MindWeatherConstants.TONE_NEGATIVE, r.tone());
        assertTrue(r.summary().contains("불안"), "요약에 선두 키워드 라벨이 반영되어야 한다");
    }

    @Test
    @DisplayName("공백만 있으면 empty 톤과 빈 키워드다")
    void analyze_blank_returnsEmpty() {
        MindWeatherHeuristicAnalyzer.AnalysisResult r = analyzer.analyze("   ");
        assertTrue(r.keywords().isEmpty());
        assertEquals(MindWeatherConstants.TONE_EMPTY, r.tone());
    }

    @Test
    @DisplayName("긍정 어휘는 positive 톤을 만든다")
    void analyze_gratitude_positiveTone() {
        MindWeatherHeuristicAnalyzer.AnalysisResult r =
            analyzer.analyze("오늘은 정말 감사한 마음이 들고 행복했어요.");
        assertEquals(MindWeatherConstants.TONE_POSITIVE, r.tone());
        assertFalse(r.keywords().isEmpty());
    }
}
