package com.coresolution.consultation.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Apple SIWA 휴대폰 매칭 흐름 — OTP 검증 요청 본문.
 *
 * @author MindGarden
 * @since 2026-06-08
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplePhoneVerifyRequest {

    /** {@code POST /api/v1/auth/oauth/apple/login} 응답으로 받은 단기 JWT. */
    @NotBlank(message = "phoneVerificationToken 은 필수입니다.")
    @Size(max = 4096)
    private String phoneVerificationToken;

    /** {@code POST /api/v1/auth/oauth/apple/phone/send} 응답으로 받은 challenge 토큰. */
    @NotBlank(message = "otpChallengeToken 은 필수입니다.")
    @Size(max = 4096)
    private String otpChallengeToken;

    /** 사용자가 입력한 6자리 OTP. */
    @NotBlank(message = "code 는 필수입니다.")
    @Pattern(regexp = "^\\d{6}$", message = "code 는 6자리 숫자여야 합니다.")
    private String code;
}
