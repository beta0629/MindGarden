package com.coresolution.consultation.dto.auth;

import com.coresolution.consultation.entity.auth.OAuthProvider;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * provider-agnostic OAuth 휴대폰 매칭 흐름 — OTP 검증 요청 본문.
 *
 * <p>{@code POST /api/v1/oauth/phone/verify} 엔드포인트가 받는다.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OAuthPhoneVerifyRequest {

    /** 어떤 OAuth provider 흐름인지 식별 (send 와 동일해야 함). */
    @NotNull(message = "oauthProvider 는 필수입니다.")
    private OAuthProvider oauthProvider;

    /** OAuth 콜백 응답으로 받은 단기 JWT. */
    @NotBlank(message = "phoneVerificationToken 은 필수입니다.")
    @Size(max = 4096)
    private String phoneVerificationToken;

    /** send 응답으로 받은 challenge 토큰. */
    @NotBlank(message = "challengeToken 은 필수입니다.")
    @Size(max = 4096)
    private String challengeToken;

    /** 사용자가 입력한 6자리 OTP. */
    @NotBlank(message = "otpCode 는 필수입니다.")
    @Pattern(regexp = "^\\d{6}$", message = "otpCode 는 6자리 숫자여야 합니다.")
    private String otpCode;
}
