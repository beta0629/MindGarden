package com.coresolution.consultation.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Apple SIWA 휴대폰 매칭 흐름 — OTP 발송 요청 본문.
 *
 * @author MindGarden
 * @since 2026-06-08
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplePhoneSendRequest {

    /** {@code POST /api/v1/auth/oauth/apple/login} 응답으로 받은 단기 JWT. apple_sub 인증 직후 발급. */
    @NotBlank(message = "phoneVerificationToken 은 필수입니다.")
    @Size(max = 4096)
    private String phoneVerificationToken;

    /** 한국 휴대폰 번호. 정규화 후 SHA-256 hex 만 저장. */
    @NotBlank(message = "phoneNumber 는 필수입니다.")
    @Size(max = 32)
    private String phoneNumber;
}
