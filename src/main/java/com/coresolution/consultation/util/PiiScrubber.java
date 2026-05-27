package com.coresolution.consultation.util;

import java.util.regex.Pattern;

/**
 * 자유 입력 텍스트의 PII 정규식 스크러빙 유틸 — Q11 결정 (정규식 우선 → AI 단계적 도입).
 *
 * <p>USER_LIFECYCLE_TERMINATION_POLICY §3.4 / §3.5 — {@code consultation_records.content},
 * {@code financial_transactions.description} 등 자유 입력 본문에 섞여 있을 가능성이 있는
 * PII 패턴을 단일 surrogate 토큰으로 치환한다.</p>
 *
 * <p>처리 대상 (Phase 5 v1.2 — 7종 패턴 확장):</p>
 * <ul>
 *   <li>전화번호 — 휴대폰 / 일반 전화 (010-1234-5678, 02-123-4567 등)</li>
 *   <li>주민번호 — 13자리 (901010-1234567)</li>
 *   <li>외국인등록번호 — 13자리 (성별식별자 5~8, Phase 5 확장)</li>
 *   <li>이메일 — RFC 5321 호환 단순 패턴</li>
 *   <li>카드번호 — 13~19 자리 + 하이픈 / 공백 허용</li>
 *   <li>계좌번호 — 일반 패턴 (3-2-6 등, Phase 5 확장)</li>
 *   <li>URL — http(s) (Phase 5 확장)</li>
 * </ul>
 *
 * <p>본 유틸은 stateless · thread-safe — Pattern 인스턴스는 정적 상수.</p>
 *
 * <p>본 정적 유틸은 backward-compat 단일 토큰({@link #SCRUBBED_TOKEN}) 인터페이스이며,
 * 신규 Spring 컴포넌트는 {@link com.coresolution.consultation.util.pii.PiiScrubberStrategy}
 * /
 * {@link com.coresolution.consultation.util.pii.RegexBasedPiiScrubber} (per-type 라벨) 사용.
 * Phase 5.1 BERT 도입 시 Strategy 인터페이스에 신규 구현체만 추가하면 된다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-05
 */
public final class PiiScrubber {

    /** 모든 PII 패턴이 치환될 surrogate 토큰. */
    public static final String SCRUBBED_TOKEN = "[PII-REDACTED]";

    // 휴대폰 / 일반 전화 — 한국 + 국제 + 다양한 구분자 허용
    // 010-1234-5678, 02-123-4567, +82-10-1234-5678, 010 1234 5678, 01012345678 등
    private static final Pattern PHONE_PATTERN = Pattern.compile(
            "(?:(?:\\+?\\d{1,3})[-. ]?)?(?:0\\d{1,2})[-. ]?\\d{3,4}[-. ]?\\d{4}");

    // 주민번호 (13자리, YYMMDD-XXXXXXX) — 성별식별자 1~4(내국인)
    private static final Pattern RRN_PATTERN = Pattern.compile(
            "\\d{6}[-]?[1-4]\\d{6}");

    // 외국인등록번호 (13자리, 성별식별자 5~8) — Phase 5 v1.2 확장
    private static final Pattern ARN_PATTERN = Pattern.compile(
            "\\d{6}[-]?[5-8]\\d{6}");

    // 이메일 (RFC 5321 단순화)
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");

    // 카드번호 — 13~19 자리 + 하이픈/공백 허용 (1234-5678-9012-3456, 1234567890123456 등)
    // 주민번호(13자리)와 충돌 방지 위해 RRN 을 먼저 처리한 뒤 적용
    private static final Pattern CARD_PATTERN = Pattern.compile(
            "(?:\\d[ -]?){13,19}");

    // 계좌번호 (일반 — 3-2-6 등 9~20자리, 하이픈 필수) — Phase 5 v1.2 확장
    // 카드(13~19자리 연속)와 충돌 회피 위해 하이픈 구분만 인식.
    private static final Pattern BANK_PATTERN = Pattern.compile(
            "\\b\\d{3,6}-\\d{2,6}-\\d{4,8}\\b");

    // URL (http/https) — Phase 5 v1.2 확장
    private static final Pattern URL_PATTERN = Pattern.compile(
            "https?://[^\\s\\u3000\"'<>]+");

    private PiiScrubber() {
        // 유틸 클래스 — 인스턴스화 금지
    }

    /**
     * 전화번호 패턴을 SCRUBBED_TOKEN 으로 치환.
     *
     * @param text 입력 (null/빈 문자열 → 그대로 반환)
     * @return 치환된 문자열
     */
    public static String scrubPhone(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }
        return PHONE_PATTERN.matcher(text).replaceAll(SCRUBBED_TOKEN);
    }

    /**
     * 주민번호 패턴을 SCRUBBED_TOKEN 으로 치환.
     *
     * @param text 입력 (null/빈 문자열 → 그대로 반환)
     * @return 치환된 문자열
     */
    public static String scrubRrn(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }
        return RRN_PATTERN.matcher(text).replaceAll(SCRUBBED_TOKEN);
    }

    /**
     * 이메일 패턴을 SCRUBBED_TOKEN 으로 치환.
     *
     * @param text 입력 (null/빈 문자열 → 그대로 반환)
     * @return 치환된 문자열
     */
    public static String scrubEmail(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }
        return EMAIL_PATTERN.matcher(text).replaceAll(SCRUBBED_TOKEN);
    }

    /**
     * 카드번호 패턴을 SCRUBBED_TOKEN 으로 치환.
     *
     * @param text 입력 (null/빈 문자열 → 그대로 반환)
     * @return 치환된 문자열
     */
    public static String scrubCard(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }
        return CARD_PATTERN.matcher(text).replaceAll(SCRUBBED_TOKEN);
    }

    /**
     * 외국인등록번호 패턴을 SCRUBBED_TOKEN 으로 치환. Phase 5 v1.2 확장.
     *
     * @param text 입력 (null/빈 문자열 → 그대로 반환)
     * @return 치환된 문자열
     */
    public static String scrubArn(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }
        return ARN_PATTERN.matcher(text).replaceAll(SCRUBBED_TOKEN);
    }

    /**
     * 계좌번호 패턴을 SCRUBBED_TOKEN 으로 치환. Phase 5 v1.2 확장.
     *
     * @param text 입력 (null/빈 문자열 → 그대로 반환)
     * @return 치환된 문자열
     */
    public static String scrubBank(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }
        return BANK_PATTERN.matcher(text).replaceAll(SCRUBBED_TOKEN);
    }

    /**
     * URL 패턴을 SCRUBBED_TOKEN 으로 치환. Phase 5 v1.2 확장.
     *
     * @param text 입력 (null/빈 문자열 → 그대로 반환)
     * @return 치환된 문자열
     */
    public static String scrubUrl(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }
        return URL_PATTERN.matcher(text).replaceAll(SCRUBBED_TOKEN);
    }

    /**
     * 7종 PII 패턴 (주민/외국인/이메일/URL/전화/카드/계좌) 을 모두 SCRUBBED_TOKEN 으로 치환.
     *
     * <p>처리 순서: 주민(RRN) → 외국인(ARN) → 이메일 → URL → 전화번호 → 카드번호 → 계좌번호.
     * 주민·외국인(13자리)과 카드(13~19자리)는 패턴이 겹치므로 RRN/ARN 을 먼저 처리한다.
     * Phase 5 v1.2 — 4종 → 7종으로 확장.</p>
     *
     * @param text 입력 (null/빈 문자열 → 그대로 반환)
     * @return 7종 패턴이 모두 치환된 문자열
     */
    public static String scrubAll(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }
        String result = RRN_PATTERN.matcher(text).replaceAll(SCRUBBED_TOKEN);
        result = ARN_PATTERN.matcher(result).replaceAll(SCRUBBED_TOKEN);
        result = EMAIL_PATTERN.matcher(result).replaceAll(SCRUBBED_TOKEN);
        result = URL_PATTERN.matcher(result).replaceAll(SCRUBBED_TOKEN);
        result = PHONE_PATTERN.matcher(result).replaceAll(SCRUBBED_TOKEN);
        result = CARD_PATTERN.matcher(result).replaceAll(SCRUBBED_TOKEN);
        result = BANK_PATTERN.matcher(result).replaceAll(SCRUBBED_TOKEN);
        return result;
    }
}
