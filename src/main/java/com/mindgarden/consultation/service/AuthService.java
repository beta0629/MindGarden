package com.mindgarden.consultation.service;

import com.mindgarden.consultation.dto.AuthResponse;
import com.mindgarden.consultation.entity.User;

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
     * 세션 기반 로그인 (중복로그인 방지 포함)
     */
    AuthResponse authenticateWithSession(String email, String password, String sessionId, String clientIp, String userAgent);
    
    /**
     * 토큰 갱신
     */
    AuthResponse refreshToken(String refreshToken);
    
    /**
     * 로그아웃
     */
    void logout(String token);
    
    /**
     * 세션 기반 로그아웃 (중복로그인 방지 포함)
     */
    void logoutSession(String sessionId);
    
    /**
     * 비밀번호 재설정 요청
     */
    void forgotPassword(String email);
    
    /**
     * 비밀번호 재설정
     */
    void resetPassword(String token, String newPassword);
    
    /**
     * 중복 로그인 체크
     */
    boolean checkDuplicateLogin(User user);
    
    /**
     * 사용자 세션 정리
     */
    void cleanupUserSessions(User user, String reason);
}
