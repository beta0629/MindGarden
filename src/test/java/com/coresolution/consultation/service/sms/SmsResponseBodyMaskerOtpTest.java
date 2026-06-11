package com.coresolution.consultation.service.sms;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * B4 hotfix — {@link SmsResponseBodyMasker} 6자리 OTP 마스킹 단위 테스트.
 *
 * <p>표준화 v2 Phase 1 B4: NCP SENS·NHN Cloud 등 SMS 게이트웨이 응답이 본문을 echo 할 경우
 * 6자리 숫자(OTP 후보) 가 {@code ******} 로 마스킹되는지 검증.
 *
 * @author MindGarden
 * @since 2026-06-12
 */
@DisplayName("SmsResponseBodyMasker — B4 OTP 6자리 마스킹")
class SmsResponseBodyMaskerOtpTest {

    @Test
    @DisplayName("6자리 숫자(OTP)는 ****** 로 마스킹된다")
    void otpLikeSixDigits_masked() {
        String body = "{\"text\":\"[MindGarden] 인증번호는 654321입니다.\"}";

        String masked = SmsResponseBodyMasker.mask(body);

        assertThat(masked).doesNotContain("654321");
        assertThat(masked).contains("******");
    }

    @Test
    @DisplayName("응답 본문 중간의 다양한 6자리 숫자도 모두 마스킹")
    void multipleOtps_allMasked() {
        String body = "code=123456 또는 다른 시도=000000 / 또 다른=987654";

        String masked = SmsResponseBodyMasker.mask(body);

        assertThat(masked)
            .doesNotContain("123456")
            .doesNotContain("000000")
            .doesNotContain("987654");
    }

    @Test
    @DisplayName("7자리·5자리 숫자는 OTP 패턴 매칭에서 제외 (단어 경계)")
    void otherDigitLengths_notMaskedAsOtp() {
        String body = "code5=12345 code7=1234567";

        String masked = SmsResponseBodyMasker.mask(body);

        assertThat(masked)
            .contains("12345")
            .contains("1234567");
    }

    @Test
    @DisplayName("전화번호 패턴은 PhoneLogMasking 으로 마스킹되며 6자리 패턴과 충돌하지 않음")
    void phoneNumber_maskedAsPhoneNotOtp() {
        String body = "to=01012345678";

        String masked = SmsResponseBodyMasker.mask(body);

        assertThat(masked)
            .as("전화번호는 PhoneLogMasking 규칙으로 마스킹됨")
            .doesNotContain("01012345678");
    }

    @Test
    @DisplayName("null/빈 본문은 빈 문자열 반환")
    void nullOrBlank_returnsEmpty() {
        assertThat(SmsResponseBodyMasker.mask(null)).isEmpty();
        assertThat(SmsResponseBodyMasker.mask("")).isEmpty();
        assertThat(SmsResponseBodyMasker.mask("   ")).isEmpty();
    }

    @Test
    @DisplayName("Solapi maskResponseBody 도 6자리 OTP 마스킹 적용 (SmsResponseBodyMasker 위임)")
    void solapiMaskResponseBody_otpMasked() {
        String body = "{\"text\":\"인증번호 246810\"}";

        String masked = com.coresolution.consultation.service.sms.impl.SolapiSmsProvider.maskResponseBody(body);

        assertThat(masked).doesNotContain("246810");
        assertThat(masked).contains("******");
    }
}
