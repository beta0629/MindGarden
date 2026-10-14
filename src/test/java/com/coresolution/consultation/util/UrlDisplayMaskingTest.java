package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link UrlDisplayMasking} 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-10-14
 */
@DisplayName("UrlDisplayMasking — URL query/fragment 마스킹")
class UrlDisplayMaskingTest {

    @Test
    @DisplayName("host+path 유지, query 원문 미포함")
    void maskQueryAndFragment_keepsHostPath_masksQuery() {
        String masked = UrlDisplayMasking.maskQueryAndFragment(
                "https://example.com/hook?token=abc");

        assertThat(masked).isEqualTo("https://example.com/hook?" + UrlDisplayMasking.QUERY_MASK);
        assertThat(masked).doesNotContain("token");
        assertThat(masked).doesNotContain("abc");
    }

    @Test
    @DisplayName("fragment 도 마스킹")
    void maskQueryAndFragment_masksFragment() {
        String masked = UrlDisplayMasking.maskQueryAndFragment(
                "https://example.com/return#secret-frag");

        assertThat(masked).isEqualTo("https://example.com/return#" + UrlDisplayMasking.FRAGMENT_MASK);
        assertThat(masked).doesNotContain("secret-frag");
    }

    @Test
    @DisplayName("query 없으면 host+path 평문")
    void maskQueryAndFragment_noQuery_keepsPlain() {
        assertThat(UrlDisplayMasking.maskQueryAndFragment("https://live.example.com/webhook/path"))
                .isEqualTo("https://live.example.com/webhook/path");
    }

    @Test
    @DisplayName("파싱 실패 시 SecretValueMasking fallback — 원문 미노출")
    void maskQueryAndFragment_unparseable_fallsBackToSecretMask() {
        String raw = "not a url token=secret-value-XYZ1";
        String masked = UrlDisplayMasking.maskQueryAndFragment(raw);

        assertThat(masked).isEqualTo(SecretValueMasking.mask(raw));
        assertThat(masked).doesNotContain("secret-value");
    }

    @Test
    @DisplayName("null·blank 는 empty")
    void maskQueryAndFragment_nullOrBlank() {
        assertThat(UrlDisplayMasking.maskQueryAndFragment(null)).isEqualTo(SecretValueMasking.EMPTY);
        assertThat(UrlDisplayMasking.maskQueryAndFragment("   ")).isEqualTo(SecretValueMasking.EMPTY);
    }
}
