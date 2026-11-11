package com.coresolution.consultation.converter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

/**
 * 홈페이지 문의 이름·전화 컬럼 암호화 컨버터 — 평문과 암호문이 다름을 검증.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
class HomepageInquiryPiiConverterTest {

    @AfterEach
    void clear() {
        PersonalDataEncryptionContextHolder.setInstanceForTesting(null);
    }

    @Test
    void nameAndPhoneConverters_storeCiphertextDifferentFromPlaintext() {
        PersonalDataEncryptionUtil util = mock(PersonalDataEncryptionUtil.class);
        when(util.safeEncrypt("홍길동")).thenReturn("key1::cipher-name");
        when(util.safeEncrypt("01012345678")).thenReturn("key1::cipher-phone");
        when(util.safeDecrypt("key1::cipher-name")).thenReturn("홍길동");
        when(util.safeDecrypt("key1::cipher-phone")).thenReturn("01012345678");
        PersonalDataEncryptionContextHolder.setInstanceForTesting(util);

        PersonalNameAttributeConverter nameConverter = new PersonalNameAttributeConverter();
        PhoneAttributeConverter phoneConverter = new PhoneAttributeConverter();

        String nameCipher = nameConverter.convertToDatabaseColumn("홍길동");
        String phoneCipher = phoneConverter.convertToDatabaseColumn("01012345678");

        assertThat(nameCipher).isEqualTo("key1::cipher-name");
        assertThat(phoneCipher).isEqualTo("key1::cipher-phone");
        assertThat(nameCipher).isNotEqualTo("홍길동");
        assertThat(phoneCipher).isNotEqualTo("01012345678");
        assertThat(nameConverter.convertToEntityAttribute(nameCipher)).isEqualTo("홍길동");
        assertThat(phoneConverter.convertToEntityAttribute(phoneCipher)).isEqualTo("01012345678");
    }
}
