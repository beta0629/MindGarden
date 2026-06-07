package com.coresolution.consultation.integration.apple;

import java.math.BigInteger;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.RSAPublicKeySpec;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;
import com.coresolution.consultation.config.AppleOAuth2Properties;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import lombok.extern.slf4j.Slf4j;

/**
 * Apple ID token (identityToken) 검증기.
 *
 * <p>책임:
 * <ol>
 *   <li>{@link AppleOAuth2Properties#getJwksUri()} 에서 JWK Set 캐싱(TTL = {@code jwksCacheTtlSeconds})</li>
 *   <li>JWT 헤더 {@code kid} 로 RSA 공개키 선택 후 RS256 서명 검증</li>
 *   <li>{@code iss}/{@code aud}/{@code exp}/{@code nonce} (선택) payload 검증</li>
 * </ol>
 * </p>
 *
 * <p>JJWT 0.11.5 가 JWK 로드를 직접 지원하지 않아 Jackson + JCA 로 직접 처리한다.
 * 보안상 모든 검증 실패는 {@link AppleIdTokenVerificationException} 으로 통일하여
 * 호출 측이 클라이언트에 상세 사유를 노출하지 않도록 한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@Slf4j
@Component
public class AppleIdTokenVerifier {

    private static final String SIGNATURE_ALG = "SHA256withRSA";
    private static final String KEY_FACTORY_ALG = "RSA";
    private static final String JWT_HEADER_KID = "kid";
    private static final long JWKS_FETCH_TIMEOUT_SECONDS = 10L;

    private final AppleOAuth2Properties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final AtomicReference<JwkCacheEntry> jwkCache = new AtomicReference<>();

    public AppleIdTokenVerifier(AppleOAuth2Properties properties) {
        this(properties, new ObjectMapper(), HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(JWKS_FETCH_TIMEOUT_SECONDS))
            .build());
    }

    /** 테스트 주입용 생성자. */
    public AppleIdTokenVerifier(AppleOAuth2Properties properties,
                                ObjectMapper objectMapper,
                                HttpClient httpClient) {
        this.properties = Objects.requireNonNull(properties);
        this.objectMapper = Objects.requireNonNull(objectMapper);
        this.httpClient = Objects.requireNonNull(httpClient);
    }

    /**
     * Apple identityToken 을 검증하고 payload claims 를 반환한다.
     *
     * @param identityToken Apple 이 발급한 ID token (JWT)
     * @param expectedNonce 클라이언트가 인증 시작 시 생성한 nonce (null 이면 검증 생략)
     * @return payload claims (sub, email, email_verified, is_private_email, aud, iss, exp, nonce …)
     * @throws AppleIdTokenVerificationException 검증 실패
     */
    public Map<String, Object> verify(String identityToken, String expectedNonce) {
        if (identityToken == null || identityToken.isBlank()) {
            throw new AppleIdTokenVerificationException("identityToken 이 비어 있습니다.");
        }
        String[] parts = identityToken.split("\\.");
        if (parts.length != 3) {
            throw new AppleIdTokenVerificationException("identityToken 형식이 올바르지 않습니다.");
        }

        Map<String, Object> header = parseJsonSegment(parts[0]);
        Map<String, Object> payload = parseJsonSegment(parts[1]);
        byte[] signatureBytes = decodeBase64Url(parts[2]);
        byte[] signingInput = (parts[0] + "." + parts[1]).getBytes(StandardCharsets.US_ASCII);

        String kid = asString(header.get(JWT_HEADER_KID));
        if (kid == null) {
            throw new AppleIdTokenVerificationException("identityToken 헤더에 kid 가 없습니다.");
        }

        PublicKey publicKey = resolvePublicKey(kid);
        verifySignature(signingInput, signatureBytes, publicKey);
        verifyClaims(payload, expectedNonce);

        return payload;
    }

    /**
     * 캐시·강제 갱신을 모두 시도해 {@code kid} 에 해당하는 공개키를 반환한다.
     */
    private PublicKey resolvePublicKey(String kid) {
        JwkCacheEntry cached = jwkCache.get();
        Instant now = Instant.now();
        if (cached == null || cached.isExpired(now)) {
            cached = refreshJwks(now);
        }
        PublicKey key = cached.keys.get(kid);
        if (key != null) {
            return key;
        }
        // Apple 이 새 키로 회전했을 가능성 → 강제 재요청 후 한 번만 재시도
        cached = refreshJwks(now);
        key = cached.keys.get(kid);
        if (key == null) {
            throw new AppleIdTokenVerificationException("Apple JWKS 에 일치하는 kid 가 없습니다: " + kid);
        }
        return key;
    }

    /**
     * JWKS endpoint 에서 JWK Set 을 가져와 캐시에 저장한다.
     */
    private JwkCacheEntry refreshJwks(Instant now) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(properties.getJwksUri()))
                .timeout(Duration.ofSeconds(JWKS_FETCH_TIMEOUT_SECONDS))
                .header("Accept", "application/json")
                .GET()
                .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() / 100 != 2) {
                throw new AppleIdTokenVerificationException(
                    "Apple JWKS HTTP 오류: status=" + response.statusCode());
            }
            Map<String, Object> root = objectMapper.readValue(response.body(),
                new TypeReference<Map<String, Object>>() { });
            Object keysObj = root.get("keys");
            if (!(keysObj instanceof List<?> keysList)) {
                throw new AppleIdTokenVerificationException("Apple JWKS 응답에 keys 배열이 없습니다.");
            }
            Map<String, PublicKey> resolved = new ConcurrentHashMap<>(keysList.size());
            for (Object item : keysList) {
                if (!(item instanceof Map<?, ?> map)) continue;
                String kid = asString(map.get("kid"));
                String kty = asString(map.get("kty"));
                String n = asString(map.get("n"));
                String e = asString(map.get("e"));
                if (kid == null || kty == null || n == null || e == null || !"RSA".equals(kty)) {
                    continue;
                }
                BigInteger modulus = new BigInteger(1, decodeBase64Url(n));
                BigInteger exponent = new BigInteger(1, decodeBase64Url(e));
                PublicKey publicKey = KeyFactory.getInstance(KEY_FACTORY_ALG)
                    .generatePublic(new RSAPublicKeySpec(modulus, exponent));
                resolved.put(kid, publicKey);
            }
            JwkCacheEntry entry = new JwkCacheEntry(
                resolved,
                now.plusSeconds(Math.max(1L, properties.getJwksCacheTtlSeconds())));
            jwkCache.set(entry);
            log.debug("Apple JWKS 캐시 갱신: keyIds={}, expiresAt={}",
                resolved.keySet(), entry.expiresAt);
            return entry;
        } catch (AppleIdTokenVerificationException e) {
            throw e;
        } catch (Exception e) {
            throw new AppleIdTokenVerificationException("Apple JWKS 조회 실패", e);
        }
    }

    private void verifySignature(byte[] signingInput, byte[] signatureBytes, PublicKey publicKey) {
        try {
            Signature signature = Signature.getInstance(SIGNATURE_ALG);
            signature.initVerify(publicKey);
            signature.update(signingInput);
            if (!signature.verify(signatureBytes)) {
                throw new AppleIdTokenVerificationException("identityToken 서명 검증 실패");
            }
        } catch (AppleIdTokenVerificationException e) {
            throw e;
        } catch (Exception e) {
            throw new AppleIdTokenVerificationException("identityToken 서명 검증 중 예외", e);
        }
    }

    private void verifyClaims(Map<String, Object> payload, String expectedNonce) {
        String iss = asString(payload.get("iss"));
        if (iss == null || !iss.equals(properties.getIssuer())) {
            throw new AppleIdTokenVerificationException("issuer 불일치: " + iss);
        }
        if (!matchesAudience(payload.get("aud"), properties.getClientId())) {
            throw new AppleIdTokenVerificationException("audience 불일치");
        }
        long exp = asLong(payload.get("exp"));
        long nowSeconds = Instant.now().getEpochSecond();
        if (exp <= nowSeconds) {
            throw new AppleIdTokenVerificationException("identityToken 만료");
        }
        if (expectedNonce != null && !expectedNonce.isBlank()) {
            String nonce = asString(payload.get("nonce"));
            if (nonce == null || !expectedNonce.equals(nonce)) {
                throw new AppleIdTokenVerificationException("nonce 불일치");
            }
        }
    }

    private boolean matchesAudience(Object aud, String expected) {
        if (expected == null || expected.isBlank()) {
            return false;
        }
        if (aud instanceof String single) {
            return expected.equals(single);
        }
        if (aud instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof String s && expected.equals(s)) {
                    return true;
                }
            }
        }
        return false;
    }

    private Map<String, Object> parseJsonSegment(String segment) {
        try {
            byte[] decoded = decodeBase64Url(segment);
            return objectMapper.readValue(decoded, new TypeReference<Map<String, Object>>() { });
        } catch (Exception e) {
            throw new AppleIdTokenVerificationException("identityToken 세그먼트 파싱 실패", e);
        }
    }

    private static byte[] decodeBase64Url(String input) {
        return Base64.getUrlDecoder().decode(padBase64Url(input));
    }

    private static String padBase64Url(String input) {
        int mod = input.length() % 4;
        if (mod == 0) return input;
        return input + "====".substring(mod);
    }

    private static String asString(Object value) {
        return value == null ? null : value.toString();
    }

    private static long asLong(Object value) {
        if (value instanceof Number n) return n.longValue();
        if (value instanceof String s) {
            try {
                return Long.parseLong(s);
            } catch (NumberFormatException ignored) {
                return 0L;
            }
        }
        return 0L;
    }

    /** JWKS 캐시 항목. */
    private static final class JwkCacheEntry {
        private final Map<String, PublicKey> keys;
        private final Instant expiresAt;

        private JwkCacheEntry(Map<String, PublicKey> keys, Instant expiresAt) {
            this.keys = keys;
            this.expiresAt = expiresAt;
        }

        boolean isExpired(Instant now) {
            return !now.isBefore(expiresAt);
        }
    }

    /** 테스트·진단 용 — 현재 캐시된 kid 목록(없으면 빈 리스트). */
    List<String> debugCachedKeyIds() {
        JwkCacheEntry entry = jwkCache.get();
        if (entry == null) return new ArrayList<>();
        return new ArrayList<>(entry.keys.keySet());
    }

    /** 테스트 용 — 캐시 무효화. */
    public void invalidateCache() {
        jwkCache.set(null);
    }

    /** Apple identityToken 검증 실패 단일 예외. */
    public static class AppleIdTokenVerificationException extends RuntimeException {
        public AppleIdTokenVerificationException(String message) {
            super(message);
        }

        public AppleIdTokenVerificationException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    /** 빈 외부 캐시 시드 (예: 테스트). */
    void seedCacheForTesting(Map<String, PublicKey> keys, Instant expiresAt) {
        jwkCache.set(new JwkCacheEntry(new HashMap<>(keys), expiresAt));
    }
}
