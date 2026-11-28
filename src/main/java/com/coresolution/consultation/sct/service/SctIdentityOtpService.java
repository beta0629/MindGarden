package com.coresolution.consultation.sct.service;

import com.coresolution.consultation.sct.dto.SctIdentityOtpConfirmRequest;
import com.coresolution.consultation.sct.dto.SctIdentityOtpSendRequest;
import com.coresolution.consultation.sct.dto.SctIdentityOtpSendResponse;
import com.coresolution.consultation.sct.dto.SctVerifyResponse;

/**
 * SCT 공개 본인확인 SMS OTP.
 *
 * @author MindGarden
 * @since 2026-11-27
 */
public interface SctIdentityOtpService {

    /**
     * OTP 발송(또는 불일치 시 위장 동일 응답).
     *
     * @param rawToken 공개 토큰
     * @param request  휴대폰
     * @param clientIp 클라이언트 IP
     * @return 동일 스키마 응답
     */
    SctIdentityOtpSendResponse sendOtp(
            String rawToken, SctIdentityOtpSendRequest request, String clientIp);

    /**
     * OTP 확인 성공 시에만 verify 세션 발급.
     *
     * @param rawToken 공개 토큰
     * @param request  휴대폰+코드
     * @param clientIp 클라이언트 IP
     * @return 기존 {@link SctVerifyResponse}
     */
    SctVerifyResponse confirmOtp(
            String rawToken, SctIdentityOtpConfirmRequest request, String clientIp);
}
