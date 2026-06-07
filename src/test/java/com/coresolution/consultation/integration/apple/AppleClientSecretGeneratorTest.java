package com.coresolution.consultation.integration.apple;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PublicKey;
import java.security.spec.ECGenParameterSpec;
import java.util.Base64;
import com.coresolution.consultation.config.AppleOAuth2Properties;
import com.coresolution.consultation.integration.apple.AppleClientSecretGenerator.AppleClientSecretException;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * {@link AppleClientSecretGenerator} 단위 테스트.
 *
 * <p>Apple App Store 4.8 (T1) — ES256 client_secret JWT 생성을 검증한다.
 * 실제 Apple 키 대신 EC P-256 키쌍을 즉석에서 생성·서명하고, 동일 공개키로
 * 검증되는지 확인한다.</p>
 */
class AppleClientSecretGeneratorTest {

    private static KeyPair keyPair;
    private static String privateKeyBase64;

    @BeforeAll
    static void generateEcKey() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("EC");
        generator.initialize(new ECGenParameterSpec("secp256r1"));
        keyPair = generator.generateKeyPair();
        privateKeyBase64 = Base64.getEncoder().encodeToString(keyPair.getPrivate().getEncoded());
    }

    private AppleOAuth2Properties propertiesWithKey(String privateKey) {
        AppleOAuth2Properties props = new AppleOAuth2Properties();
        props.setClientId("co.kr.coresolution.app.signin");
        props.setTeamId("ABCDEFGHIJ");
        props.setKeyId("KEYIDABCDE");
        props.setPrivateKey(privateKey);
        props.setClientSecretTtlSeconds(3600);
        return props;
    }

    @Test
    @DisplayName("생성된 client_secret 는 ES256 으로 서명되고 EC 공개키로 검증된다")
    void generate_signsWithES256_andVerifiesWithPublicKey() {
        AppleOAuth2Properties props = propertiesWithKey(privateKeyBase64);
        AppleClientSecretGenerator generator = new AppleClientSecretGenerator(props);

        String jwt = generator.generate();
        assertThat(jwt).isNotBlank();

        PublicKey publicKey = keyPair.getPublic();
        Jws<Claims> parsed = Jwts.parserBuilder()
            .setSigningKey(publicKey)
            .build()
            .parseClaimsJws(jwt);

        Claims claims = parsed.getBody();
        assertThat(claims.get("iss", String.class)).isEqualTo("ABCDEFGHIJ");
        assertThat(claims.get("sub", String.class)).isEqualTo("co.kr.coresolution.app.signin");
        assertThat(claims.get("aud", String.class)).isEqualTo("https://appleid.apple.com");
        assertThat(claims.getExpiration()).isAfter(claims.getIssuedAt());
        assertThat(parsed.getHeader().get("kid")).isEqualTo("KEYIDABCDE");
        assertThat(parsed.getHeader().getAlgorithm()).isEqualTo("ES256");
    }

    @Test
    @DisplayName("PEM 헤더/푸터 포함 키도 정규화되어 동일 결과를 만든다")
    void generate_supportsPemHeaderFooter() {
        String pem = "-----BEGIN PRIVATE KEY-----\n"
            + privateKeyBase64 + "\n"
            + "-----END PRIVATE KEY-----";
        AppleClientSecretGenerator generator = new AppleClientSecretGenerator(propertiesWithKey(pem));
        assertThat(generator.generate()).isNotBlank();
    }

    @Test
    @DisplayName("필수 자격증명이 비어 있으면 AppleClientSecretException 을 던진다")
    void generate_throwsWhenCredentialMissing() {
        AppleOAuth2Properties props = propertiesWithKey(privateKeyBase64);
        props.setPrivateKey("");

        AppleClientSecretGenerator generator = new AppleClientSecretGenerator(props);

        assertThatThrownBy(generator::generate)
            .isInstanceOf(AppleClientSecretException.class)
            .hasMessageContaining("APPLE_PRIVATE_KEY");
    }

    @Test
    @DisplayName("private key 가 유효한 PKCS8 가 아니면 예외로 캡슐화한다")
    void generate_throwsWhenPrivateKeyMalformed() {
        AppleOAuth2Properties props = propertiesWithKey("not-a-valid-base64-pkcs8");
        AppleClientSecretGenerator generator = new AppleClientSecretGenerator(props);

        assertThatThrownBy(generator::generate)
            .isInstanceOf(AppleClientSecretException.class)
            .hasMessageContaining("APPLE_PRIVATE_KEY 파싱 실패");
    }
}
