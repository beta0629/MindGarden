package com.coresolution.consultation.service.support;

import java.security.SecureRandom;
import org.springframework.stereotype.Component;

/**
 * 숫자 인증 코드 생성기. {@link SecureRandom} 으로만 뽑는다({@code Math.random} 금지).
 *
 * @author CoreSolution
 * @since 2026-10-12
 */
@Component
public class SecureNumericCodeGenerator {

    /** 이메일 인증 코드 자릿수 */
    public static final int EMAIL_CODE_LENGTH = 6;

    private static final int DECIMAL_RADIX = 10;

    private final SecureRandom random = new SecureRandom();

    /**
     * @return {@link #EMAIL_CODE_LENGTH} 자리 숫자 문자열(앞자리 0 포함)
     */
    public String generateEmailCode() {
        return generate(EMAIL_CODE_LENGTH);
    }

    /**
     * @param length 자릿수(1 이상)
     * @return 지정 자릿수의 숫자 문자열
     */
    public String generate(int length) {
        if (length < 1) {
            throw new IllegalArgumentException("length must be positive");
        }
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(random.nextInt(DECIMAL_RADIX));
        }
        return sb.toString();
    }
}
