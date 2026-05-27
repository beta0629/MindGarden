package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link PiiScrubber} Q11 정규식 스크러빙 회귀.
 *
 * <p>USER_LIFECYCLE_TERMINATION_POLICY §3.4 / §3.5 — 자유 입력 본문에 섞일 가능성이 있는
 * 4종 PII 패턴(전화/주민/이메일/카드)이 surrogate token 으로 안전 치환되는지 검증.</p>
 *
 * @author CoreSolution
 * @since 2026-06-05
 */
@DisplayName("PiiScrubber 정규식 회귀 — Phase 2-α Q11")
class PiiScrubberTest {

    private static final String TOKEN = PiiScrubber.SCRUBBED_TOKEN;

    // ---------- 전화번호 ----------

    @Test
    @DisplayName("scrubPhone: 휴대폰 010-1234-5678 패턴 치환")
    void scrubPhone_mobile_dash() {
        assertThat(PiiScrubber.scrubPhone("연락처 010-1234-5678 입니다."))
                .contains(TOKEN)
                .doesNotContain("010-1234-5678");
    }

    @Test
    @DisplayName("scrubPhone: 일반 전화 02-123-4567 패턴 치환")
    void scrubPhone_landline() {
        assertThat(PiiScrubber.scrubPhone("사무실 02-123-4567 로 연락주세요."))
                .contains(TOKEN)
                .doesNotContain("02-123-4567");
    }

    @Test
    @DisplayName("scrubPhone: 다중 패턴 모두 치환")
    void scrubPhone_multiple_replaced() {
        String input = "010-1111-2222 그리고 010-3333-4444";
        String out = PiiScrubber.scrubPhone(input);
        assertThat(out)
                .doesNotContain("010-1111-2222")
                .doesNotContain("010-3333-4444");
        assertThat(countMatches(out, TOKEN)).isGreaterThanOrEqualTo(2);
    }

    @Test
    @DisplayName("scrubPhone: null/빈 문자열은 그대로 반환")
    void scrubPhone_nullOrEmpty() {
        assertThat(PiiScrubber.scrubPhone(null)).isNull();
        assertThat(PiiScrubber.scrubPhone("")).isEqualTo("");
    }

    // ---------- 주민번호 ----------

    @Test
    @DisplayName("scrubRrn: 주민번호 901010-1234567 패턴 치환")
    void scrubRrn_with_dash() {
        assertThat(PiiScrubber.scrubRrn("등록번호 901010-1234567 입니다."))
                .contains(TOKEN)
                .doesNotContain("901010-1234567");
    }

    @Test
    @DisplayName("scrubRrn: 하이픈 없는 13자리 주민번호 패턴 치환")
    void scrubRrn_no_dash() {
        assertThat(PiiScrubber.scrubRrn("등록번호 9010101234567 입니다."))
                .contains(TOKEN)
                .doesNotContain("9010101234567");
    }

    @Test
    @DisplayName("scrubRrn: null/빈 문자열은 그대로 반환")
    void scrubRrn_nullOrEmpty() {
        assertThat(PiiScrubber.scrubRrn(null)).isNull();
        assertThat(PiiScrubber.scrubRrn("")).isEqualTo("");
    }

    // ---------- 이메일 ----------

    @Test
    @DisplayName("scrubEmail: 일반 이메일 user@example.com 치환")
    void scrubEmail_simple() {
        assertThat(PiiScrubber.scrubEmail("연락 user@example.com 으로"))
                .contains(TOKEN)
                .doesNotContain("user@example.com");
    }

    @Test
    @DisplayName("scrubEmail: 다양한 도메인 (.co.kr, .org) 모두 치환")
    void scrubEmail_various_tld() {
        String input = "first@a.co.kr 또는 second@b.org";
        String out = PiiScrubber.scrubEmail(input);
        assertThat(out).doesNotContain("first@a.co.kr")
                .doesNotContain("second@b.org");
        assertThat(countMatches(out, TOKEN)).isGreaterThanOrEqualTo(2);
    }

    // ---------- 카드번호 ----------

    @Test
    @DisplayName("scrubCard: 16자리 카드번호 1234-5678-9012-3456 치환")
    void scrubCard_dashed() {
        assertThat(PiiScrubber.scrubCard("카드 1234-5678-9012-3456 결제"))
                .contains(TOKEN)
                .doesNotContain("1234-5678-9012-3456");
    }

    @Test
    @DisplayName("scrubCard: 하이픈 없는 16자리 카드번호도 치환")
    void scrubCard_no_dash() {
        assertThat(PiiScrubber.scrubCard("카드 1234567890123456 결제"))
                .contains(TOKEN)
                .doesNotContain("1234567890123456");
    }

    // ---------- 외국인등록번호 (Phase 5 v1.2 확장) ----------

    @Test
    @DisplayName("scrubArn: 외국인등록번호 901010-5234567 패턴 치환")
    void scrubArn_with_dash() {
        assertThat(PiiScrubber.scrubArn("외국인 901010-5234567 입니다."))
                .contains(TOKEN)
                .doesNotContain("901010-5234567");
    }

    @Test
    @DisplayName("scrubArn: null/빈 문자열은 그대로 반환")
    void scrubArn_nullOrEmpty() {
        assertThat(PiiScrubber.scrubArn(null)).isNull();
        assertThat(PiiScrubber.scrubArn("")).isEqualTo("");
    }

    // ---------- 계좌번호 (Phase 5 v1.2 확장) ----------

    @Test
    @DisplayName("scrubBank: 일반 계좌번호 110-12-345678 패턴 치환")
    void scrubBank_typical() {
        assertThat(PiiScrubber.scrubBank("계좌 110-12-345678 입금"))
                .contains(TOKEN)
                .doesNotContain("110-12-345678");
    }

    @Test
    @DisplayName("scrubBank: null/빈 문자열은 그대로 반환")
    void scrubBank_nullOrEmpty() {
        assertThat(PiiScrubber.scrubBank(null)).isNull();
        assertThat(PiiScrubber.scrubBank("")).isEqualTo("");
    }

    // ---------- URL (Phase 5 v1.2 확장) ----------

    @Test
    @DisplayName("scrubUrl: https URL 패턴 치환")
    void scrubUrl_https() {
        assertThat(PiiScrubber.scrubUrl("참조 https://example.com/path?q=1 확인"))
                .contains(TOKEN)
                .doesNotContain("https://example.com");
    }

    @Test
    @DisplayName("scrubUrl: null/빈 문자열은 그대로 반환")
    void scrubUrl_nullOrEmpty() {
        assertThat(PiiScrubber.scrubUrl(null)).isNull();
        assertThat(PiiScrubber.scrubUrl("")).isEqualTo("");
    }

    // ---------- scrubAll ----------

    @Test
    @DisplayName("scrubAll: 4종 패턴(legacy) 모두 한 번에 치환")
    void scrubAll_combined() {
        String input = "연락처 010-1111-2222 / 등록 901010-1234567 / 메일 user@example.com / 카드 1234-5678-9012-3456";
        String out = PiiScrubber.scrubAll(input);
        assertThat(out)
                .doesNotContain("010-1111-2222")
                .doesNotContain("901010-1234567")
                .doesNotContain("user@example.com")
                .doesNotContain("1234-5678-9012-3456");
        assertThat(countMatches(out, TOKEN)).isGreaterThanOrEqualTo(4);
    }

    @Test
    @DisplayName("scrubAll: 7종 패턴(Phase 5 v1.2 확장) 모두 한 번에 치환")
    void scrubAll_all_seven_patterns() {
        String input = "전화 010-1111-2222 / 주민 901010-1234567 / 외국인 901010-5234567 "
                + "/ 이메일 user@example.com / URL https://example.com/x / 카드 1234-5678-9012-3456 "
                + "/ 계좌 110-12-345678";
        String out = PiiScrubber.scrubAll(input);
        assertThat(out)
                .doesNotContain("010-1111-2222")
                .doesNotContain("901010-1234567")
                .doesNotContain("901010-5234567")
                .doesNotContain("user@example.com")
                .doesNotContain("https://example.com")
                .doesNotContain("1234-5678-9012-3456")
                .doesNotContain("110-12-345678");
        assertThat(countMatches(out, TOKEN)).isGreaterThanOrEqualTo(7);
    }

    @Test
    @DisplayName("scrubAll: PII 가 없는 평문은 변경되지 않는다")
    void scrubAll_no_pii() {
        String input = "내담자가 일상 스트레스를 호소하고 있다.";
        assertThat(PiiScrubber.scrubAll(input)).isEqualTo(input);
    }

    @Test
    @DisplayName("scrubAll: null/빈 입력은 그대로 반환")
    void scrubAll_nullOrEmpty() {
        assertThat(PiiScrubber.scrubAll(null)).isNull();
        assertThat(PiiScrubber.scrubAll("")).isEqualTo("");
    }

    private static int countMatches(String text, String needle) {
        int count = 0;
        int idx = 0;
        while ((idx = text.indexOf(needle, idx)) != -1) {
            count++;
            idx += needle.length();
        }
        return count;
    }
}
