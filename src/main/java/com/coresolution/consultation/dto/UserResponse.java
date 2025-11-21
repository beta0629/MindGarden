package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 사용자 응답 DTO
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-11-20
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    
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
    
    /**
     * 생성 일시
     */
    private LocalDateTime createdAt;
    
    /**
     * 수정 일시
     */
    private LocalDateTime updatedAt;
    
    /**
     * UserDto에서 UserResponse로 변환
     * 
     * @param userDto 기존 UserDto
     * @return UserResponse
     */
    public static UserResponse fromDto(UserDto userDto) {
        if (userDto == null) {
            return null;
        }
        
        return UserResponse.builder()
                .id(userDto.getId())
                .email(userDto.getEmail())
                .name(userDto.getName())
                .role(userDto.getRole())
                .grade(userDto.getGrade())
                .isActive(userDto.getIsActive())
                .isEmailVerified(userDto.getIsEmailVerified())
                .build();
    }
    
    /**
     * User 엔티티에서 UserResponse로 변환
     * 
     * @param user User 엔티티
     * @return UserResponse
     */
    public static UserResponse fromEntity(com.coresolution.consultation.entity.User user) {
        if (user == null) {
            return null;
        }
        
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .grade(user.getGrade())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}

