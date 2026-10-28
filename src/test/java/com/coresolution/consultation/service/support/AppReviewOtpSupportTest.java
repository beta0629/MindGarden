package com.coresolution.consultation.service.support;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.config.AppReviewProperties;
import com.coresolution.consultation.util.PhoneHashUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link AppReviewOtpSupport} — ASC 리뷰 OTP allowlist 판정.
 *
 * @author MindGarden
 * @since 2026-10-28
 */
@DisplayName("AppReviewOtpSupport — allowlist / flag / code")
class AppReviewOtpSupportTest {

    private static final String REVIEW_PHONE = "01012345678";
    private static final String REVIEW_PHONE_E164 = "+82-10-1234-5678";
    private static final String OTHER_PHONE = "01099998888";
    private static final String REVIEW_CODE = "424242";

    private AppReviewProperties properties;
    private AppReviewOtpSupport support;

    @BeforeEach
    void setUp() {
        properties = new AppReviewProperties();
        properties.setAppleOtpBypassEnabled(true);
        properties.setAppleOtpPhones(REVIEW_PHONE + ",01011112222");
        properties.setAppleOtpCode(REVIEW_CODE);
        support = new AppReviewOtpSupport(properties);
    }

    @Test
    @DisplayName("allowlist 전화 + 활성 → resolveOtpCodeForSend 가 고정 코드 반환")
    void resolve_allowlisted_returnsCode() {
        assertThat(support.resolveOtpCodeForSend(REVIEW_PHONE)).isEqualTo(REVIEW_CODE);
        assertThat(support.resolveOtpCodeForSend(REVIEW_PHONE_E164)).isEqualTo(REVIEW_CODE);
    }

    @Test
    @DisplayName("allowlist 밖 전화 → resolve null")
    void resolve_mismatch_returnsNull() {
        assertThat(support.resolveOtpCodeForSend(OTHER_PHONE)).isNull();
        assertThat(support.isAllowlistedPhone(OTHER_PHONE)).isFalse();
    }

    @Test
    @DisplayName("flag off → 바이패스 비활성")
    void flagOff_disabled() {
        properties.setAppleOtpBypassEnabled(false);
        assertThat(support.isConfigured()).isFalse();
        assertThat(support.resolveOtpCodeForSend(REVIEW_PHONE)).isNull();
        assertThat(support.matchesReviewCodeForPhoneHash(
                PhoneHashUtils.sha256Hex(REVIEW_PHONE), REVIEW_CODE)).isFalse();
    }

    @Test
    @DisplayName("code 공백 → 바이패스 비활성 (flag true 여도)")
    void blankCode_disabled() {
        properties.setAppleOtpCode("  ");
        assertThat(support.isConfigured()).isFalse();
        assertThat(support.resolveOtpCodeForSend(REVIEW_PHONE)).isNull();
    }

    @Test
    @DisplayName("verify: phoneHash + 고정 코드 일치 → true")
    void matches_phoneHash_ok() {
        String hash = PhoneHashUtils.sha256Hex(REVIEW_PHONE);
        assertThat(support.matchesReviewCodeForPhoneHash(hash, REVIEW_CODE)).isTrue();
        assertThat(support.matchesReviewCodeForPhoneHash(hash, "000000")).isFalse();
        assertThat(support.matchesReviewCodeForPhoneHash(
                PhoneHashUtils.sha256Hex(OTHER_PHONE), REVIEW_CODE)).isFalse();
    }
}
