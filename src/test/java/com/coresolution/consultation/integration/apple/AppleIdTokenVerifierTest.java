package com.coresolution.consultation.integration.apple;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
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
}
