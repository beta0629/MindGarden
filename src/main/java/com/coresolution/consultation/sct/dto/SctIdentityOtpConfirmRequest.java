package com.coresolution.consultation.sct.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * SCT 본인확인 SMS OTP 확인 요청.
 *
 * @author MindGarden
 * @since 2026-11-27
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SctIdentityOtpConfirmRequest {

    /** 입력 휴대폰 번호. */
    private String phone;

    /** 인증번호. */
    private String code;
}
