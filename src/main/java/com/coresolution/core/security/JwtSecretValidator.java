package com.coresolution.core.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * JWT 비밀키 검증 컴포넌트.
 *
 * <p>운영 환경(profiles 가 dev/local 아님)에서는 부트 시점에 다음을 강제한다.
 * <ul>
 *   <li>최소 길이 ≥ {@value #JWT_SECRET_PROD_MIN_LENGTH} chars</li>
 *   <li>hex-only (^[0-9a-fA-F]+$) 또는 base64-url-safe 인코딩 형태</li>
 *   <li>약 단어 차단 (local / dev / development / secret-key / changeme / test /
 *       example / mindgarden / coresolution — 대소문자 무관 부분 일치)</li>
 *   <li>위 규칙 위반 시 {@link IllegalStateException} 으로 부트 중단</li>
 * </ul>
 *
 * <p>비운영 환경(dev / local / test) 에서는 동일한 규칙을 경고(WARN) 로만 보고 부트는 허용한다.
 * 운영 회귀 방지가 목적이므로 운영 동치 프로파일(prod / production / staging / 기본 비프로파일)
 * 에서는 fail-fast 가 우선이다.
 *
 * @author CoreSolution
 * @since 2025-12-02
 */
@Slf4j
@Component
public class JwtSecretValidator {

    /** 운영 환경에서 강제하는 최소 길이. {@code openssl rand -hex 64} 출력 길이. */
    static final int JWT_SECRET_PROD_MIN_LENGTH = 64;

    /** 너무 큰 키는 운영 운영 사고(잘못 붙은 multiline 등) 가능성이 높다. */
    static final int JWT_SECRET_MAX_LENGTH = 512;

    /** {@code openssl rand -hex N} 출력 패턴. */
    static final Pattern HEX_PATTERN = Pattern.compile("^[0-9a-fA-F]+$");

    /** Base64 / Base64URL 출력 패턴 (padding 포함, padding 없음 모두 허용). */
    static final Pattern BASE64_PATTERN = Pattern.compile("^[A-Za-z0-9+/_\\-]+={0,2}$");

    /**
     * 부분 일치(대소문자 무관) 시 즉시 부트 중단되는 약 단어 set.
     *
     * <p>운영에 절대 들어와선 안 되는 placeholder/네임스페이스 명. 변경 시 본 클래스 단위 테스트
     * {@code JwtSecretValidatorTest} 와 동기 갱신 필요.
     */
    static final List<String> WEAK_TOKENS = List.of(
            "local",
            "dev",
            "development",
            "secret-key",
            "secret_key",
            "secretkey",
            "changeme",
            "change-me",
            "test",
            "example",
            "mindgarden",
            "coresolution"
    );

    private final Environment environment;

    @Value("${jwt.secret:}")
    private String jwtSecret;

    public JwtSecretValidator(Environment environment) {
        this.environment = environment;
    }

    /**
     * 애플리케이션 시작 시 JWT 비밀키 검증.
     *
     * <p>운영 동치 프로파일에서 위반 시 {@link IllegalStateException} 으로 부트 중단.
     */
    @PostConstruct
    public void validateJwtSecret() {
        log.info("🔐 JWT 비밀키 검증 시작...");
        boolean nonProduction = isNonProductionProfile();
        ValidationResult result = evaluate(jwtSecret);

        if (result.isValid()) {
            log.info("✅ JWT 비밀키 검증 완료: 길이={}자, 인코딩={}",
                    jwtSecret == null ? 0 : jwtSecret.length(),
                    result.encoding());
            return;
        }

        String reasonSummary = String.join("; ", result.reasons());
        if (nonProduction) {
            log.warn("⚠️ [dev/local/test] JWT 비밀키 약함/부적합 — 운영 동치 프로파일에서는 부트 중단됩니다. 사유: {}",
                    reasonSummary);
            return;
        }

        String message = "JWT_SECRET 부적합 (운영 회귀 방지 가드 trip): " + reasonSummary
                + ". 강 키 회전 절차: openssl rand -hex 64";
        log.error("FATAL: {}", message);
        throw new IllegalStateException(message);
    }

    /**
     * 검증 본체. 부트 외부에서도 키 강도 점검에 사용한다.
     *
     * @param secret 검사 대상 JWT 비밀키
     * @return 검증 결과 (유효 여부 + 위반 사유 + 추정 인코딩)
     */
    public ValidationResult evaluate(String secret) {
        Set<String> reasons = new LinkedHashSet<>();
        String encoding = "unknown";

        if (secret == null || secret.trim().isEmpty()) {
            reasons.add("JWT_SECRET 미설정 (null/blank)");
            return new ValidationResult(false, reasons, encoding);
        }

        if (secret.length() < JWT_SECRET_PROD_MIN_LENGTH) {
            reasons.add(String.format(
                    "최소 길이 %d자 미만 (현재: %d자)",
                    JWT_SECRET_PROD_MIN_LENGTH,
                    secret.length()
            ));
        }
        if (secret.length() > JWT_SECRET_MAX_LENGTH) {
            reasons.add(String.format(
                    "최대 길이 %d자 초과 (현재: %d자)",
                    JWT_SECRET_MAX_LENGTH,
                    secret.length()
            ));
        }

        boolean hex = HEX_PATTERN.matcher(secret).matches();
        boolean base64 = BASE64_PATTERN.matcher(secret).matches();
        if (hex) {
            encoding = "hex";
        } else if (base64) {
            encoding = "base64";
        } else {
            reasons.add("hex(^[0-9a-fA-F]+$) 또는 base64 형태 아님 — "
                    + "openssl rand -hex 64 또는 openssl rand -base64 64 권장");
        }

        String lower = secret.toLowerCase();
        for (String weak : WEAK_TOKENS) {
            if (lower.contains(weak)) {
                reasons.add("약 단어 '" + weak + "' 포함");
            }
        }

        boolean valid = reasons.isEmpty();
        return new ValidationResult(valid, reasons, encoding);
    }

    /**
     * 키 강도 평가 (등급 문자열).
     *
     * @return "STRONG", "MEDIUM", "WEAK", "INVALID" 중 하나
     */
    public String evaluateSecretStrength() {
        ValidationResult result = evaluate(jwtSecret);
        if (jwtSecret == null || jwtSecret.isEmpty()) {
            return "INVALID";
        }
        if (result.isValid()) {
            return "STRONG";
        }
        if (jwtSecret.length() >= 32) {
            return "MEDIUM";
        }
        return "WEAK";
    }

    /**
     * 비운영 프로파일(dev / local / test) 여부.
     *
     * <p>운영 회귀 방지가 목표이므로 비운영에서는 WARN-only 로 격하한다. 운영(prod, production,
     * staging) 또는 프로파일 미지정(빈 set — 기본 application.yml) 은 fail-fast 대상.
     */
    private boolean isNonProductionProfile() {
        if (environment == null) {
            return false;
        }
        String[] actives = environment.getActiveProfiles();
        if (actives.length == 0) {
            return false;
        }
        return Arrays.stream(actives)
                .anyMatch(p -> "dev".equalsIgnoreCase(p)
                        || "local".equalsIgnoreCase(p)
                        || "test".equalsIgnoreCase(p));
    }

    /**
     * 검증 결과 record. 외부 호출자가 사유를 로깅·검사할 수 있도록 public.
     *
     * @param valid    검증 성공 여부
     * @param reasons  위반 사유 set (LinkedHashSet 순서 보존)
     * @param encoding 추정 인코딩 ("hex" / "base64" / "unknown")
     */
    public record ValidationResult(boolean valid, Set<String> reasons, String encoding) {

        public boolean isValid() {
            return valid;
        }
    }
}
