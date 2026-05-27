package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.util.pii.PiiPatternType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * PII 스크러버 설정 — default 전략/패턴, enabledPatterns 파싱 검증.
 *
 * @author MindGarden
 * @since 2026-05-28
 */
@DisplayName("PiiScrubberProperties — strategy / enabledPatterns 파싱")
class PiiScrubberPropertiesTest {

    @Test
    @DisplayName("default 전략은 'regex'")
    void defaultStrategyIsRegex() {
        PiiScrubberProperties props = new PiiScrubberProperties();
        assertThat(props.getStrategy()).isEqualTo("regex");
    }

    @Test
    @DisplayName("default enabledPatterns 는 7개 전부")
    void defaultEnabledPatternsAreAllSeven() {
        PiiScrubberProperties props = new PiiScrubberProperties();
        assertThat(props.resolveEnabledPatterns())
            .containsExactlyInAnyOrder(PiiPatternType.values());
    }

    @Test
    @DisplayName("부분 활성화 (email,phone)")
    void partialPatterns() {
        PiiScrubberProperties props = new PiiScrubberProperties();
        props.setEnabledPatterns("email,phone");
        assertThat(props.resolveEnabledPatterns())
            .containsExactlyInAnyOrder(PiiPatternType.EMAIL, PiiPatternType.PHONE);
    }

    @Test
    @DisplayName("공백/대소문자 혼합 토큰 허용")
    void allowsWhitespaceAndMixedCase() {
        PiiScrubberProperties props = new PiiScrubberProperties();
        props.setEnabledPatterns(" Email , RRN , card ");
        assertThat(props.resolveEnabledPatterns())
            .containsExactlyInAnyOrder(PiiPatternType.EMAIL, PiiPatternType.RRN, PiiPatternType.CARD);
    }

    @Test
    @DisplayName("알 수 없는 토큰은 무시 (부분 활성화 허용)")
    void unknownTokensAreIgnored() {
        PiiScrubberProperties props = new PiiScrubberProperties();
        props.setEnabledPatterns("email,unknown,url");
        assertThat(props.resolveEnabledPatterns())
            .containsExactlyInAnyOrder(PiiPatternType.EMAIL, PiiPatternType.URL);
    }

    @Test
    @DisplayName("빈 문자열 / null 은 empty set")
    void emptyOrNullReturnsEmpty() {
        PiiScrubberProperties propsEmpty = new PiiScrubberProperties();
        propsEmpty.setEnabledPatterns("");
        assertThat(propsEmpty.resolveEnabledPatterns()).isEmpty();

        PiiScrubberProperties propsNull = new PiiScrubberProperties();
        propsNull.setEnabledPatterns(null);
        assertThat(propsNull.resolveEnabledPatterns()).isEmpty();
    }
}
