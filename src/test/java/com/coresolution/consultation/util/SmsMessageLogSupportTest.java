package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link SmsMessageLogSupport#extractUrls(String)} 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-11-24
 */
@DisplayName("SmsMessageLogSupport — 본문 URL 추출")
class SmsMessageLogSupportTest {

    @Test
    @DisplayName("null/빈 문자열 → 빈 목록")
    void nullOrBlank_returnsEmpty() {
        assertThat(SmsMessageLogSupport.extractUrls(null)).isEmpty();
        assertThat(SmsMessageLogSupport.extractUrls("")).isEmpty();
    }

    @Test
    @DisplayName("URL 없으면 빈 목록")
    void noUrl_returnsEmpty() {
        assertThat(SmsMessageLogSupport.extractUrls("결제가 완료되었습니다.")).isEmpty();
    }

    @Test
    @DisplayName("http·https URL 추출")
    void extractsHttpAndHttps() {
        String body = "확인: http://example.com/a 및 https://example.org/path?x=1 끝";
        List<String> urls = SmsMessageLogSupport.extractUrls(body);

        assertThat(urls).containsExactly(
                "http://example.com/a",
                "https://example.org/path?x=1");
    }

    @Test
    @DisplayName("따옴표·공백 앞에서 URL 절단")
    void stopsAtQuoteOrWhitespace() {
        String body = "link=\"https://host.example/invite\" next";
        assertThat(SmsMessageLogSupport.extractUrls(body))
                .containsExactly("https://host.example/invite");
    }
}
