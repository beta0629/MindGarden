package com.coresolution.consultation.integration.apple;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.config.AppleOAuth2Properties;
import com.coresolution.consultation.integration.apple.AppleIdTokenVerifier.AppleIdTokenVerificationException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;

import java.net.http.HttpClient;
import java.net.http.HttpResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * {@link AppleIdTokenVerifier} 단위 테스트.
 *
 * <p>Apple 실제 JWKS 호출 없이 mock {@link HttpClient} 로 RSA 공개키 모음을 반환하고,
 * 동일 private key 로 서명한 JWT 가 검증되는지 확인한다.</p>
 */
class AppleIdTokenVerifierTest {

    private static final String EXPECTED_ISSUER = "https://appleid.apple.com";
    private static final String EXPECTED_AUDIENCE = "co.kr.coresolution.app.signin";
    /** iOS 네이티브 SIWA 가 사용하는 Bundle ID — Apple 이 토큰 aud 에 박아 발급. */
    private static final String EXPECTED_BUNDLE_AUDIENCE = "com.mindgarden.MindGardenMobile";
    private static final String TEST_KID = "TESTKEYID1";

    private KeyPair rsaKeyPair;
    private AppleOAuth2Properties properties;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        rsaKeyPair = generator.generateKeyPair();

        properties = new AppleOAuth2Properties();
        properties.setClientId(EXPECTED_AUDIENCE);
        properties.setIssuer(EXPECTED_ISSUER);
        properties.setJwksUri("https://appleid.apple.com/auth/keys");
        properties.setJwksCacheTtlSeconds(3600);

        objectMapper = new ObjectMapper();
    }

    private String buildJwksJson(PublicKey publicKey, String kid) throws Exception {
        RSAPublicKey rsa = (RSAPublicKey) publicKey;
        String n = Base64.getUrlEncoder().withoutPadding().encodeToString(rsa.getModulus().toByteArray());
        String e = Base64.getUrlEncoder().withoutPadding().encodeToString(rsa.getPublicExponent().toByteArray());

        Map<String, Object> key = new HashMap<>();
        key.put("kty", "RSA");
        key.put("kid", kid);
        key.put("alg", "RS256");
        key.put("use", "sig");
        key.put("n", n);
        key.put("e", e);

        Map<String, Object> jwks = new HashMap<>();
        jwks.put("keys", new Object[] { key });
        return objectMapper.writeValueAsString(jwks);
    }

    private String signToken(PrivateKey privateKey, String kid, String audience,
                             String issuer, String nonce, long expiresAtEpochSeconds) {
        Map<String, Object> headers = new HashMap<>();
        headers.put("kid", kid);
        headers.put("alg", "RS256");
        Map<String, Object> claims = new HashMap<>();
        claims.put("iss", issuer);
        claims.put("aud", audience);
        claims.put("sub", "001234.abcdef1234567890.0000");
        claims.put("email", "user@example.com");
        if (nonce != null) {
            claims.put("nonce", nonce);
        }
        return Jwts.builder()
            .setHeader(headers)
            .setClaims(claims)
            .setIssuedAt(new Date())
            .setExpiration(Date.from(Instant.ofEpochSecond(expiresAtEpochSeconds)))
            .signWith(privateKey, SignatureAlgorithm.RS256)
            .compact();
    }

    @SuppressWarnings({ "unchecked", "rawtypes" })
    private HttpClient mockHttpClientWith(String jwksBody) throws Exception {
        HttpResponse response = Mockito.mock(HttpResponse.class);
        Mockito.when(response.statusCode()).thenReturn(200);
        Mockito.when(response.body()).thenReturn(jwksBody);

        HttpClient client = Mockito.mock(HttpClient.class);
        Mockito.when(client.send(ArgumentMatchers.any(), ArgumentMatchers.any()))
            .thenReturn(response);
        return client;
    }

    @Test
    @DisplayName("정상 토큰은 JWKS 조회·서명·issuer·audience·nonce 검증을 통과한다")
    void verify_success_withCachedJwks() throws Exception {
        String jwks = buildJwksJson(rsaKeyPair.getPublic(), TEST_KID);
        AppleIdTokenVerifier verifier = new AppleIdTokenVerifier(properties, objectMapper, mockHttpClientWith(jwks));
        String token = signToken(rsaKeyPair.getPrivate(), TEST_KID, EXPECTED_AUDIENCE,
            EXPECTED_ISSUER, "nonce-123", Instant.now().getEpochSecond() + 3600);

        Map<String, Object> claims = verifier.verify(token, "nonce-123");

        assertThat(claims.get("sub")).isEqualTo("001234.abcdef1234567890.0000");
        assertThat(claims.get("email")).isEqualTo("user@example.com");
    }

    @Test
    @DisplayName("issuer 불일치 시 AppleIdTokenVerificationException 을 던진다")
    void verify_failsOnIssuerMismatch() throws Exception {
        String jwks = buildJwksJson(rsaKeyPair.getPublic(), TEST_KID);
        AppleIdTokenVerifier verifier = new AppleIdTokenVerifier(properties, objectMapper, mockHttpClientWith(jwks));
        String token = signToken(rsaKeyPair.getPrivate(), TEST_KID, EXPECTED_AUDIENCE,
            "https://attacker.example.com", null, Instant.now().getEpochSecond() + 3600);

        assertThatThrownBy(() -> verifier.verify(token, null))
            .isInstanceOf(AppleIdTokenVerificationException.class)
            .hasMessageContaining("issuer");
    }

    @Test
    @DisplayName("audience 불일치 시 검증 실패한다")
    void verify_failsOnAudienceMismatch() throws Exception {
        String jwks = buildJwksJson(rsaKeyPair.getPublic(), TEST_KID);
        AppleIdTokenVerifier verifier = new AppleIdTokenVerifier(properties, objectMapper, mockHttpClientWith(jwks));
        String token = signToken(rsaKeyPair.getPrivate(), TEST_KID,
            "co.kr.attacker.app", EXPECTED_ISSUER, null, Instant.now().getEpochSecond() + 3600);

        assertThatThrownBy(() -> verifier.verify(token, null))
            .isInstanceOf(AppleIdTokenVerificationException.class)
            .hasMessageContaining("audience");
    }

    @Test
    @DisplayName("nonce 불일치 시 검증 실패한다")
    void verify_failsOnNonceMismatch() throws Exception {
        String jwks = buildJwksJson(rsaKeyPair.getPublic(), TEST_KID);
        AppleIdTokenVerifier verifier = new AppleIdTokenVerifier(properties, objectMapper, mockHttpClientWith(jwks));
        String token = signToken(rsaKeyPair.getPrivate(), TEST_KID, EXPECTED_AUDIENCE,
            EXPECTED_ISSUER, "server-nonce", Instant.now().getEpochSecond() + 3600);

        assertThatThrownBy(() -> verifier.verify(token, "client-nonce"))
            .isInstanceOf(AppleIdTokenVerificationException.class)
            .hasMessageContaining("nonce");
    }

    @Test
    @DisplayName("만료된 토큰은 검증 실패한다")
    void verify_failsWhenExpired() throws Exception {
        String jwks = buildJwksJson(rsaKeyPair.getPublic(), TEST_KID);
        AppleIdTokenVerifier verifier = new AppleIdTokenVerifier(properties, objectMapper, mockHttpClientWith(jwks));
        String token = signToken(rsaKeyPair.getPrivate(), TEST_KID, EXPECTED_AUDIENCE,
            EXPECTED_ISSUER, null, Instant.now().getEpochSecond() - 10);

        assertThatThrownBy(() -> verifier.verify(token, null))
            .isInstanceOf(AppleIdTokenVerificationException.class)
            .hasMessageContaining("만료");
    }

    @Test
    @DisplayName("kid 미일치 시 JWKS 를 재요청해도 동일 kid 가 없으면 실패한다")
    void verify_failsWhenKidMissingEvenAfterRefresh() throws Exception {
        String jwks = buildJwksJson(rsaKeyPair.getPublic(), "OTHERKID999");
        AppleIdTokenVerifier verifier = new AppleIdTokenVerifier(properties, objectMapper, mockHttpClientWith(jwks));
        String token = signToken(rsaKeyPair.getPrivate(), TEST_KID, EXPECTED_AUDIENCE,
            EXPECTED_ISSUER, null, Instant.now().getEpochSecond() + 3600);

        assertThatThrownBy(() -> verifier.verify(token, null))
            .isInstanceOf(AppleIdTokenVerificationException.class)
            .hasMessageContaining("kid");
    }

    @Test
    @DisplayName("JWKS 캐싱: 한 번 발급된 키 셋은 캐시되어 후속 호출에서 HTTP 재요청을 발생시키지 않는다")
    void verify_jwksCachedAcrossInvocations() throws Exception {
        String jwks = buildJwksJson(rsaKeyPair.getPublic(), TEST_KID);
        HttpClient client = mockHttpClientWith(jwks);
        AppleIdTokenVerifier verifier = new AppleIdTokenVerifier(properties, objectMapper, client);

        String token = signToken(rsaKeyPair.getPrivate(), TEST_KID, EXPECTED_AUDIENCE,
            EXPECTED_ISSUER, null, Instant.now().getEpochSecond() + 3600);
        verifier.verify(token, null);
        verifier.verify(token, null);
        verifier.verify(token, null);

        Mockito.verify(client, Mockito.times(1))
            .send(ArgumentMatchers.any(), ArgumentMatchers.any());
    }

    // ==========================================================================================
    // P0 hotfix 2026-06-08 — multi-audience 회귀 게이트
    //
    // 배경: iOS 네이티브 SIWA(`expo-apple-authentication`) identityToken 의 aud 는 Apple 이
    //       자동으로 디바이스의 Bundle ID(`com.mindgarden.MindGardenMobile`) 로 박아 발급한다.
    //       기존 단일 audience 검증(matchesAudience)은 Service ID 만 허용해 모든 네이티브 토큰을
    //       reject 하여 iPhone 로그인이 전혀 동작하지 않았다.
    // 핵심: AppleOAuth2Properties.allowedAudiences 에 Service ID + Bundle ID 모두 등록하면
    //       AppleIdTokenVerifier.matchesAnyAudience 가 두 토큰 형태 모두 통과시킨다.
    // ==========================================================================================

    @Test
    @DisplayName("[P0 hotfix] Bundle ID 가 allowedAudiences 에 포함되면 iOS 네이티브 토큰 검증 성공")
    void verify_success_whenBundleIdIsAllowed() throws Exception {
        // Service ID + Bundle ID 둘 다 허용 (운영 권장 설정)
        properties.setAllowedAudiences(Arrays.asList(EXPECTED_AUDIENCE, EXPECTED_BUNDLE_AUDIENCE));

        String jwks = buildJwksJson(rsaKeyPair.getPublic(), TEST_KID);
        AppleIdTokenVerifier verifier = new AppleIdTokenVerifier(properties, objectMapper, mockHttpClientWith(jwks));
        // iOS 네이티브 SIWA 가 발급하는 형태 — aud=Bundle ID
        String token = signToken(rsaKeyPair.getPrivate(), TEST_KID, EXPECTED_BUNDLE_AUDIENCE,
            EXPECTED_ISSUER, null, Instant.now().getEpochSecond() + 3600);

        Map<String, Object> claims = verifier.verify(token, null);

        assertThat(claims.get("aud")).isEqualTo(EXPECTED_BUNDLE_AUDIENCE);
    }

    @Test
    @DisplayName("[P0 hotfix] Service ID 가 allowedAudiences 에 포함되면 웹/Service ID 토큰 검증 성공 (회귀 보존)")
    void verify_success_whenServiceIdIsAllowed_existingBehaviorPreserved() throws Exception {
        properties.setAllowedAudiences(Arrays.asList(EXPECTED_AUDIENCE, EXPECTED_BUNDLE_AUDIENCE));

        String jwks = buildJwksJson(rsaKeyPair.getPublic(), TEST_KID);
        AppleIdTokenVerifier verifier = new AppleIdTokenVerifier(properties, objectMapper, mockHttpClientWith(jwks));
        // 웹/Service ID 흐름 — aud=Service ID (기존 동작)
        String token = signToken(rsaKeyPair.getPrivate(), TEST_KID, EXPECTED_AUDIENCE,
            EXPECTED_ISSUER, null, Instant.now().getEpochSecond() + 3600);

        Map<String, Object> claims = verifier.verify(token, null);

        assertThat(claims.get("aud")).isEqualTo(EXPECTED_AUDIENCE);
    }

    @Test
    @DisplayName("[P0 hotfix] allowedAudiences List 에 없는 audience 는 reject 된다")
    void verify_failsWhenAudienceNotInAllowedList() throws Exception {
        properties.setAllowedAudiences(Arrays.asList(EXPECTED_AUDIENCE, EXPECTED_BUNDLE_AUDIENCE));

        String jwks = buildJwksJson(rsaKeyPair.getPublic(), TEST_KID);
        AppleIdTokenVerifier verifier = new AppleIdTokenVerifier(properties, objectMapper, mockHttpClientWith(jwks));
        String token = signToken(rsaKeyPair.getPrivate(), TEST_KID,
            "com.other.app", EXPECTED_ISSUER, null, Instant.now().getEpochSecond() + 3600);

        assertThatThrownBy(() -> verifier.verify(token, null))
            .isInstanceOf(AppleIdTokenVerificationException.class)
            .hasMessageContaining("audience 불일치");
    }

    @Test
    @DisplayName("[P0 hotfix] allowedAudiences 비어 있고 clientId 도 blank 이면 모든 audience reject")
    void verify_failsWhenBothAllowedAudiencesAndClientIdBlank() throws Exception {
        properties.setClientId("");
        properties.setAllowedAudiences(Collections.emptyList());

        String jwks = buildJwksJson(rsaKeyPair.getPublic(), TEST_KID);
        AppleIdTokenVerifier verifier = new AppleIdTokenVerifier(properties, objectMapper, mockHttpClientWith(jwks));
        String token = signToken(rsaKeyPair.getPrivate(), TEST_KID, EXPECTED_AUDIENCE,
            EXPECTED_ISSUER, null, Instant.now().getEpochSecond() + 3600);

        assertThatThrownBy(() -> verifier.verify(token, null))
            .isInstanceOf(AppleIdTokenVerificationException.class)
            .hasMessageContaining("audience 불일치");
    }

    @Test
    @DisplayName("[P0 hotfix] allowedAudiences 비어 있어도 clientId 단일값 fallback 으로 검증 성공 (회귀 0)")
    void verify_fallsBackToClientIdWhenAllowedAudiencesEmpty() throws Exception {
        properties.setAllowedAudiences(Collections.emptyList());
        // clientId 는 EXPECTED_AUDIENCE 로 setUp() 단계에서 이미 설정됨

        String jwks = buildJwksJson(rsaKeyPair.getPublic(), TEST_KID);
        AppleIdTokenVerifier verifier = new AppleIdTokenVerifier(properties, objectMapper, mockHttpClientWith(jwks));
        String token = signToken(rsaKeyPair.getPrivate(), TEST_KID, EXPECTED_AUDIENCE,
            EXPECTED_ISSUER, null, Instant.now().getEpochSecond() + 3600);

        Map<String, Object> claims = verifier.verify(token, null);

        assertThat(claims.get("aud")).isEqualTo(EXPECTED_AUDIENCE);
    }

    @Test
    @DisplayName("[P0 hotfix] aud 가 List 형식(RFC 7519 §4.1.3)일 때도 매칭 항목이 있으면 통과")
    void verify_success_whenAudIsArray() throws Exception {
        properties.setAllowedAudiences(Arrays.asList(EXPECTED_AUDIENCE, EXPECTED_BUNDLE_AUDIENCE));

        // Apple 은 보통 single-string aud 만 발급하지만, RFC 7519 §4.1.3 은 array 도 허용.
        // 본 테스트는 verifier 가 List<String> 형태 aud 도 안전하게 처리함을 회귀 보장.
        String jwks = buildJwksJson(rsaKeyPair.getPublic(), TEST_KID);
        AppleIdTokenVerifier verifier = new AppleIdTokenVerifier(properties, objectMapper, mockHttpClientWith(jwks));

        Map<String, Object> headers = new HashMap<>();
        headers.put("kid", TEST_KID);
        headers.put("alg", "RS256");
        Map<String, Object> claims = new HashMap<>();
        claims.put("iss", EXPECTED_ISSUER);
        claims.put("aud", List.of("com.foreign.audience", EXPECTED_BUNDLE_AUDIENCE));
        claims.put("sub", "001234.abcdef1234567890.0000");
        String token = io.jsonwebtoken.Jwts.builder()
            .setHeader(headers)
            .setClaims(claims)
            .setIssuedAt(new Date())
            .setExpiration(Date.from(Instant.ofEpochSecond(Instant.now().getEpochSecond() + 3600)))
            .signWith(rsaKeyPair.getPrivate(), io.jsonwebtoken.SignatureAlgorithm.RS256)
            .compact();

        Map<String, Object> result = verifier.verify(token, null);
        assertThat(result.get("aud")).isInstanceOf(List.class);
    }
}
