package com.coresolution.consultation.service.support;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;
import com.coresolution.consultation.config.TemporaryPasswordProperties;
import com.coresolution.core.security.PasswordPolicy;
import org.springframework.stereotype.Component;

/**
 * 로그인 저장 정책을 통과하는 임시 비밀번호를 {@link SecureRandom} 으로 만든다.
 * 길이·문자군은 {@link TemporaryPasswordProperties} 만 사용한다.
 *
 * @author CoreSolution
 * @since 2026-10-14
 */
@Component
public class TemporaryPasswordGenerator {

    static final String GENERATION_FAILED = "TEMP_PASSWORD_GENERATION_FAILED";

    static final String CONFIG_INVALID = "TEMP_PASSWORD_CONFIG_INVALID";

    private final SecureRandom random = new SecureRandom();

    private final TemporaryPasswordProperties properties;

    /**
     * @param properties 길이·문자군·재시도 설정
     */
    public TemporaryPasswordGenerator(TemporaryPasswordProperties properties) {
        this.properties = properties;
    }

    /**
     * 정책 통과 평문을 새로 만든다. 호출마다 값이 달라진다. 평문은 로그에 남기지 않는다.
     *
     * @return 정책 통과 평문
     * @throws IllegalStateException 설정이 정책과 맞지 않거나 재시도 한도를 넘긴 경우
     */
    public String generate() {
        validateConfig();
        int attempts = properties.getMaxAttempts();
        for (int attempt = 0; attempt < attempts; attempt++) {
            String candidate = assemble();
            if (PasswordPolicy.collectLoginStorageViolations(candidate).isEmpty()) {
                return candidate;
            }
        }
        throw new IllegalStateException(GENERATION_FAILED);
    }

    private void validateConfig() {
        int length = properties.getLength();
        if (length < PasswordPolicy.LOGIN_PASSWORD_MIN_LENGTH
                || length > PasswordPolicy.LOGIN_PASSWORD_MAX_LENGTH) {
            throw new IllegalStateException(CONFIG_INVALID);
        }
        if (properties.getMaxAttempts() < 1) {
            throw new IllegalStateException(CONFIG_INVALID);
        }
        requireCharset(properties.getLowercase());
        requireCharset(properties.getUppercase());
        requireCharset(properties.getDigits());
        requireCharset(properties.getSpecials());
        String allowed = PasswordPolicy.LOGIN_PASSWORD_ALLOWED_SPECIALS;
        for (int i = 0; i < properties.getSpecials().length(); i++) {
            if (allowed.indexOf(properties.getSpecials().charAt(i)) < 0) {
                throw new IllegalStateException(CONFIG_INVALID);
            }
        }
    }

    private static void requireCharset(String charset) {
        if (charset == null || charset.isEmpty()) {
            throw new IllegalStateException(CONFIG_INVALID);
        }
    }

    private String assemble() {
        int length = properties.getLength();
        List<Character> picked = new ArrayList<>(length);
        picked.add(pick(properties.getUppercase()));
        picked.add(pick(properties.getLowercase()));
        picked.add(pick(properties.getDigits()));
        picked.add(pick(properties.getSpecials()));
        String all = properties.getUppercase()
                + properties.getLowercase()
                + properties.getDigits()
                + properties.getSpecials();
        while (picked.size() < length) {
            picked.add(pick(all));
        }
        for (int i = picked.size() - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            Character tmp = picked.get(i);
            picked.set(i, picked.get(j));
            picked.set(j, tmp);
        }
        StringBuilder sb = new StringBuilder(length);
        for (Character c : picked) {
            sb.append(c.charValue());
        }
        return sb.toString();
    }

    private char pick(String charset) {
        return charset.charAt(random.nextInt(charset.length()));
    }
}
