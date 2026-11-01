package com.coresolution.consultation.dto.auth;

import lombok.Builder;
import lombok.Value;

/**
 * 휴대폰 비밀번호 찾기 OTP challenge JWT 클레임.
 *
 * <p>{@code POST /api/v1/auth/password-reset/sms/send-otp} 성공 시 발급.
 * verify 시 phone_hash + otp_id 를 묶어 다른 번호로 verify 우회를 차단한다.</p>
 *
 * @author MindGarden
 * @since 2026-11-01
 */
@Value
@Builder
public class PasswordResetOtpChallengeClaims {

    /** 멀티테넌트 격리. */
    String tenantId;

    /** 정규화 phone SHA-256 hex. */
    String phoneHash;

    /** 정규화 휴대폰 digits (서버 서명 JWT 내부). */
    String normalizedPhone;

    /** {@code phone_otp_attempts.id}. */
    Long otpId;
}
