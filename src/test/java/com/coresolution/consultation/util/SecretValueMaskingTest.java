package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link SecretValueMasking} 단위 테스트.
 *
 * <p>P0 보안(2026-10-03): 응답에 시크릿 평문이 남지 않는지, 마지막 4자리만 노출하는지 검증.
 *
 * @author MindGarden
 * @since 2026-10-03
 */
@DisplayName("SecretValueMasking — 시크릿 마스킹")
class SecretValueMaskingTest {

    /** 테스트 픽스처 — 실제 키가 아니다. */
    private static final String FIXTURE_SECRET = "sk-test-FIXTURE-abcdefgh1234";

    @Test
    @DisplayName("마지막 4자리만 남기고 평문이 응답에 남지 않는다")
    void mask_keepsOnlyTailFourChars() {
        String masked = SecretValueMasking.mask(FIXTURE_SECRET);

        assertThat(masked).hasSameSizeAs(FIXTURE_SECRET);
        assertThat(masked).endsWith("1234");
        assertThat(masked).doesNotContain(FIXTURE_SECRET);
        assertThat(masked).doesNotContain("sk-test");
        assertThat(masked).doesNotContain("FIXTURE");
        assertThat(masked.substring(0, masked.length() - SecretValueMasking.VISIBLE_TAIL_LENGTH))
                .matches("^\\*+$");
    }

    @Test
    @DisplayName("4자 이하 값은 전체 마스킹 — 꼬리 노출 없음")
    void mask_shortValue_masksAll() {
        assertThat(SecretValueMasking.mask("abcd")).isEqualTo("****");
        assertThat(SecretValueMasking.mask("a")).isEqualTo("*");
        assertThat(SecretValueMasking.mask("abc")).isEqualTo("***");
    }

    @Test
    @DisplayName("null·빈 값은 빈 문자열 — 설정 여부는 false")
    void mask_nullOrEmpty() {
        assertThat(SecretValueMasking.mask(null)).isEqualTo(SecretValueMasking.EMPTY);
        assertThat(SecretValueMasking.mask("")).isEqualTo(SecretValueMasking.EMPTY);
        assertThat(SecretValueMasking.isConfigured(null)).isFalse();
        assertThat(SecretValueMasking.isConfigured("")).isFalse();
        assertThat(SecretValueMasking.isConfigured("   ")).isFalse();
        assertThat(SecretValueMasking.isConfigured(FIXTURE_SECRET)).isTrue();
    }
}
