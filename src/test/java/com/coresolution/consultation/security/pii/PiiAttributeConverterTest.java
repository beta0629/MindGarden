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
    @DisplayName("GCM round-trip — 평문 쓰기·읽기")
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
    @DisplayName("쓰기 fail-closed — crypto 미초기화")
    void write_failClosed() {
        PiiEncryptionContextHolder.setInstanceForTesting(null);
        assertThatThrownBy(() -> converter.convertToDatabaseColumn("010-1111-2222"))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("평문 저장 금지");
    }

    @Test
    @DisplayName("Issue A — 도난 v2 암호문 쓰기는 거부 (패스스루·오라클 차단)")
    void write_rejectsStolenV2Ciphertext() {
        String stolen = crypto.encryptGcm("secret-pii-value");
        assertThat(PiiCipherFormats.looksEncrypted(stolen)).isTrue();

        assertThatThrownBy(() -> converter.convertToDatabaseColumn(stolen))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("암호문 형식");

        // 별도 평문을 정상 암호화한 뒤 1회 복호화해도 도난 blob 의 평문이 나오지 않음
        String otherStored = converter.convertToDatabaseColumn("unrelated-plain");
        assertThat(converter.convertToEntityAttribute(otherStored))
            .isEqualTo("unrelated-plain")
            .isNotEqualTo("secret-pii-value");
    }

    @Test
    @DisplayName("Issue A — 도난 v1 암호문 쓰기도 거부")
    void write_rejectsStolenV1Ciphertext() {
        String stolenV1 = crypto.encryptCbcForLegacyCompat("legacy-secret");
        assertThat(PiiCipherFormats.looksV1(stolenV1)).isTrue();

        assertThatThrownBy(() -> converter.convertToDatabaseColumn(stolenV1))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("암호문 형식");
    }

    @Test
    @DisplayName("Issue B — 복호화 불가 v2 는 원본 마커 유지, flush 시 파괴 대신 예외")
    void read_undecryptableV2_keepsOriginal_flushRejects() {
        PersonalDataEncryptionKeyProvider foreign = newProvider(
            "foreign",
            "foreign-pii-encryption-key-32byt!!",
            "foreign-iv-16byt!");
        foreign.initialize();
        PiiCryptoService foreignCrypto = new PiiCryptoService(foreign);
        String foreignCipher = foreignCrypto.encryptGcm("ops-only-secret");

        String entityValue = converter.convertToEntityAttribute(foreignCipher);
        assertThat(entityValue).isEqualTo(foreignCipher);
        assertThat(PiiCipherFormats.looksEncrypted(entityValue)).isTrue();

        assertThatThrownBy(() -> converter.convertToDatabaseColumn(entityValue))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("암호문 형식");
    }

    @Test
    @DisplayName("Issue B — 복호화 불가 v1 도 원본 마커 유지")
    void read_undecryptableV1_keepsOriginal() {
        PersonalDataEncryptionKeyProvider foreign = newProvider(
            "foreign",
            "foreign-pii-encryption-key-32byt!!",
            "foreign-iv-16byt!");
        foreign.initialize();
        PiiCryptoService foreignCrypto = new PiiCryptoService(foreign);
        String foreignCbc = foreignCrypto.encryptCbcForLegacyCompat("ops-cbc-secret");

        String entityValue = converter.convertToEntityAttribute(foreignCbc);
        assertThat(entityValue).isEqualTo(foreignCbc);
        assertThat(PiiCipherFormats.looksV1(entityValue)).isTrue();
    }

    @Test
    @DisplayName("알 수 없는 keyId 마커는 원본 전체 유지 (페이로드만 반환 금지)")
    void read_unknownKeyId_keepsFullMarker() {
        String unknown = "missing-key:v2::YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY=";
        String entityValue = converter.convertToEntityAttribute(unknown);
        assertThat(entityValue).isEqualTo(unknown);
        assertThat(entityValue).contains(":v2::");
    }

    private PiiCryptoService newCrypto(String activeKeyId) {
        PersonalDataEncryptionKeyProvider provider = newProvider(
            activeKeyId,
            KEY_V2,
            IV_V2);
        ReflectionTestUtils.setField(provider, "keyVersions",
            "v2:" + KEY_V2 + ",v1:" + KEY_V1);
        ReflectionTestUtils.setField(provider, "ivVersions",
            "v2:" + IV_V2 + ",v1:" + IV_V1);
        ReflectionTestUtils.setField(provider, "activeKeyId", activeKeyId);
        provider.initialize();
        return new PiiCryptoService(provider);
    }

    private PersonalDataEncryptionKeyProvider newProvider(String activeKeyId, String key, String iv) {
        PersonalDataEncryptionKeyProvider provider =
            new PersonalDataEncryptionKeyProvider(new MockEnvironment());
        ReflectionTestUtils.setField(provider, "activeKeyId", activeKeyId);
        ReflectionTestUtils.setField(provider, "keyVersions", activeKeyId + ":" + key);
        ReflectionTestUtils.setField(provider, "ivVersions", activeKeyId + ":" + iv);
        ReflectionTestUtils.setField(provider, "legacyKey", "");
        ReflectionTestUtils.setField(provider, "legacyIv", "");
        return provider;
    }
}
