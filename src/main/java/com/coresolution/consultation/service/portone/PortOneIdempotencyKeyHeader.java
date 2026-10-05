package com.coresolution.consultation.service.portone;

import java.nio.charset.StandardCharsets;
import org.springframework.http.HttpHeaders;
import org.springframework.util.StringUtils;

/**
 * 포트원 V2 {@code Idempotency-Key} 헤더 공통 포맷.
 *
 * <p>포트원은 이 헤더를 RFC 8941 sf-string(큰따옴표로 감싼 문자열)으로 받는다.
 * 원본 키에 sf-string 에서 이스케이프가 필요한 문자(큰따옴표·역슬래시)나 비 ASCII·공백이 섞이면
 * 퍼센트 인코딩(UTF-8 바이트, {@code %} 자체 포함)으로 치환한다. 치환은 결정적·단사이므로
 * 같은 요청 재시도는 항상 같은 헤더 값을, 서로 다른 원본 키는 서로 다른 헤더 값을 만든다.</p>
 *
 * @author MindGarden
 * @since 2026-10-05
 */
public final class PortOneIdempotencyKeyHeader {

    /** 포트원 V2 요청 멱등 키 헤더 — 같은 키 재요청은 PortOne 이 한 번만 처리한다. */
    public static final String HEADER_NAME = "Idempotency-Key";

    private static final char SF_STRING_QUOTE = '"';
    private static final char PERCENT = '%';
    private static final String SAFE_PUNCTUATION = "-._~:";
    private static final char[] HEX_DIGITS = "0123456789ABCDEF".toCharArray();
    private static final int NIBBLE_SHIFT = 4;
    private static final int NIBBLE_MASK = 0x0F;
    private static final int BYTE_MASK = 0xFF;

    private PortOneIdempotencyKeyHeader() {
    }

    /**
     * 원본 키를 sf-string 헤더 값({@code "..."})으로 변환한다.
     *
     * @param rawKey 원본 멱등 키
     * @return 따옴표로 감싼 sf-string 값, 키가 비어 있으면 {@code null}
     */
    public static String toHeaderValue(String rawKey) {
        if (!StringUtils.hasText(rawKey)) {
            return null;
        }
        StringBuilder sb = new StringBuilder(rawKey.length() + 2);
        sb.append(SF_STRING_QUOTE);
        for (byte b : rawKey.getBytes(StandardCharsets.UTF_8)) {
            int c = b & BYTE_MASK;
            if (isSafe(c)) {
                sb.append((char) c);
            } else {
                sb.append(PERCENT)
                        .append(HEX_DIGITS[(c >> NIBBLE_SHIFT) & NIBBLE_MASK])
                        .append(HEX_DIGITS[c & NIBBLE_MASK]);
            }
        }
        sb.append(SF_STRING_QUOTE);
        return sb.toString();
    }

    /**
     * 키가 있으면 헤더에 sf-string 형식으로 싣는다. 비어 있으면 헤더를 생략한다.
     *
     * @param headers 요청 헤더
     * @param rawKey 원본 멱등 키
     */
    public static void apply(HttpHeaders headers, String rawKey) {
        String value = toHeaderValue(rawKey);
        if (value != null) {
            headers.set(HEADER_NAME, value);
        }
    }

    private static boolean isSafe(int c) {
        return (c >= '0' && c <= '9')
                || (c >= 'A' && c <= 'Z')
                || (c >= 'a' && c <= 'z')
                || SAFE_PUNCTUATION.indexOf(c) >= 0;
    }
}
