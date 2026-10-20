package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.AccountIntegrationRequest;
import com.coresolution.consultation.dto.AccountIntegrationResponse;
import com.coresolution.consultation.dto.EmailVerificationSendOutcome;

/**
 * 계정 통합 서비스 인터페이스
 * SNS 계정과 일반 계정 간의 통합을 담당
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public interface AccountIntegrationService {
    
    /**
     * 이메일 인증을 통한 계정 통합
     * 
     * @param request 계정 통합 요청
     * @return 계정 통합 결과
     */
    AccountIntegrationResponse integrateAccountsByEmail(AccountIntegrationRequest request);

    /**
     * 클라이언트 IP 단위 시도 제한을 함께 적용하는 계정 통합.
     *
     * @param request 계정 통합 요청
     * @param clientIp 요청 IP(null 이면 IP 제한 생략)
     */
    AccountIntegrationResponse integrateAccountsByEmail(AccountIntegrationRequest request, String clientIp);
    
    /**
     * 이메일 인증 코드 발송
     *
     * @param email 인증할 이메일
     * @return 발송 결과({@link com.coresolution.consultation.dto.EmailVerificationSendOutcome.Status}로 구분)
     */
    EmailVerificationSendOutcome sendEmailVerificationCode(String email);

    /**
     * IP 단위 발송 제한을 함께 적용하는 인증 코드 발송. 이메일 가입 여부와 무관하게 같은 결과를 돌려준다.
     *
     * @param email 인증할 이메일
     * @param clientIp 요청 IP(null 이면 IP 제한 생략)
     */
    EmailVerificationSendOutcome sendEmailVerificationCode(String email, String clientIp);
    
    /**
     * 이메일 인증 코드 검증
     * 
     * @param email 이메일
     * @param code 인증 코드
     * @return 인증 성공 여부
     */
    boolean verifyEmailCode(String email, String code);

    /**
     * IP 단위 실패 제한을 함께 적용하는 인증 코드 검증.
     *
     * @param email 이메일
     * @param code 인증 코드
     * @param clientIp 요청 IP(null 이면 IP 제한 생략)
     */
    boolean verifyEmailCode(String email, String code, String clientIp);

    /**
     * 인증 시도 초과로 해당 이메일이 잠겨 있는지 확인한다.
     *
     * @param email 이메일
     */
    boolean isVerificationLocked(String email);
    
    /**
     * 기존 계정과 SNS 계정 연결
     * 
     * @param existingUserId 기존 사용자 ID
     * @param socialUserInfo SNS 사용자 정보
     * @return 연결 성공 여부
     */
    boolean linkSocialAccount(Long existingUserId, String provider, String providerUserId);
    
    /**
     * 계정 통합 상태 확인
     * 
     * @param email 이메일
     * @return 통합 상태 정보
     */
    AccountIntegrationResponse checkIntegrationStatus(String email);
}
