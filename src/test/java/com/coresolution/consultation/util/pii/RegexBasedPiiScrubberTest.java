package com.coresolution.consultation.util.pii;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.config.PiiScrubberProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

/**
 * 1단계 정규식 PII 스크러빙 검증.
 *
 * <p>본 합의서 {@code docs/standards/USER_LIFECYCLE_TERMINATION_POLICY.md} v1.2 §0.1 Q11 결재 결과 —
 * 7개 정규식 패턴(이메일/전화/주민/외국인/카드/계좌/URL) 의 정상 매칭과 false positive 회피를 검증한다.
 *
 * @author MindGarden
 * @since 2026-05-28
 */
@DisplayName("RegexBasedPiiScrubber — 7개 정규식 PII 패턴")
class RegexBasedPiiScrubberTest {

    private PiiScrubberProperties properties;
    private RegexBasedPiiScrubber scrubber;

    @BeforeEach
    void setUp() {
        properties = new PiiScrubberProperties();
        scrubber = new RegexBasedPiiScrubber(properties);
    }

    @Nested
    @DisplayName("EMAIL")
    class EmailPattern {

        @Test
        @DisplayName("일반 이메일 마스킹")
        void masksStandardEmail() {
            assertThat(scrubber.scrub("연락: user@example.com 입니다"))
                .isEqualTo("연락: [REDACTED_EMAIL] 입니다");
        }

        @Test
        @DisplayName("플러스/서브도메인 포함 이메일 마스킹")
        void masksComplexEmail() {
            assertThat(scrubber.scrub("user.name+tag@mail.example.co.kr"))
                .isEqualTo("[REDACTED_EMAIL]");
        }

        @Test
        @DisplayName("이메일이 없는 텍스트는 변경 없음")
        void preservesNonEmailText() {
            assertThat(scrubber.scrub("이메일 없음 텍스트")).isEqualTo("이메일 없음 텍스트");
        }
    }

    @Nested
    @DisplayName("PHONE")
    class PhonePattern {

        @Test
        @DisplayName("휴대전화(하이픈) 마스킹")
        void masksMobileWithHyphen() {
            assertThat(scrubber.scrub("연락처 010-1234-5678"))
                .isEqualTo("연락처 [REDACTED_PHONE]");
        }

        @Test
        @DisplayName("휴대전화(하이픈 없음) 마스킹")
        void masksMobileWithoutHyphen() {
            assertThat(scrubber.scrub("01012345678"))
                .isEqualTo("[REDACTED_PHONE]");
        }

        @Test
        @DisplayName("서울 일반전화 마스킹")
        void masksSeoulLandline() {
            assertThat(scrubber.scrub("02-1234-5678"))
                .isEqualTo("[REDACTED_PHONE]");
        }

        @Test
        @DisplayName("지방 일반전화 마스킹")
        void masksProvincialLandline() {
            assertThat(scrubber.scrub("031-234-5678"))
                .isEqualTo("[REDACTED_PHONE]");
        }
    }

    @Nested
    @DisplayName("RRN / ARN")
    class ResidentRegistrationNumberPattern {

        @Test
        @DisplayName("주민등록번호(하이픈) 마스킹")
        void masksRrnWithHyphen() {
            assertThat(scrubber.scrub("주민 900101-1234567 입력"))
                .isEqualTo("주민 [REDACTED_RRN] 입력");
        }

        @Test
        @DisplayName("주민등록번호(하이픈 없음) 마스킹")
        void masksRrnWithoutHyphen() {
            assertThat(scrubber.scrub("9001011234567"))
                .isEqualTo("[REDACTED_RRN]");
        }

        @Test
        @DisplayName("외국인등록번호 마스킹")
        void masksArn() {
            assertThat(scrubber.scrub("외국인 900101-5234567"))
                .isEqualTo("외국인 [REDACTED_ARN]");
        }

        @Test
        @DisplayName("날짜 형식(YYYY-MM-DD)은 RRN 으로 오탐하지 않음")
        void doesNotMatchIsoDate() {
            assertThat(scrubber.scrub("2024-01-01 회의록"))
                .doesNotContain("[REDACTED_RRN]");
        }
    }

    @Nested
    @DisplayName("CARD / BANK")
    class FinancialPattern {

        @Test
        @DisplayName("16자리 카드번호(하이픈) 마스킹")
        void masksCardWithHyphen() {
            assertThat(scrubber.scrub("카드 4111-1111-1111-1111 결제"))
                .isEqualTo("카드 [REDACTED_CARD] 결제");
        }

        @Test
        @DisplayName("16자리 카드번호(공백 구분) 마스킹")
        void masksCardWithSpaces() {
            assertThat(scrubber.scrub("4111 1111 1111 1111"))
                .isEqualTo("[REDACTED_CARD]");
        }

        @Test
        @DisplayName("계좌번호(3-2-6 형식) 마스킹")
        void masksBankAccount() {
            assertThat(scrubber.scrub("계좌: 110-12-345678"))
                .isEqualTo("계좌: [REDACTED_BANK]");
        }

        @Test
        @DisplayName("13자리 숫자열은 RRN 우선 매칭(카드로 오탐 회피)")
        void thirteenDigitsMatchRrnFirst() {
            // 주민번호 패턴(생년월일 형식)과 일치 → RRN 으로 매칭
            assertThat(scrubber.scrub("9001011234567"))
                .isEqualTo("[REDACTED_RRN]");
        }
    }

    @Nested
    @DisplayName("URL")
    class UrlPattern {

        @Test
        @DisplayName("http(s) URL 마스킹")
        void masksHttpsUrl() {
            assertThat(scrubber.scrub("출처 https://example.com/path?q=1 참조"))
                .isEqualTo("출처 [REDACTED_URL] 참조");
        }

        @Test
        @DisplayName("URL 없는 텍스트는 변경 없음")
        void preservesNonUrlText() {
            assertThat(scrubber.scrub("일반 텍스트")).isEqualTo("일반 텍스트");
        }
    }

    @Nested
    @DisplayName("혼합 텍스트")
    class MixedText {

        @Test
        @DisplayName("이메일 + 전화 + 카드 동시 마스킹")
        void masksAllInMixedText() {
            String input = "고객 user@example.com / 010-1234-5678 / 카드 4111-1111-1111-1111";
            String expected = "고객 [REDACTED_EMAIL] / [REDACTED_PHONE] / 카드 [REDACTED_CARD]";
            assertThat(scrubber.scrub(input)).isEqualTo(expected);
        }

        @Test
        @DisplayName("null 입력은 그대로 반환")
        void preservesNullInput() {
            assertThat(scrubber.scrub(null)).isNull();
        }

        @Test
        @DisplayName("빈 문자열은 그대로 반환")
        void preservesEmptyString() {
            assertThat(scrubber.scrub("")).isEmpty();
        }
    }

    @Nested
    @DisplayName("Strategy 인터페이스 호환성")
    class StrategyContract {

        @Test
        @DisplayName("getStrategyName() = 'regex'")
        void strategyNameIsRegex() {
            assertThat(scrubber.getStrategyName()).isEqualTo("regex");
        }

        @Test
        @DisplayName("default 활성 패턴은 7개 전부")
        void defaultEnabledPatternsAreAllSeven() {
            assertThat(scrubber.getActivePatterns()).containsExactlyInAnyOrder(PiiPatternType.values());
        }

        @Test
        @DisplayName("enabledPatterns='email,phone' 만 활성화하면 다른 패턴은 무시")
        void respectsPartialEnabledPatterns() {
            properties.setEnabledPatterns("email,phone");
            String input = "user@example.com 010-1234-5678 주민 900101-1234567";
            assertThat(scrubber.scrub(input))
                .contains("[REDACTED_EMAIL]")
                .contains("[REDACTED_PHONE]")
                .contains("900101-1234567")
                .doesNotContain("[REDACTED_RRN]");
        }

        @Test
        @DisplayName("enabledPatterns 비어 있으면 원본 그대로 반환")
        void emptyEnabledPatternsReturnsOriginal() {
            properties.setEnabledPatterns("");
            String input = "user@example.com 010-1234-5678";
            assertThat(scrubber.scrub(input)).isEqualTo(input);
        }

        @Test
        @DisplayName("알 수 없는 패턴 토큰은 무시 (부분 활성화 허용)")
        void ignoresUnknownPatternTokens() {
            properties.setEnabledPatterns("email,unknown_pattern,url");
            assertThat(scrubber.getActivePatterns())
                .containsExactlyInAnyOrder(PiiPatternType.EMAIL, PiiPatternType.URL);
        }
    }
}
