package com.coresolution.consultation.util;

import com.coresolution.consultation.constant.ClientRegistrationConstants;

/**
 * 표준 로그인 식별자(이메일 또는 휴대폰) 정규화·판별 유틸.
 *
 * @author CoreSolution
 * @since 2026-04-04
 */
public final class LoginIdentifierUtils {

    private LoginIdentifierUtils() {
    }

    /**
     * 이메일 형태로 보이는지(내부에 {@code @} 포함) 여부.
     *
     * @param s 정규화 전·후 문자열
     * @return {@code @} 포함 시 true
     */
    public static boolean looksLikeEmail(String s) {
        return s != null && s.contains("@");
    }

    /**
     * 비숫자 제거 후 한국 휴대폰 번호 관용 정규화.
     * {@code +82} 접두는 선행 {@code 0}으로 치환, 10자리이며 {@code 10}으로 시작하면 선행 {@code 0} 부여.
     * <p>
     * 예: {@code 010-1234-5678} → 비숫자 제거 후 {@code 01012345678} (검증·저장은 이 숫자열만 사용).
     *
     * @param raw 입력
     * @return 숫자만 포함한 문자열
     */
    public static String normalizeKoreanMobileDigits(String raw) {
        if (raw == null) {
            return "";
        }
        String digits = raw.replaceAll("\\D", "");
        if (digits.startsWith("82") && digits.length() >= 10) {
            digits = "0" + digits.substring(2);
        }
        if (digits.length() == 10 && digits.startsWith("10")) {
            digits = "0" + digits;
        }
        return digits;
    }

    /**
     * 로그인 API용 식별자 정규화. 이메일은 trim·소문자, 그 외는 휴대폰 숫자 정규화.
     *
     * @param raw 사용자 입력(trim 전 가능)
     * @return 정규화된 principal 문자열
     */
    public static String normalizeForPasswordLogin(String raw) {
        if (raw == null) {
            return "";
        }
        String t = raw.trim();
        if (t.contains("@")) {
            return t.toLowerCase();
        }
        return normalizeKoreanMobileDigits(t);
    }

    /**
     * 한국 휴대폰 번호로 로그인 시도 가능한지(정규화된 숫자열 기준). 유선·지역번호 등은 제외.
     * <ul>
     *   <li>{@code 010} + 구독자 8자리 → {@code ^010\\d{8}$}</li>
     *   <li>{@code 011}, {@code 016}, {@code 017}, {@code 018}, {@code 019} + 구독자 7~8자리
     *       → {@code ^01[16789]\\d{7,8}$}</li>
     * </ul>
     * 합성: {@code ^01(0\\d{8}|[16789]\\d{7,8})$}
     * <p>
     * 예: {@code 010-1234-5678} 정규화 후 {@code 01012345678} → 허용.
     *
     * @param digits {@link #normalizeKoreanMobileDigits(String)} 결과
     * @return 휴대폰 번호 패턴이면 true
     */
    public static boolean isValidKoreanMobileDigits(String digits) {
        if (digits == null || digits.isEmpty()) {
            return false;
        }
        return digits.matches("^01(0\\d{8}|[16789]\\d{7,8})$");
    }

    /**
     * 로그인 식별자 정규화 및 형식 검증. 부적합 시 {@link IllegalArgumentException}.
     *
     * @param raw 원본 입력
     * @return 정규화된 principal
     * @throws IllegalArgumentException 빈 값 또는 이메일·휴대폰 모두 아닌 경우
     */
    public static String normalizeAndValidateLoginIdentifier(String raw) {
        if (raw == null || raw.trim().isEmpty()) {
            throw new IllegalArgumentException("이메일 또는 휴대폰 번호를 입력해주세요.");
        }
        String p = normalizeForPasswordLogin(raw.trim());
        if (looksLikeEmail(p)) {
            return p;
        }
        if (!isValidKoreanMobileDigits(p)) {
            throw new IllegalArgumentException("올바른 이메일 또는 휴대폰 번호를 입력해주세요.");
        }
        return p;
    }

    /**
     * SMS 발송·검증 등 휴대폰 전용 API의 공통 전처리. 정규화된 숫자열만 반환.
     *
     * @param raw 원본 입력
     * @return {@link #normalizeKoreanMobileDigits(String)} 후 {@link #isValidKoreanMobileDigits(String)} 통과 값
     * @throws IllegalArgumentException 빈 값 또는 휴대폰 형식 아님
     */
    public static String normalizeAndValidateKoreanMobileForSms(String raw) {
        if (raw == null || raw.trim().isEmpty()) {
            throw new IllegalArgumentException("전화번호를 입력해주세요.");
        }
        String normalized = normalizeKoreanMobileDigits(raw);
        if (!isValidKoreanMobileDigits(normalized)) {
            throw new IllegalArgumentException(ClientRegistrationConstants.MSG_INVALID_PHONE);
        }
        return normalized;
    }
}
