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
 * {@link PersonalNameAttributeConverter} 단위 테스트.
 *
 * <p>한글 이름 round-trip·NULL 안전·멱등성·다중 키 회전 호환성을 검증한다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-14
 */
@DisplayName("PersonalNameAttributeConverter — PII 이름 컬럼 SSOT")
class PersonalNameAttributeConverterTest {

    private static final String KEY_V1 = "v1-personal-data-key-32-bytes!!!";
    private static final String IV_V1 = "v1-iv-16-bytes!!";
    private static final String KEY_V2 = "v2-personal-data-key-32-bytes!!!";
    private static final String IV_V2 = "v2-iv-16-bytes!!";

    private PersonalNameAttributeConverter converter;
    private PersonalDataEncryptionUtil encryptionUtil;

    @BeforeEach
    void setUp() {
        encryptionUtil = newEncryptionUtilWithActiveKey("v2");
        PersonalDataEncryptionContextHolder.setInstanceForTesting(encryptionUtil);
        converter = new PersonalNameAttributeConverter();
    }

    @AfterEach
    void tearDown() {
        PersonalDataEncryptionContextHolder.setInstanceForTesting(null);
    }

    @Test
    @DisplayName("round-trip: 한글 이름 → DB → 한글 이름")
    void roundTrip_koreanName() {
        String plain = "홍길동";

        String stored = converter.convertToDatabaseColumn(plain);
        String restored = converter.convertToEntityAttribute(stored);

        assertThat(stored).isNotEqualTo(plain);
        assertThat(stored).startsWith("v2::");
        assertThat(restored).isEqualTo(plain);
    }

    @Test
    @DisplayName("round-trip: 영문 이름 → DB → 영문 이름")
    void roundTrip_englishName() {
        String plain = "John Doe";

        String stored = converter.convertToDatabaseColumn(plain);
        String restored = converter.convertToEntityAttribute(stored);

        assertThat(restored).isEqualTo(plain);
    }

    @Test
    @DisplayName("round-trip: 공백·특수문자 포함 이름 보존")
    void roundTrip_nameWithSpecialChars() {
        String plain = "Mary-Jane O'Brien";

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
    @DisplayName("멱등성: 이미 활성 키로 암호화된 이름을 다시 변환해도 동일")
    void idempotent_alreadyEncrypted() {
        String plain = "김철수";
        String first = converter.convertToDatabaseColumn(plain);
        String second = converter.convertToDatabaseColumn(first);

        assertThat(second).isEqualTo(first);
    }

    @Test
    @DisplayName("다중 키 회전: v1 으로 암호화된 이름을 v2 활성 환경에서 정상 복호화")
    void multiKey_decryptLegacyName() {
        PersonalDataEncryptionUtil v1Util = newEncryptionUtilWithActiveKey("v1");
        String legacyCipher = v1Util.encrypt("이영희");
        assertThat(legacyCipher).startsWith("v1::");

        String restored = converter.convertToEntityAttribute(legacyCipher);

        assertThat(restored).isEqualTo("이영희");
    }

    @Test
    @DisplayName("fail-safe: 컨텍스트 미초기화 시 평문 폴백")
    void failSafe_whenHolderNotInitialized() {
        PersonalDataEncryptionContextHolder.setInstanceForTesting(null);

        assertThat(converter.convertToDatabaseColumn("박지성")).isEqualTo("박지성");
        assertThat(converter.convertToEntityAttribute("any")).isEqualTo("any");
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
