package com.coresolution.consultation.sct.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * SCT 본인확인 SMS OTP 발송 요청.
 *
 * @author MindGarden
 * @since 2026-11-27
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SctIdentityOtpSendRequest {

    /** 입력 휴대폰 번호. */
    private String phone;
}
