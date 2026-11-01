package com.coresolution.consultation.dto.auth;

import lombok.Builder;
import lombok.Value;

/**
 * 휴대폰 비밀번호 찾기 SMS API 공통 응답.
 *
 * <p>존재 여부 비노출을 위해 성공 스키마는 동일하게 유지한다.
 * 실패(만료·시도초과·형식오류 등)만 {@code success=false}.</p>
 *
 * @author MindGarden
 * @since 2026-11-01
 */
@Value
@Builder
public class PasswordResetSmsResponse {

    boolean success;

    String message;

    /** 실패 코드(쿨다운·한도·만료 등). 성공 시 null. */
    String code;

    String challengeToken;

    String resetProofToken;

    String maskedPhone;

    Long expiresInSeconds;

    Long resendCooldownSeconds;

    Long retryAfterSeconds;
}
