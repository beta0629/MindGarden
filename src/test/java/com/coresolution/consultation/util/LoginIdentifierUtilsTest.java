package com.coresolution.consultation.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.coresolution.consultation.constant.ClientRegistrationConstants;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("LoginIdentifierUtils")
class LoginIdentifierUtilsTest {

    @Test
    void normalizeForPasswordLogin_emailLowercases() {
        assertEquals("a@b.com", LoginIdentifierUtils.normalizeForPasswordLogin("  A@B.COM "));
    }

    @Test
    void normalizeKoreanMobileDigits_domestic() {
        assertEquals("01012345678", LoginIdentifierUtils.normalizeKoreanMobileDigits("010-1234-5678"));
    }

    @Test
    void normalizeKoreanMobileDigits_countryCode82() {
        assertEquals("01012345678", LoginIdentifierUtils.normalizeKoreanMobileDigits("+82 10-1234-5678"));
    }

    @Test
    void isValidKoreanMobileDigits_mobileOnly() {
        String normalized = LoginIdentifierUtils.normalizeKoreanMobileDigits("010-1234-5678");
        assertEquals("01012345678", normalized);
        assertTrue(LoginIdentifierUtils.isValidKoreanMobileDigits(normalized));

        assertTrue(LoginIdentifierUtils.isValidKoreanMobileDigits("01012345678"));
        assertTrue(LoginIdentifierUtils.isValidKoreanMobileDigits("0111234567"));
        assertTrue(LoginIdentifierUtils.isValidKoreanMobileDigits("01612345678"));

        assertFalse(LoginIdentifierUtils.isValidKoreanMobileDigits("0212345678"));
        assertFalse(LoginIdentifierUtils.isValidKoreanMobileDigits("01234567890"));
        assertFalse(LoginIdentifierUtils.isValidKoreanMobileDigits("01512345678"));
        assertFalse(LoginIdentifierUtils.isValidKoreanMobileDigits("03112345678"));
        assertFalse(LoginIdentifierUtils.isValidKoreanMobileDigits(""));
    }

    @Test
    void normalizeAndValidateLoginIdentifier_rejectsEmpty() {
        assertThrows(IllegalArgumentException.class,
            () -> LoginIdentifierUtils.normalizeAndValidateLoginIdentifier("   "));
    }

    @Test
    void normalizeAndValidateLoginIdentifier_rejectsInvalidPhone() {
        assertThrows(IllegalArgumentException.class,
            () -> LoginIdentifierUtils.normalizeAndValidateLoginIdentifier("12345"));
    }

    @Test
    void normalizeAndValidateKoreanMobileForSms_acceptsFormattedDomestic() {
        assertEquals("01012345678",
            LoginIdentifierUtils.normalizeAndValidateKoreanMobileForSms("010-1234-5678"));
    }

    @Test
    void normalizeAndValidateKoreanMobileForSms_rejectsEmpty() {
        assertThrows(IllegalArgumentException.class,
            () -> LoginIdentifierUtils.normalizeAndValidateKoreanMobileForSms("  "));
    }

    @Test
    void normalizeAndValidateKoreanMobileForSms_rejectsLandline() {
        assertThrows(IllegalArgumentException.class,
            () -> LoginIdentifierUtils.normalizeAndValidateKoreanMobileForSms("0212345678"));
    }

    @Test
    @DisplayName("normalizeAndValidateKoreanMobileForSms: +82 국제 형식 정규화 성공")
    void normalizeAndValidateKoreanMobileForSms_acceptsCountryCode82() {
        assertEquals("01012345678",
            LoginIdentifierUtils.normalizeAndValidateKoreanMobileForSms("+82 10-1234-5678"));
    }

    @Test
    @DisplayName("normalizeAndValidateKoreanMobileForSms: null이면 전화 입력 요청 예외")
    void normalizeAndValidateKoreanMobileForSms_rejectsNull() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
            () -> LoginIdentifierUtils.normalizeAndValidateKoreanMobileForSms(null));
        assertEquals("전화번호를 입력해주세요.", ex.getMessage());
    }

    @Test
    @DisplayName("normalizeAndValidateKoreanMobileForSms: 휴대폰 형식 아니면 MSG_INVALID_PHONE")
    void normalizeAndValidateKoreanMobileForSms_invalidUsesClientConstantMessage() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
            () -> LoginIdentifierUtils.normalizeAndValidateKoreanMobileForSms("12345"));
        assertEquals(ClientRegistrationConstants.MSG_INVALID_PHONE, ex.getMessage());
    }

    @Test
    @DisplayName("normalizeAndValidateKoreanMobileForSms: 011 등 구형 이동통신 번호 허용")
    void normalizeAndValidateKoreanMobileForSms_accepts011() {
        assertEquals("0112345678",
            LoginIdentifierUtils.normalizeAndValidateKoreanMobileForSms("011-234-5678"));
    }
}
