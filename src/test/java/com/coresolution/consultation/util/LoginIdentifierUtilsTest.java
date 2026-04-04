package com.coresolution.consultation.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

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
}
