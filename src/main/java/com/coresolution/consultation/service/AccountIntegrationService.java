package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.AccountIntegrationRequest;
import com.coresolution.consultation.dto.AccountIntegrationResponse;

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
     * 이메일 인증 코드 발송
     * 
     * @param email 인증할 이메일
     * @return 인증 코드 발송 결과
     */
    boolean sendEmailVerificationCode(String email);
    
    /**
     * 이메일 인증 코드 검증
     * 
     * @param email 이메일
     * @param code 인증 코드
     * @return 인증 성공 여부
     */
    boolean verifyEmailCode(String email, String code);
    
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
