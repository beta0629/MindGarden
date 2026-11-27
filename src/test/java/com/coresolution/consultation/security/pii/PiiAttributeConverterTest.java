package com.coresolution.consultation.security.pii;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.coresolution.consultation.util.PersonalDataEncryptionKeyProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * {@link PiiAttributeConverter} 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-11-27
 */
@DisplayName("PiiAttributeConverter")
class PiiAttributeConverterTest {

    private static final String KEY_V1 = "v1-personal-data-key-32-bytes!!!";
    private static final String IV_V1 = "v1-iv-16-bytes!!";
    private static final String KEY_V2 = "v2-personal-data-key-32-bytes!!!";
    private static final String IV_V2 = "v2-iv-16-bytes!!";

    private PiiAttributeConverter converter;
    private PiiCryptoService crypto;

    @BeforeEach
    void setUp() {
        crypto = newCrypto("v2");
        PiiEncryptionContextHolder.setInstanceForTesting(crypto);
        converter = new PiiAttributeConverter();
    }

    @AfterEach
    void tearDown() {
        PiiEncryptionContextHolder.setInstanceForTesting(null);
    }

    @Test
    @DisplayName("GCM round-trip")
    void roundTrip_gcm() {
        String plain = "010-1234-5678";
        String stored = converter.convertToDatabaseColumn(plain);
        assertThat(stored).startsWith("v2:v2::");
        assertThat(converter.convertToEntityAttribute(stored)).isEqualTo(plain);
    }

    @Test
    @DisplayName("CBC 읽기 호환")
    void read_cbcCompatible() {
        String cbc = crypto.encryptCbcForLegacyCompat("홍길동");
        assertThat(converter.convertToEntityAttribute(cbc)).isEqualTo("홍길동");
    }

    @Test
    @DisplayName("평문 읽기 호환")
    void read_plaintextCompatible() {
        assertThat(converter.convertToEntityAttribute("평문이름")).isEqualTo("평문이름");
    }

    @Test
    @DisplayName("쓰기 fail-closed")
    void write_failClosed() {
        PiiEncryptionContextHolder.setInstanceForTesting(null);
        assertThatThrownBy(() -> converter.convertToDatabaseColumn("010-1111-2222"))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("평문 저장 금지");
    }

    @Test
    @DisplayName("멱등 — 이미 v2 이면 재암호화하지 않음")
    void idempotent_v2() {
        String first = converter.convertToDatabaseColumn("alice@example.com");
        String second = converter.convertToDatabaseColumn(first);
        assertThat(second).isEqualTo(first);
    }

    private PiiCryptoService newCrypto(String activeKeyId) {
        PersonalDataEncryptionKeyProvider provider =
            new PersonalDataEncryptionKeyProvider(new MockEnvironment());
        ReflectionTestUtils.setField(provider, "activeKeyId", activeKeyId);
        ReflectionTestUtils.setField(provider, "keyVersions", "v2:" + KEY_V2 + ",v1:" + KEY_V1);
        ReflectionTestUtils.setField(provider, "ivVersions", "v2:" + IV_V2 + ",v1:" + IV_V1);
        ReflectionTestUtils.setField(provider, "legacyKey", "");
        ReflectionTestUtils.setField(provider, "legacyIv", "");
        provider.initialize();
        return new PiiCryptoService(provider);
    }
}
