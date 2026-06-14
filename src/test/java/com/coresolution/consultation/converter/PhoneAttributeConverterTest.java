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
 * {@link PhoneAttributeConverter} 단위 테스트.
 *
 * <p>전화번호 포맷별 round-trip·NULL/빈문자 안전·멱등성·키 회전 호환성을 검증한다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-14
 */
@DisplayName("PhoneAttributeConverter — PII 전화번호 컬럼 SSOT")
class PhoneAttributeConverterTest {

    private static final String KEY_V1 = "v1-personal-data-key-32-bytes!!!";
    private static final String IV_V1 = "v1-iv-16-bytes!!";
    private static final String KEY_V2 = "v2-personal-data-key-32-bytes!!!";
    private static final String IV_V2 = "v2-iv-16-bytes!!";

    private PhoneAttributeConverter converter;
    private PersonalDataEncryptionUtil encryptionUtil;

    @BeforeEach
    void setUp() {
        encryptionUtil = newEncryptionUtilWithActiveKey("v2");
        PersonalDataEncryptionContextHolder.setInstanceForTesting(encryptionUtil);
        converter = new PhoneAttributeConverter();
    }

    @AfterEach
    void tearDown() {
        PersonalDataEncryptionContextHolder.setInstanceForTesting(null);
    }

    @Test
    @DisplayName("round-trip: 휴대폰 010-1234-5678 (대시 포함)")
    void roundTrip_mobileWithDash() {
        String plain = "010-1234-5678";

        String stored = converter.convertToDatabaseColumn(plain);
        String restored = converter.convertToEntityAttribute(stored);

        assertThat(stored).isNotEqualTo(plain);
        assertThat(stored).startsWith("v2::");
        assertThat(restored).isEqualTo(plain);
    }

    @Test
    @DisplayName("round-trip: 휴대폰 01012345678 (대시 없음)")
    void roundTrip_mobileDigitsOnly() {
        String plain = "01012345678";

        String stored = converter.convertToDatabaseColumn(plain);
        String restored = converter.convertToEntityAttribute(stored);

        assertThat(restored).isEqualTo(plain);
    }

    @Test
    @DisplayName("round-trip: 일반 전화 02-123-4567")
    void roundTrip_landline() {
        String plain = "02-123-4567";

        String stored = converter.convertToDatabaseColumn(plain);
        String restored = converter.convertToEntityAttribute(stored);

        assertThat(restored).isEqualTo(plain);
    }

    @Test
    @DisplayName("round-trip: 국제 전화 +82-10-1234-5678")
    void roundTrip_international() {
        String plain = "+82-10-1234-5678";

        String stored = converter.convertToDatabaseColumn(plain);
        String restored = converter.convertToEntityAttribute(stored);

        assertThat(restored).isEqualTo(plain);
    }

    @Test
    @DisplayName("NULL 입력: 양방향 모두 NULL 반환")
    void nullInput_returnsNull() {
        assertThat(converter.convertToDatabaseColumn(null)).isNull();
        assertThat(converter.convertToEntityAttribute(null)).isNull();
    }

    @Test
    @DisplayName("멱등성: 이미 활성 키로 암호화된 전화번호를 다시 변환해도 동일")
    void idempotent_alreadyEncrypted() {
        String plain = "010-9999-0000";
        String first = converter.convertToDatabaseColumn(plain);
        String second = converter.convertToDatabaseColumn(first);

        assertThat(second).isEqualTo(first);
    }

    @Test
    @DisplayName("다중 키 회전: v1 으로 암호화된 전화번호를 v2 활성 환경에서 정상 복호화")
    void multiKey_decryptLegacyPhone() {
        PersonalDataEncryptionUtil v1Util = newEncryptionUtilWithActiveKey("v1");
        String legacyCipher = v1Util.encrypt("010-5555-6666");
        assertThat(legacyCipher).startsWith("v1::");

        String restored = converter.convertToEntityAttribute(legacyCipher);

        assertThat(restored).isEqualTo("010-5555-6666");
    }

    @Test
    @DisplayName("fail-safe: 컨텍스트 미초기화 시 평문 폴백")
    void failSafe_whenHolderNotInitialized() {
        PersonalDataEncryptionContextHolder.setInstanceForTesting(null);

        assertThat(converter.convertToDatabaseColumn("010-1111-2222"))
                .isEqualTo("010-1111-2222");
        assertThat(converter.convertToEntityAttribute("v2::garbled"))
                .isEqualTo("v2::garbled");
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
