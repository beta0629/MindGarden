package com.mindgarden.consultation.service;

import java.util.Map;

/**
 * Passkey 서비스 인터페이스
 * Week 17-18: Passkey 인증 구현
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public interface PasskeyService {
    
    /**
     * Passkey 등록 시작
     * 
     * @param userId 사용자 ID
     * @param deviceName 기기 이름
     * @return 등록 챌린지 및 설정
     */
    Map<String, Object> startRegistration(Long userId, String deviceName);
    
    /**
     * Passkey 등록 완료
     * 
     * @param userId 사용자 ID
     * @param credential WebAuthn Credential
     * @param challenge 챌린지
     * @param deviceName 기기 이름
     * @return 등록 결과
     */
    Map<String, Object> finishRegistration(Long userId, Map<String, Object> credential, String challenge, String deviceName);
    
    /**
     * Passkey 인증 시작
     * 
     * @param email 사용자 이메일
     * @return 인증 챌린지 및 설정
     */
    Map<String, Object> startAuthentication(String email);
    
    /**
     * Passkey 인증 완료
     * 
     * @param email 사용자 이메일
     * @param credential WebAuthn Credential
     * @param challenge 챌린지
     * @return 인증 결과 (JWT 토큰 포함)
     */
    Map<String, Object> finishAuthentication(String email, Map<String, Object> credential, String challenge);
    
    /**
     * 사용자의 Passkey 목록 조회
     * 
     * @param userId 사용자 ID
     * @return Passkey 목록
     */
    Map<String, Object> listPasskeys(Long userId);
    
    /**
     * Passkey 삭제
     * 
     * @param userId 사용자 ID
     * @param passkeyId Passkey ID
     * @return 삭제 결과
     */
    Map<String, Object> deletePasskey(Long userId, Long passkeyId);
}

