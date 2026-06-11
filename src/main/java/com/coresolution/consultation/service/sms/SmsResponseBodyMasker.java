package com.coresolution.consultation.service.sms;

import java.util.regex.Matcher;
import java.util.regex.Pattern;
import com.coresolution.consultation.util.PhoneLogMasking;

/**
 * SMS 게이트웨이(Solapi/NHN Cloud 등) 응답 본문을 로그·감사 컬럼 안전 형태로 마스킹.
 *
 * <p>적용 규칙(체인 순서):
 * <ul>
 *   <li>{@code null}/공백 → 빈 문자열</li>
 *   <li>한국 휴대전화({@code 01[016-9]xxxxxxx}) → {@link PhoneLogMasking#maskForLog(String)}</li>
 *   <li>이메일 → 앞 1자 + {@code ***@도메인}</li>
 *   <li>20자 이상 영숫자(시크릿/토큰 후보) → 앞 4자 + {@code ****}</li>
 *   <li>6자리 숫자 {@code \b\d{6}\b}(OTP 후보) → {@code ******}</li>
 *   <li>최종 길이 {@value #DEFAULT_LIMIT}자 초과 시 절단 + {@code …(truncated)}</li>
 * </ul>
 *
 * <p>표준화 v2 B4 (PR #227 후속): Solapi·NHN 두 프로바이더가 동일 규칙을 공유하기 위해 추출.
 *
 * @author CoreSolution
 * @since 2026-06-12
 */
public final class SmsResponseBodyMasker {

    /** 응답 본문 로깅·전파 시 마스킹 후 절단할 최대 길이(헤더·CR/LF 포함). */
    public static final int DEFAULT_LIMIT = 500;

    private static final Pattern KOREAN_PHONE_PATTERN = Pattern.compile("01[016-9]\\d{7,8}");
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");
    private static final Pattern SECRET_LIKE_PATTERN = Pattern.compile("[A-Za-z0-9]{20,}");
    /**
     * 6자리 숫자(예: OTP) 패턴.
     *
     * <p>{@code \b} 단어 경계 대신 lookbehind/lookahead 로 숫자 인접 여부를 검사한다.
     * 한글 등 비ASCII 문자가 인접해도 안전하게 6자리만 매칭 (7자리 이상은 매칭 제외).
     */
    private static final Pattern OTP_LIKE_PATTERN = Pattern.compile("(?<!\\d)\\d{6}(?!\\d)");

    private SmsResponseBodyMasker() {
    }

    /**
     * 응답 본문을 기본 한도({@value #DEFAULT_LIMIT}) 로 마스킹.
     *
     * @param raw 원본 본문(JSON 문자열 등)
     * @return 마스킹·절단된 안전 문자열
     */
    public static String mask(String raw) {
        return mask(raw, DEFAULT_LIMIT);
    }

    /**
     * 응답 본문을 지정된 한도로 마스킹.
     *
     * @param raw   원본 본문(JSON 문자열 등)
     * @param limit 최대 길이(이상은 {@code …(truncated)} 로 절단)
     * @return 마스킹·절단된 안전 문자열
     */
    public static String mask(String raw, int limit) {
        if (raw == null || raw.isBlank()) {
            return "";
        }
        String compact = raw.replaceAll("\\s+", " ").trim();

        Matcher phoneMatcher = KOREAN_PHONE_PATTERN.matcher(compact);
        StringBuilder phoneBuf = new StringBuilder();
        while (phoneMatcher.find()) {
            phoneMatcher.appendReplacement(phoneBuf,
                Matcher.quoteReplacement(PhoneLogMasking.maskForLog(phoneMatcher.group())));
        }
        phoneMatcher.appendTail(phoneBuf);

        Matcher emailMatcher = EMAIL_PATTERN.matcher(phoneBuf.toString());
        StringBuilder emailBuf = new StringBuilder();
        while (emailMatcher.find()) {
            String email = emailMatcher.group();
            int atIdx = email.indexOf('@');
            String masked = (atIdx > 0
                ? email.charAt(0) + "***" + email.substring(atIdx)
                : "***");
            emailMatcher.appendReplacement(emailBuf, Matcher.quoteReplacement(masked));
        }
        emailMatcher.appendTail(emailBuf);

        Matcher secretMatcher = SECRET_LIKE_PATTERN.matcher(emailBuf.toString());
        StringBuilder secretBuf = new StringBuilder();
        while (secretMatcher.find()) {
            String token = secretMatcher.group();
            String masked = token.length() <= 4 ? "****" : token.substring(0, 4) + "****";
            secretMatcher.appendReplacement(secretBuf, Matcher.quoteReplacement(masked));
        }
        secretMatcher.appendTail(secretBuf);

        // B4 hotfix: OTP 6자리 평문이 응답 echo 로 노출되는 경우 마스킹.
        Matcher otpMatcher = OTP_LIKE_PATTERN.matcher(secretBuf.toString());
        StringBuilder otpBuf = new StringBuilder();
        while (otpMatcher.find()) {
            otpMatcher.appendReplacement(otpBuf, Matcher.quoteReplacement("******"));
        }
        otpMatcher.appendTail(otpBuf);

        return truncate(otpBuf.toString(), limit);
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return "";
        }
        if (value.length() <= max) {
            return value;
        }
        return value.substring(0, max) + "…(truncated)";
    }
}
