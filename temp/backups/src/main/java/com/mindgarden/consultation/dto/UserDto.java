package com.mindgarden.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 사용자 정보 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    
    /**
     * 사용자 ID
     */
    private Long id;
    
    /**
     * 사용자 이메일
     */
    private String email;
    
    /**
     * 사용자 이름
     */
    private String name;
    
    /**
     * 사용자 역할
     */
    private String role;
    
    /**
     * 사용자 등급
     */
    private String grade;
    
    /**
     * 활성 상태
     */
    private Boolean isActive;
    
    /**
     * 이메일 인증 여부
     */
    private Boolean isEmailVerified;
}
