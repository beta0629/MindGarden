package com.coresolution.consultation.sct.unit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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
 * URL 길이만으로 축소 단계가 갈리며 host/profile 분기는 없다.
 *
 * @author MindGarden
 * @since 2026-11-27
 */
class SctSmsMessageBuilderTest {

    /** 짧은 절대 URL — spaced date로 ≤90B. */
    private static final String SHORT_URL = "https://mindgarden.core-solution.co.kr/s/k9P2mX";
    /** 긴 절대 URL(+4B) — compact date 필요. */
    private static final String LONG_URL = "https://mindgarden.dev.core-solution.co.kr/s/k9P2mX";

    @Test
    @DisplayName("성인 짧은 URL — spaced date ≤90B")
    void adultShortUrl_usesSpacedDate() {
        LocalDateTime expires = LocalDateTime.of(2026, 12, 9, 23, 59);
        String body = SctSmsMessageBuilder.buildShortSmsBody("ADULT", expires, SHORT_URL);
        assertNotNull(body);
        assertEquals(87, SctSmsMessageBuilder.eucKrByteLength(body));
        assertTrue(body.contains("12월 9일"));
        assertTrue(body.contains("성인 문장완성"));
    }

    @Test
    @DisplayName("성인 긴 URL — 날짜 공백 제거로 ≤90B")
    void adultLongUrl_compactsDate() {
        LocalDateTime expires = LocalDateTime.of(2026, 12, 9, 23, 59);
        String body = SctSmsMessageBuilder.buildShortSmsBody("ADULT", expires, LONG_URL);
        assertNotNull(body);
        assertEquals(90, SctSmsMessageBuilder.eucKrByteLength(body));
        assertTrue(body.contains("12월9일"));
    }

    @Test
    @DisplayName("청소년 긴 URL — 짧은 제목으로 ≤90B")
    void adolescentLongUrl_usesCompactTitle() {
        LocalDateTime expires = LocalDateTime.of(2026, 12, 9, 23, 59);
        String body = SctSmsMessageBuilder.buildShortSmsBody("ADOLESCENT", expires, LONG_URL);
        assertNotNull(body);
        assertTrue(SctSmsMessageBuilder.eucKrByteLength(body) <= SctConstants.SMS_EUC_KR_MAX_BYTES);
        assertTrue(body.contains(SctSmsMessageBuilder.shortTitleAdolescentCompact()));
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

    @Test
    @DisplayName("LMS 폴백 — officePhone 비어 있으면 문의 줄 없음")
    void lmsFallback_emptyOffice_omitsInquiryLine() {
        LocalDateTime expires = LocalDateTime.of(2026, 12, 9, 23, 59);
        String longUrl = "https://example.core-solution.co.kr/public/sct/token-xyz";
        String body = SctSmsMessageBuilder.buildLmsFallbackBody(
                "ADULT", expires, null, longUrl);
        assertFalse(body.contains("문의"));
        assertTrue(body.contains(longUrl));
        assertTrue(body.contains("성인용 문장완성"));

        String blankBody = SctSmsMessageBuilder.buildLmsFallbackBody(
                "ADULT", expires, "   ", longUrl);
        assertFalse(blankBody.contains("문의"));
    }

    @Test
    @DisplayName("LMS 폴백 — officePhone 있으면 문의 줄 포함")
    void lmsFallback_withOffice_includesInquiryLine() {
        LocalDateTime expires = LocalDateTime.of(2026, 12, 9, 23, 59);
        String longUrl = "https://example.core-solution.co.kr/public/sct/token-xyz";
        String body = SctSmsMessageBuilder.buildLmsFallbackBody(
                "ADULT", expires, "02-0000-1111", longUrl);
        assertTrue(body.contains("문의 02-0000-1111\n"));
        assertTrue(body.contains(longUrl));
    }

    @Test
    @DisplayName("단문 SMS 본문에는 사무실 번호 없음(변경 없음)")
    void shortSmsBody_unchanged_noOfficePhone() {
        LocalDateTime expires = LocalDateTime.of(2026, 12, 9, 23, 59);
        String body = SctSmsMessageBuilder.buildShortSmsBody("ADULT", expires, SHORT_URL);
        assertNotNull(body);
        assertFalse(body.contains("문의"));
        assertFalse(body.contains("02-0000-1111"));
        assertTrue(body.contains(SHORT_URL));
    }
}
