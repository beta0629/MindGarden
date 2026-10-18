package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link CommonCodeFieldNormalizer} — null-safe trim · 빈 문자열 → null.
 *
 * @author CoreSolution
 * @since 2026-10-18
 */
@DisplayName("CommonCodeFieldNormalizer")
class CommonCodeFieldNormalizerTest {

    @Test
    @DisplayName("null 입력은 null")
    void nullStaysNull() {
        assertThat(CommonCodeFieldNormalizer.normalizeCodeGroup(null)).isNull();
        assertThat(CommonCodeFieldNormalizer.normalizeCodeValue(null)).isNull();
        assertThat(CommonCodeFieldNormalizer.normalizeCodeLabel(null)).isNull();
        assertThat(CommonCodeFieldNormalizer.trimToNull(null)).isNull();
    }

    @Test
    @DisplayName("앞뒤 공백을 제거한다")
    void trimsLeadingTrailingWhitespace() {
        assertThat(CommonCodeFieldNormalizer.normalizeCodeGroup("  EXPENSE_CATEGORY  "))
                .isEqualTo("EXPENSE_CATEGORY");
        assertThat(CommonCodeFieldNormalizer.normalizeCodeValue("  RENT  ")).isEqualTo("RENT");
        assertThat(CommonCodeFieldNormalizer.normalizeCodeLabel("  임대료  ")).isEqualTo("임대료");
    }

    @Test
    @DisplayName("trim 후 빈 문자열은 null")
    void blankAfterTrimBecomesNull() {
        assertThat(CommonCodeFieldNormalizer.normalizeCodeGroup("   ")).isNull();
        assertThat(CommonCodeFieldNormalizer.normalizeCodeValue("\t")).isNull();
        assertThat(CommonCodeFieldNormalizer.normalizeCodeLabel(" \n ")).isNull();
        assertThat(CommonCodeFieldNormalizer.trimToNull("")).isNull();
    }

    @Test
    @DisplayName("이미 정규화된 값은 그대로")
    void alreadyNormalizedUnchanged() {
        assertThat(CommonCodeFieldNormalizer.normalizeCodeValue("MEAL")).isEqualTo("MEAL");
        assertThat(CommonCodeFieldNormalizer.normalizeCodeLabel("식대")).isEqualTo("식대");
    }
}
