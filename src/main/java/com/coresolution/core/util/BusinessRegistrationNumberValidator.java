package com.coresolution.core.util;

import java.util.regex.Pattern;

/**
 * 사업자등록번호 형식·체크섬 검증 공통 유틸.
 * 국세청 진위확인 API는 별도 연동 패턴이 있을 때만 확장한다(본 클래스에서는 형식+체크섬 fail-closed).
 *
 * @author CoreSolution
 * @since 2026-09-09
 */
public final class BusinessRegistrationNumberValidator {

    private static final Pattern DISPLAY_PATTERN = Pattern.compile("^\\d{3}-\\d{2}-\\d{5}$");
    private static final int[] WEIGHTS = {1, 3, 7, 1, 3, 7, 1, 3, 5};
    public static final String INVALID_MESSAGE = "사업자등록번호 형식이 올바르지 않습니다. (예: 000-00-00000)";

    private BusinessRegistrationNumberValidator() {
    }

    /**
     * 숫자만 추출한 10자리 문자열로 정규화. 비어 있으면 빈 문자열.
     *
     * @param raw 원문
     * @return 숫자 10자리 또는 빈 문자열
     */
    public static String normalizeDigits(String raw) {
        if (raw == null || raw.isBlank()) {
            return "";
        }
        return raw.replaceAll("\\D", "");
    }

    /**
     * 표시용 하이픈 포맷(3-2-5). 유효하지 않으면 trim 원문 또는 빈 문자열.
     *
     * @param raw 원문
     * @return 포맷 문자열
     */
    public static String formatForDisplay(String raw) {
        String digits = normalizeDigits(raw);
        if (digits.length() != 10) {
            return raw == null ? "" : raw.trim();
        }
        return digits.substring(0, 3) + "-" + digits.substring(3, 5) + "-" + digits.substring(5);
    }

    /**
     * 비어 있지 않은 값에 대해 형식+체크섬 검증. 빈 값은 true(선택 필드 허용 경로용).
     *
     * @param raw 원문
     * @return 유효하면 true
     */
    public static boolean isValidOrEmpty(String raw) {
        String digits = normalizeDigits(raw);
        if (digits.isEmpty()) {
            return true;
        }
        return isValidDigits(digits);
    }

    /**
     * 필수 입력 경로: 비어 있거나 체크섬 실패면 false.
     *
     * @param raw 원문
     * @return 유효하면 true
     */
    public static boolean isValidRequired(String raw) {
        String digits = normalizeDigits(raw);
        if (digits.length() != 10) {
            return false;
        }
        return isValidDigits(digits);
    }

    /**
     * 표시 패턴(000-00-00000) 일치 여부.
     *
     * @param raw 원문
     * @return 일치하면 true
     */
    public static boolean matchesDisplayPattern(String raw) {
        return raw != null && DISPLAY_PATTERN.matcher(raw.trim()).matches();
    }

    private static boolean isValidDigits(String digits) {
        if (digits == null || digits.length() != 10) {
            return false;
        }
        for (int i = 0; i < 10; i++) {
            char c = digits.charAt(i);
            if (c < '0' || c > '9') {
                return false;
            }
        }
        int sum = 0;
        for (int i = 0; i < 9; i++) {
            int d = digits.charAt(i) - '0';
            sum += d * WEIGHTS[i];
        }
        // 9번째 자리(인덱스 8) 가중치 5의 십의 자리 보정
        int ninth = digits.charAt(8) - '0';
        sum += (ninth * 5) / 10;
        int check = (10 - (sum % 10)) % 10;
        return check == (digits.charAt(9) - '0');
    }
}
