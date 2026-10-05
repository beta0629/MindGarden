package com.coresolution.consultation.service.portone;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

/**
 * {@link PortOneIdempotencyKeyHeader} — RFC 8941 sf-string 포맷.
 */
class PortOneIdempotencyKeyHeaderTest {

    @Test
    @DisplayName("일반 키 — 큰따옴표로 감싸고 내용은 그대로")
    void toHeaderValue_wrapsInQuotes() {
        assertEquals("\"mg-shop-refund-pay_1-c0-a9000\"",
                PortOneIdempotencyKeyHeader.toHeaderValue("mg-shop-refund-pay_1-c0-a9000"));
    }

    @Test
    @DisplayName("빈 키 — null, apply 는 헤더 생략")
    void blankKey_omitted() {
        assertNull(PortOneIdempotencyKeyHeader.toHeaderValue(null));
        assertNull(PortOneIdempotencyKeyHeader.toHeaderValue("  "));
        HttpHeaders headers = new HttpHeaders();
        PortOneIdempotencyKeyHeader.apply(headers, "");
        assertFalse(headers.containsKey(PortOneIdempotencyKeyHeader.HEADER_NAME));
    }

    @Test
    @DisplayName("반례 — 따옴표·역슬래시·공백·비ASCII·% 는 퍼센트 인코딩, 내부에 따옴표/역슬래시 없음")
    void unsafeChars_escaped() {
        String value = PortOneIdempotencyKeyHeader.toHeaderValue("a\"b\\c d%e한");
        assertEquals("\"a%22b%5Cc%20d%25e%ED%95%9C\"", value);
        String inner = value.substring(1, value.length() - 1);
        assertFalse(inner.contains("\""));
        assertFalse(inner.contains("\\"));
        assertTrue(inner.chars().allMatch(c -> c >= 0x20 && c <= 0x7E));
    }

    @Test
    @DisplayName("반례 — 치환 충돌 없음: 원본 % 와 인코딩 결과가 다른 키로 남는다")
    void escaping_isInjective() {
        assertNotEquals(PortOneIdempotencyKeyHeader.toHeaderValue("a\"b"),
                PortOneIdempotencyKeyHeader.toHeaderValue("a%22b"));
    }

    @Test
    @DisplayName("재시도 — 같은 원본 키는 항상 같은 헤더 값")
    void deterministic() {
        String key = "mg-shop-refund-imp_123-c1000-a500";
        assertEquals(PortOneIdempotencyKeyHeader.toHeaderValue(key),
                PortOneIdempotencyKeyHeader.toHeaderValue(key));
    }
}
