package com.mindgarden.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 회원가입 요청 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    
    /**
     * 사용자 이메일
     */
    private String email;
    
    /**
     * 사용자 비밀번호
     */
    private String password;
    
    /**
     * 사용자 이름
     */
    private String name;
    
    /**
     * 사용자 전화번호
     */
    private String phone;
    
    /**
     * 사용자 역할 (CLIENT, CONSULTANT, ADMIN)
     */
    private String role;
}
