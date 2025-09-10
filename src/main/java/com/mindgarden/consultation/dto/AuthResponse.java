package com.mindgarden.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 인증 응답 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    
    /**
     * 성공 여부
     */
    private boolean success;
    
    /**
     * 응답 메시지
     */
    private String message;
    
    /**
     * JWT 토큰
     */
    private String token;
    
    /**
     * 리프레시 토큰
     */
    private String refreshToken;
    
    /**
     * 사용자 정보
     */
    private UserDto user;
    
    /**
     * 중복 로그인 확인 필요 여부
     */
    private boolean requiresConfirmation;
    
    /**
     * 응답 타입 (normal, duplicate_login_confirmation)
     */
    private String responseType;
    
    /**
     * 성공 응답 생성
     */
    public static AuthResponse success(String message, String token, String refreshToken, UserDto user) {
        return AuthResponse.builder()
            .success(true)
            .message(message)
            .token(token)
            .refreshToken(refreshToken)
            .user(user)
            .build();
    }
    
    /**
     * 실패 응답 생성
     */
    public static AuthResponse failure(String message) {
        return AuthResponse.builder()
            .success(false)
            .message(message)
            .build();
    }
    
    /**
     * 중복 로그인 확인 요청 응답 생성
     */
    public static AuthResponse duplicateLoginConfirmation(String message) {
        return AuthResponse.builder()
            .success(false)
            .message(message)
            .requiresConfirmation(true)
            .responseType("duplicate_login_confirmation")
            .build();
    }
}
