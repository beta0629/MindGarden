package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.auth.PasswordResetSmsResponse;

/**
 * 휴대폰 번호 기반 비밀번호 찾기(SMS OTP → 임시 비밀번호) 서비스.
 *
 * <p>이메일 재설정({@link PasswordResetService})과 분리된 SMS 하위 경로.
 * 번호 존재 여부·SNS 여부는 응답/타이밍으로 노출하지 않는다.</p>
 *
 * @author MindGarden
 * @since 2026-11-01
 */
public interface PasswordResetSmsService {

    /**
     * OTP SMS 발송(또는 비적격 시 동일 성공 위장).
     *
     * @param phone 사용자 입력 휴대폰
     * @param clientIp 클라이언트 IP(레이트리밋)
     * @return 성공 위장 또는 형식/한도 실패
     */
    PasswordResetSmsResponse sendOtp(String phone, String clientIp);

    /**
     * OTP 검증 후 1회용 resetProofToken 발급.
     *
     * @param phone 휴대폰
     * @param verificationCode 인증번호
     * @param challengeToken send-otp 에서 받은 challenge
     * @param clientIp 클라이언트 IP
     * @return 성공 시 proof, 만료·시도초과 등은 명시 실패
     */
    PasswordResetSmsResponse verifyOtp(String phone, String verificationCode,
            String challengeToken, String clientIp);

    /**
     * proof 검증 후 임시 비밀번호 SMS 발송.
     *
     * <p>SNS/미존재는 발급 스킵하되 동일 성공 메시지. 평문 비번은 응답·로그에 넣지 않는다.</p>
     *
     * @param resetProofToken verify-otp 에서 받은 proof
     * @param clientIp 클라이언트 IP
     * @return 항상 동일 성공 스키마(위조·만료 proof 만 실패 가능)
     */
    PasswordResetSmsResponse sendTempPassword(String resetProofToken, String clientIp);
}
