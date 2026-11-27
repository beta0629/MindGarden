package com.coresolution.consultation.sct.util;

import java.security.SecureRandom;
import com.coresolution.consultation.sct.constant.SctConstants;

/**
 * SCT 단축 코드 생성 — SecureRandom + 혼동 문자 제외 문자셋.
 *
 * @author MindGarden
 * @since 2026-11-27
 */
public final class SctShortCodeGenerator {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private SctShortCodeGenerator() {
    }

    /**
     * {@link SctConstants#SHORT_CODE_LENGTH} 길이 단축 코드 생성.
     *
     * @return 단축 코드
     */
    public static String generate() {
        return generate(SctConstants.SHORT_CODE_LENGTH);
    }

    /**
     * 지정 길이 단축 코드 생성.
     *
     * @param length 길이(1 이상)
     * @return 단축 코드
     */
    public static String generate(int length) {
        if (length < 1) {
            throw new IllegalArgumentException("short code length must be >= 1");
        }
        char[] alphabet = SctConstants.SHORT_CODE_ALPHABET.toCharArray();
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(alphabet[SECURE_RANDOM.nextInt(alphabet.length)]);
        }
        return sb.toString();
    }

    /**
     * 문자셋·길이 검증.
     *
     * @param code 후보
     * @return true면 허용
     */
    public static boolean isValidFormat(String code) {
        if (code == null || code.length() != SctConstants.SHORT_CODE_LENGTH) {
            return false;
        }
        for (int i = 0; i < code.length(); i++) {
            if (SctConstants.SHORT_CODE_ALPHABET.indexOf(code.charAt(i)) < 0) {
                return false;
            }
        }
        return true;
    }
}
