package com.mindgarden.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 비밀번호 변경 요청 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordChangeRequest {
    
    /**
     * 현재 비밀번호
     */
    private String currentPassword;
    
    /**
     * 새로운 비밀번호
     */
    private String newPassword;
    
    /**
     * 새로운 비밀번호 확인
     */
    private String confirmPassword;
}
