package com.coresolution.consultation.sct.unit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDateTime;
import com.coresolution.consultation.sct.constant.SctConstants;
import com.coresolution.consultation.sct.util.SctSmsMessageBuilder;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * SCT SMS 본문·EUC-KR 바이트·한국어 날짜.
 *
 * @author MindGarden
 * @since 2026-11-27
 */
class SctSmsMessageBuilderTest {

    private static final String PROD = "https://mindgarden.core-solution.co.kr/s/k9P2mX";
    private static final String DEV = "https://mindgarden.dev.core-solution.co.kr/s/k9P2mX";

    @Test
    @DisplayName("성인 PROD 단문 ≤90B")
    void adultProd_underOrEqual90() {
        LocalDateTime expires = LocalDateTime.of(2026, 12, 9, 23, 59);
        String body = SctSmsMessageBuilder.buildShortSmsBody("ADULT", expires, PROD);
        assertNotNull(body);
        assertEquals(87, SctSmsMessageBuilder.eucKrByteLength(body));
        assertTrue(body.contains("12월 9일"));
        assertTrue(body.contains("성인 문장완성"));
    }

    @Test
    @DisplayName("성인 DEV — 날짜 공백 제거로 ≤90B")
    void adultDev_compactsDate() {
        LocalDateTime expires = LocalDateTime.of(2026, 12, 9, 23, 59);
        String body = SctSmsMessageBuilder.buildShortSmsBody("ADULT", expires, DEV);
        assertNotNull(body);
        assertEquals(90, SctSmsMessageBuilder.eucKrByteLength(body));
        assertTrue(body.contains("12월9일"));
    }

    @Test
    @DisplayName("한국어 월·일 포맷")
    void koreanMonthDayFormats() {
        LocalDateTime expires = LocalDateTime.of(2026, 12, 9, 23, 59);
        assertEquals("12월 9일", SctSmsMessageBuilder.formatKoreanMonthDaySpaced(expires));
        assertEquals("12월9일", SctSmsMessageBuilder.formatKoreanMonthDayCompact(expires));
    }

    @Test
    @DisplayName("과도한 URL이면 null(발송 차단)")
    void oversizedUrl_returnsNull() {
        String huge = "https://mindgarden.dev.core-solution.co.kr/s/"
                + "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
        String body = SctSmsMessageBuilder.buildShortSmsBody(
                "ADOLESCENT", LocalDateTime.of(2026, 12, 23, 23, 59), huge);
        assertNull(body);
        assertTrue(SctSmsMessageBuilder.eucKrByteLength(
                "[마인드가든] 청소년 문장완성 12월 23일까지\n" + huge)
                > SctConstants.SMS_EUC_KR_MAX_BYTES);
    }
}
