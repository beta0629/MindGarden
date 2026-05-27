package com.coresolution.consultation.util;

import java.util.regex.Pattern;

/**
 * 자유 입력 텍스트의 PII 정규식 스크러빙 유틸 — Q11 결정 (정규식 우선 → AI 단계적 도입).
 *
 * <p>USER_LIFECYCLE_TERMINATION_POLICY §3.4 / §3.5 — {@code consultation_records.content},
 * {@code financial_transactions.description} 등 자유 입력 본문에 섞여 있을 가능성이 있는
 * 4종 PII 패턴을 단일 surrogate 토큰으로 치환한다.</p>
 *
 * <p>처리 대상:</p>
 * <ul>
 *   <li>전화번호 — 휴대폰 / 일반 전화 (010-1234-5678, 02-123-4567 등)</li>
 *   <li>주민번호 — 13자리 (901010-1234567)</li>
 *   <li>이메일 — RFC 5321 호환 단순 패턴</li>
 *   <li>카드번호 — 13~19 자리 + 하이픈 / 공백 허용</li>
 * </ul>
 *
 * <p>본 유틸은 stateless · thread-safe — Pattern 인스턴스는 정적 상수.</p>
 *
 * <p>AI 도입은 Phase 5 (§11.1 Phase 5) — 본 유틸은 정규식 단계 SSOT.</p>
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

    // 주민번호 (13자리, YYMMDD-XXXXXXX)
    private static final Pattern RRN_PATTERN = Pattern.compile(
            "\\d{6}[-]?[1-4]\\d{6}");

    // 이메일 (RFC 5321 단순화)
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");

    // 카드번호 — 13~19 자리 + 하이픈/공백 허용 (1234-5678-9012-3456, 1234567890123456 등)
    // 주민번호(13자리)와 충돌 방지 위해 RRN 을 먼저 처리한 뒤 적용
    private static final Pattern CARD_PATTERN = Pattern.compile(
            "(?:\\d[ -]?){13,19}");

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
     * 4종 PII 패턴 (전화/주민/이메일/카드) 을 모두 SCRUBBED_TOKEN 으로 치환.
     *
     * <p>처리 순서: 주민번호 → 이메일 → 전화번호 → 카드번호. 주민번호(13자리 + 하이픈)는
     * 카드번호 패턴(13~19자리)과 충돌하므로 항상 먼저 처리한다.</p>
     *
     * @param text 입력 (null/빈 문자열 → 그대로 반환)
     * @return 4종 패턴이 모두 치환된 문자열
     */
    public static String scrubAll(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }
        String result = RRN_PATTERN.matcher(text).replaceAll(SCRUBBED_TOKEN);
        result = EMAIL_PATTERN.matcher(result).replaceAll(SCRUBBED_TOKEN);
        result = PHONE_PATTERN.matcher(result).replaceAll(SCRUBBED_TOKEN);
        result = CARD_PATTERN.matcher(result).replaceAll(SCRUBBED_TOKEN);
        return result;
    }
}
