package com.coresolution.consultation.integration.apple;

import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import com.coresolution.consultation.config.AppleOAuth2Properties;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.stereotype.Component;
import lombok.extern.slf4j.Slf4j;

/**
 * Apple `/auth/token` 호출용 `client_secret` JWT 생성기 (ES256, EC P-256).
 *
 * <p>Apple 문서 — Generate and validate tokens:
 * <a href="https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens">
 * developer.apple.com</a></p>
 *
 * <p>JWT 구조:
 * <ul>
 *   <li>header: {@code { alg: "ES256", kid: APPLE_KEY_ID }}</li>
 *   <li>payload: {@code { iss: APPLE_TEAM_ID, iat: now, exp: now+TTL, aud: "https://appleid.apple.com", sub: APPLE_CLIENT_ID }}</li>
 *   <li>signature: ECDSA SHA-256 (private key = {@code APPLE_PRIVATE_KEY} 의 .p8 PEM PKCS#8)</li>
 * </ul>
 * </p>
 *
 * <p>TTL 은 보안상 60일 기본(Apple 정책 상한 6개월). {@link AppleOAuth2Properties#getClientSecretTtlSeconds()} 로 조정.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@Slf4j
@Component
public class AppleClientSecretGenerator {

    private static final String APPLE_AUDIENCE = "https://appleid.apple.com";
    private static final String EC_KEY_ALGORITHM = "EC";
    private static final String PEM_HEADER = "-----BEGIN PRIVATE KEY-----";
    private static final String PEM_FOOTER = "-----END PRIVATE KEY-----";

    private final AppleOAuth2Properties properties;

    public AppleClientSecretGenerator(AppleOAuth2Properties properties) {
        this.properties = properties;
    }

    /**
     * Apple `/auth/token` 호출에 첨부할 `client_secret` JWT 를 생성한다.
     *
     * @return ES256 서명된 JWT 문자열
     * @throws AppleClientSecretException 자격증명 부족·키 파싱 실패 등 생성 불가 시
     */
    public String generate() {
        requireProperty(properties.getTeamId(), "APPLE_TEAM_ID");
        requireProperty(properties.getClientId(), "APPLE_CLIENT_ID");
        requireProperty(properties.getKeyId(), "APPLE_KEY_ID");
        requireProperty(properties.getPrivateKey(), "APPLE_PRIVATE_KEY");

        PrivateKey privateKey = parsePrivateKey(properties.getPrivateKey());

        Instant now = Instant.now();
        long ttlSeconds = Math.max(60L, properties.getClientSecretTtlSeconds());
        Instant expiry = now.plusSeconds(ttlSeconds);

        Map<String, Object> headers = new HashMap<>();
        headers.put("kid", properties.getKeyId());
        headers.put("alg", "ES256");

        Map<String, Object> claims = new HashMap<>();
        claims.put("iss", properties.getTeamId());
        claims.put("aud", APPLE_AUDIENCE);
        claims.put("sub", properties.getClientId());

        return Jwts.builder()
            .setHeader(headers)
            .setClaims(claims)
            .setIssuedAt(Date.from(now))
            .setExpiration(Date.from(expiry))
            .signWith(privateKey, SignatureAlgorithm.ES256)
            .compact();
    }

    private PrivateKey parsePrivateKey(String pemOrBase64) {
        String body = pemOrBase64
            .replace(PEM_HEADER, "")
            .replace(PEM_FOOTER, "")
            .replaceAll("\\s+", "");
        if (body.isEmpty()) {
            throw new AppleClientSecretException("APPLE_PRIVATE_KEY 가 비어 있습니다.");
        }
        try {
            byte[] der = Base64.getDecoder().decode(body);
            PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(der);
            return KeyFactory.getInstance(EC_KEY_ALGORITHM).generatePrivate(keySpec);
        } catch (Exception e) {
            throw new AppleClientSecretException("APPLE_PRIVATE_KEY 파싱 실패", e);
        }
    }

    private static void requireProperty(String value, String name) {
        if (value == null || value.isBlank()) {
            throw new AppleClientSecretException(name + " 가 설정되지 않았습니다.");
        }
    }

    /** Apple client_secret 생성 실패 단일 예외. */
    public static class AppleClientSecretException extends RuntimeException {
        public AppleClientSecretException(String message) {
            super(message);
        }

        public AppleClientSecretException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
