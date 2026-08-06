package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link TokenLogMasking} 회귀 테스트.
 *
 * <p>비밀번호 재설정·JWT 등 토큰 원문이 로그 마스킹 결과에 포함되지 않는지 검증한다.</p>
 *
 * @author CoreSolution
 * @since 2026-08-05
 */
@DisplayName("TokenLogMasking — 로그용 토큰 마스킹 회귀")
class TokenLogMaskingTest {

    private static final String SAMPLE_JWT =
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIn0.signaturePart";

    @Test
    @DisplayName("null 입력: null 그대로 반환")
    void mask_null_returns_null() {
        assertThat(TokenLogMasking.maskForLog(null)).isNull();
    }

    @Test
    @DisplayName("빈 문자열: 빈 문자열 그대로 반환")
    void mask_empty_returns_empty() {
        assertThat(TokenLogMasking.maskForLog("")).isEqualTo("");
    }

    @Test
    @DisplayName("짧은 토큰(MIN 미만): *** 만 반환하고 원문 미포함")
    void mask_short_token_does_not_contain_original() {
        String shortToken = "abcdefghijk"; // length 11 < 12
        String masked = TokenLogMasking.maskForLog(shortToken);
        assertThat(masked).isEqualTo("***");
        assertThat(masked).doesNotContain(shortToken);
    }

    @Test
    @DisplayName("경계 길이(MIN): 앞4+...+뒤4, 원문 전체 미포함")
    void mask_min_length_boundary() {
        String token = "abcdefghijkl"; // length 12
        String masked = TokenLogMasking.maskForLog(token);
        assertThat(masked).isEqualTo("abcd...ijkl");
        assertThat(masked).isNotEqualTo(token);
        assertThat(masked).doesNotContain(token);
    }

    @Test
    @DisplayName("긴 JWT 형태: 앞뒤 일부만 남기고 원문 전체 미포함")
    void mask_long_jwt_does_not_contain_original() {
        String masked = TokenLogMasking.maskForLog(SAMPLE_JWT);
        assertThat(masked)
                .startsWith(SAMPLE_JWT.substring(0, TokenLogMasking.PREFIX_LENGTH))
                .endsWith(SAMPLE_JWT.substring(SAMPLE_JWT.length() - TokenLogMasking.SUFFIX_LENGTH))
                .contains("...");
        assertThat(masked).isNotEqualTo(SAMPLE_JWT);
        assertThat(masked).doesNotContain(SAMPLE_JWT);
        // 중간 payload 일부가 그대로 남지 않도록 길이도 원문보다 짧아야 함
        assertThat(masked.length()).isLessThan(SAMPLE_JWT.length());
    }

    @Test
    @DisplayName("리셋 링크에 붙은 토큰 쿼리값도 원문 미포함")
    void mask_reset_query_token_does_not_leak() {
        String resetToken = "reset-secret-token-value-xyz-0123456789";
        String masked = TokenLogMasking.maskForLog(resetToken);
        assertThat(masked).doesNotContain(resetToken);
        assertThat(masked).doesNotContain("secret-token-value");
    }
}
