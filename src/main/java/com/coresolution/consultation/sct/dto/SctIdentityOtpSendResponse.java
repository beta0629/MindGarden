package com.coresolution.consultation.sct.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * SCT 본인확인 SMS OTP 발송 응답.
 *
 * <p>초대 번호 일치 여부와 무관하게 동일 스키마. 일치 여부·실번호·코드 비노출.</p>
 *
 * @author MindGarden
 * @since 2026-11-27
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SctIdentityOtpSendResponse {

    /** 요청 접수(위장 포함). */
    private boolean accepted;

    /** 마스킹 번호(예: 010-****-5678). */
    private String maskedPhone;

    /** OTP TTL(초). */
    private int expiresInSeconds;

    /** 재발송 쿨다운(초). */
    private int resendCooldownSeconds;
}
