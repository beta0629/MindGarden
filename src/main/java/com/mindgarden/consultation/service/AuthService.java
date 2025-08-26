package com.mindgarden.consultation.service;

import com.mindgarden.consultation.dto.AuthResponse;

/**
 * 인증 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public interface AuthService {
    
    /**
     * 사용자 인증 (로그인)
     */
    AuthResponse authenticate(String email, String password);
    
    /**
     * 토큰 갱신
     */
    AuthResponse refreshToken(String refreshToken);
    
    /**
     * 로그아웃
     */
    void logout(String token);
    
    /**
     * 비밀번호 재설정 요청
     */
    void forgotPassword(String email);
    
    /**
     * 비밀번호 재설정
     */
    void resetPassword(String token, String newPassword);
}
