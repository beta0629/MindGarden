package com.coresolution.consultation.util;

/**
 * 로그 출력용 전화번호 마스킹(서비스별 private {@code maskPhone} / {@code maskPhoneNumber}와 동일 규칙).
 * {@link com.coresolution.core.service.SensitiveDataMaskingService}와는 별도(숫자 추출·설정 기반 규칙 아님).
 *
 * @author CoreSolution
 * @since 2026-04-23
 */
public final class PhoneLogMasking {

    private PhoneLogMasking() {
    }

    /**
     * 로그용 전화번호 마스킹.
     *
     * @param phone 원본(암호화 전·후 문자열 등)
     * @return {@code null} 또는 길이 4 미만은 그대로, 길이 8 이하는 앞 3자리+{@code ****}, 그 외는 앞 3+마스크+끝 4자리
     */
    public static String maskForLog(String phone) {
        if (phone == null || phone.length() < 4) {
            return phone;
        }

        if (phone.length() <= 8) {
            return phone.substring(0, 3) + "****";
        }

        return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
    }
}
