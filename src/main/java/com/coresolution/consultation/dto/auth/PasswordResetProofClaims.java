package com.coresolution.consultation.dto.auth;

import lombok.Builder;
import lombok.Value;

/**
 * 휴대폰 비밀번호 찾기 — OTP 검증 후 임시 비밀번호 발송용 1회용 proof JWT 클레임.
 *
 * <p>{@code POST /api/v1/auth/password-reset/sms/verify-otp} 성공 시 발급.
 * {@code send-temp-password} 에서 소비하며, DB row 를 {@code CONSUMED} 로 바꿔 재사용을 막는다.</p>
 *
 * @author MindGarden
 * @since 2026-11-01
 */
@Value
@Builder
public class PasswordResetProofClaims {

    /** 멀티테넌트 격리. */
    String tenantId;

    /** 정규화 phone SHA-256 hex. */
    String phoneHash;

    /** 정규화 휴대폰 digits. */
    String normalizedPhone;

    /** 검증에 사용된 {@code phone_otp_attempts.id}. */
    Long otpId;
}
