package com.mindgarden.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 비밀번호 재설정 요청 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetRequest {
    
    /**
     * 사용자 이메일
     */
    private String email;
    
    /**
     * 재설정 토큰 (선택사항)
     */
    private String resetToken;
    
    /**
     * 새로운 비밀번호
     */
    private String newPassword;
    
    /**
     * 새로운 비밀번호 확인
     */
    private String confirmPassword;
}
