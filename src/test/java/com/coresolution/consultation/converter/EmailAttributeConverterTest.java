package com.coresolution.consultation.converter;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.util.PersonalDataEncryptionKeyProvider;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * {@link EmailAttributeConverter} 단위 테스트.
 *
 * <p>PII 이메일 컬럼용 AttributeConverter 의 핵심 계약을 검증한다.
 * <ul>
 *   <li>round-trip: 평문 → DB 컬럼 → 평문 동일성</li>
 *   <li>NULL/빈문자 안전 처리</li>
 *   <li>멱등성 — 서비스 레이어가 수동 {@code safeEncrypt} 후 entity 에 set 한 값을
 *       converter 가 다시 받아도 이중 암호화하지 않는다</li>
 *   <li>다중 키 회전 — 이전 키로 암호화된 데이터 복호화 호환</li>
 *   <li>fail-safe — Spring 컨테이너 미초기화 시 평문 그대로 반환</li>
 * </ul>
 * </p>
 *
 * @author CoreSolution
 * @since 2026-06-14
 */
@DisplayName("EmailAttributeConverter — PII 이메일 컬럼 SSOT")
class EmailAttributeConverterTest {

    private static final String KEY_V1 = "v1-personal-data-key-32-bytes!!!";
    private static final String IV_V1 = "v1-iv-16-bytes!!";
    private static final String KEY_V2 = "v2-personal-data-key-32-bytes!!!";
    private static final String IV_V2 = "v2-iv-16-bytes!!";

    private EmailAttributeConverter converter;
    private PersonalDataEncryptionUtil encryptionUtil;

    @BeforeEach
    void setUp() {
        encryptionUtil = newEncryptionUtilWithActiveKey("v2");
        PersonalDataEncryptionContextHolder.setInstanceForTesting(encryptionUtil);
        converter = new EmailAttributeConverter();
    }

    @AfterEach
    void tearDown() {
        PersonalDataEncryptionContextHolder.setInstanceForTesting(null);
    }

    @Test
    @DisplayName("round-trip: 평문 → DB → 평문 (동일성 보장)")
    void roundTrip_preservesPlaintext() {
        String plain = "alice@example.com";

        String stored = converter.convertToDatabaseColumn(plain);
        String restored = converter.convertToEntityAttribute(stored);

        assertThat(stored).isNotEqualTo(plain);
        assertThat(stored).startsWith("v2::");
        assertThat(restored).isEqualTo(plain);
    }

    @Test
    @DisplayName("NULL 입력: 양방향 모두 NULL 반환")
    void nullInput_returnsNull() {
        assertThat(converter.convertToDatabaseColumn(null)).isNull();
        assertThat(converter.convertToEntityAttribute(null)).isNull();
    }

    @Test
    @DisplayName("빈 문자열 입력: 양방향 모두 입력 그대로 반환 (safeEncrypt/safeDecrypt 정책)")
    void emptyInput_returnsInputAsIs() {
        assertThat(converter.convertToDatabaseColumn("")).isEmpty();
        assertThat(converter.convertToDatabaseColumn("   ")).isEqualTo("   ");
        assertThat(converter.convertToEntityAttribute("")).isEmpty();
    }

    @Test
    @DisplayName("멱등성: 이미 활성 키로 암호화된 값을 다시 convertToDatabaseColumn 해도 동일 (이중 암호화 차단)")
    void idempotent_alreadyEncryptedWithActiveKey() {
        String plain = "bob@example.com";
        String firstPass = converter.convertToDatabaseColumn(plain);

        String secondPass = converter.convertToDatabaseColumn(firstPass);

        assertThat(secondPass).isEqualTo(firstPass);
    }

    @Test
    @DisplayName("멱등성: 평문(복호화된 값)을 다시 convertToEntityAttribute 해도 동일")
    void idempotent_plaintextDecrypt() {
        String plain = "carol@example.com";

        String passThrough = converter.convertToEntityAttribute(plain);

        assertThat(passThrough).isEqualTo(plain);
    }

    @Test
    @DisplayName("다중 키 회전: v1 키로 암호화된 값을 v2 활성 환경에서 정상 복호화")
    void multiKey_decryptLegacyVersion() {
        PersonalDataEncryptionUtil v1Util = newEncryptionUtilWithActiveKey("v1");
        String legacyCipher = v1Util.encrypt("dave@example.com");
        assertThat(legacyCipher).startsWith("v1::");

        String restored = converter.convertToEntityAttribute(legacyCipher);

        assertThat(restored).isEqualTo("dave@example.com");
    }

    @Test
    @DisplayName("키 회전 시 ensureActiveKeyEncryption: v1 으로 암호화된 값이 v2 로 재암호화된다")
    void keyRotation_reEncryptsToActiveKey() {
        PersonalDataEncryptionUtil v1Util = newEncryptionUtilWithActiveKey("v1");
        String legacyCipher = v1Util.encrypt("erin@example.com");

        String reEncrypted = converter.convertToDatabaseColumn(legacyCipher);

        assertThat(reEncrypted).startsWith("v2::");
        assertThat(converter.convertToEntityAttribute(reEncrypted)).isEqualTo("erin@example.com");
    }

    @Test
    @DisplayName("fail-safe: Spring 컨테이너 미초기화 시 평문 입력을 그대로 반환")
    void failSafe_whenHolderNotInitialized() {
        PersonalDataEncryptionContextHolder.setInstanceForTesting(null);

        assertThat(converter.convertToDatabaseColumn("frank@example.com"))
                .isEqualTo("frank@example.com");
        assertThat(converter.convertToEntityAttribute("v2::garbled"))
                .isEqualTo("v2::garbled");
    }

    @Test
    @DisplayName("유니코드 이메일(국제화 도메인 + 한글 로컬): round-trip 동일성")
    void unicodeRoundTrip() {
        String plain = "고객@example.한국";

        String stored = converter.convertToDatabaseColumn(plain);
        String restored = converter.convertToEntityAttribute(stored);

        assertThat(restored).isEqualTo(plain);
    }

    private PersonalDataEncryptionUtil newEncryptionUtilWithActiveKey(String activeKeyId) {
        PersonalDataEncryptionKeyProvider provider = new PersonalDataEncryptionKeyProvider(new MockEnvironment());
        ReflectionTestUtils.setField(provider, "activeKeyId", activeKeyId);
        ReflectionTestUtils.setField(provider, "keyVersions", "v2:" + KEY_V2 + ",v1:" + KEY_V1);
        ReflectionTestUtils.setField(provider, "ivVersions", "v2:" + IV_V2 + ",v1:" + IV_V1);
        ReflectionTestUtils.setField(provider, "legacyKey", "");
        ReflectionTestUtils.setField(provider, "legacyIv", "");
        provider.initialize();

        return new PersonalDataEncryptionUtil(provider);
    }
}
