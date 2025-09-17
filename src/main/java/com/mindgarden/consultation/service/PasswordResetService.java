package com.mindgarden.consultation.service;

/**
 * 비밀번호 재설정 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-17
 */
public interface PasswordResetService {
    
    /**
     * 비밀번호 재설정 이메일 발송
     * 
     * @param email 사용자 이메일
     * @return 성공 여부
     */
    boolean sendPasswordResetEmail(String email);
    
    /**
     * 비밀번호 재설정 토큰 검증
     * 
     * @param token 재설정 토큰
     * @return 토큰 유효성 여부
     */
    boolean validateResetToken(String token);
    
    /**
     * 비밀번호 재설정
     * 
     * @param token 재설정 토큰
     * @param newPassword 새 비밀번호
     * @return 성공 여부
     */
    boolean resetPassword(String token, String newPassword);
    
    /**
     * 만료된 토큰들 정리
     * 
     * @return 정리된 토큰 개수
     */
    int cleanupExpiredTokens();
}
