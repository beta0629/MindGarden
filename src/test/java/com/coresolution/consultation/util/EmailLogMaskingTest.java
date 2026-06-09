package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link EmailLogMasking} 회귀 테스트.
 *
 * <p>운영 BE 로그에서 발견된 이메일 평문 노출(PII) 마스킹 규칙이 정확히 적용되는지 검증한다.
 * 입력 형태별(정상/이상치/멀티 TLD/dot 없음 등)로 결정된 마스킹 결과를 고정한다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-09
 */
@DisplayName("EmailLogMasking — 로그용 이메일 마스킹 회귀")
class EmailLogMaskingTest {

    @Test
    @DisplayName("정상 이메일: jctdoys@gmail.com → j***@g***.com")
    void mask_typical_gmail() {
        assertThat(EmailLogMasking.maskForLog("jctdoys@gmail.com"))
                .isEqualTo("j***@g***.com");
    }

    @Test
    @DisplayName("정상 이메일(짧은 host): a@b.com → ***@***.com (local·host 모두 1글자 이하)")
    void mask_short_host() {
        assertThat(EmailLogMasking.maskForLog("a@b.com"))
                .isEqualTo("***@***.com");
    }

    @Test
    @DisplayName("멀티 레벨 TLD: a@b.co.kr → ***@***.co.kr (첫 dot 이후 보존)")
    void mask_multi_level_tld() {
        assertThat(EmailLogMasking.maskForLog("a@b.co.kr"))
                .isEqualTo("***@***.co.kr");
    }

    @Test
    @DisplayName("긴 host/TLD: jctdoys@example.co.kr → j***@e***.co.kr")
    void mask_long_host_with_multi_tld() {
        assertThat(EmailLogMasking.maskForLog("jctdoys@example.co.kr"))
                .isEqualTo("j***@e***.co.kr");
    }

    @Test
    @DisplayName("null 입력: null 그대로 반환")
    void mask_null_returns_null() {
        assertThat(EmailLogMasking.maskForLog(null)).isNull();
    }

    @Test
    @DisplayName("빈 문자열: 빈 문자열 그대로 반환")
    void mask_empty_returns_empty() {
        assertThat(EmailLogMasking.maskForLog("")).isEqualTo("");
    }

    @Test
    @DisplayName("@ 없음: 원본 그대로 반환 (parse 불가)")
    void mask_no_at_returns_original() {
        assertThat(EmailLogMasking.maskForLog("invalid")).isEqualTo("invalid");
    }

    @Test
    @DisplayName("@ 두 개: 원본 그대로 반환 (parse 불가)")
    void mask_double_at_returns_original() {
        assertThat(EmailLogMasking.maskForLog("a@b@c.com")).isEqualTo("a@b@c.com");
    }

    @Test
    @DisplayName("도메인에 dot 없음: x@local → ***@l*** (local 1글자 이하)")
    void mask_domain_without_dot() {
        assertThat(EmailLogMasking.maskForLog("x@local"))
                .isEqualTo("***@l***");
    }

    @Test
    @DisplayName("도메인에 dot 없음(긴 local): xy@local → x***@l***")
    void mask_domain_without_dot_with_longer_local() {
        assertThat(EmailLogMasking.maskForLog("xy@local"))
                .isEqualTo("x***@l***");
    }

    @Test
    @DisplayName("local part 1글자: a@example.com → ***@e***.com")
    void mask_single_char_local() {
        assertThat(EmailLogMasking.maskForLog("a@example.com"))
                .isEqualTo("***@e***.com");
    }

    @Test
    @DisplayName("host 1글자 + TLD: ab@b.com → a***@***.com")
    void mask_single_char_host() {
        assertThat(EmailLogMasking.maskForLog("ab@b.com"))
                .isEqualTo("a***@***.com");
    }

    @Test
    @DisplayName("local 비어있음: @example.com → 원본 그대로")
    void mask_empty_local_returns_original() {
        assertThat(EmailLogMasking.maskForLog("@example.com"))
                .isEqualTo("@example.com");
    }

    @Test
    @DisplayName("domain 비어있음: user@ → 원본 그대로")
    void mask_empty_domain_returns_original() {
        assertThat(EmailLogMasking.maskForLog("user@"))
                .isEqualTo("user@");
    }

    @Test
    @DisplayName("한글 local/domain: 홍길동@example.co.kr → 홍***@e***.co.kr")
    void mask_korean_local_and_domain() {
        assertThat(EmailLogMasking.maskForLog("홍길동@example.co.kr"))
                .isEqualTo("홍***@e***.co.kr");
    }

    @Test
    @DisplayName("도메인이 dot 으로 시작: user@.com → 그대로 처리(host=빈 문자열, TLD=.com)")
    void mask_domain_starts_with_dot() {
        assertThat(EmailLogMasking.maskForLog("user@.com"))
                .isEqualTo("u***@***.com");
    }
}
