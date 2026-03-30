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
     * 테넌트 ID (필수 - 보안상 중요)
     */
    private String tenantId;
    
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
                .tenantId(null) // UserDto는 deprecated이며 tenantId 필드가 없음
                .isActive(userDto.getIsActive())
                .isEmailVerified(userDto.getIsEmailVerified())
                .build();
    }
    
    /**
     * User 엔티티에서 UserResponse로 변환 (표준 메서드)
     * 
     * DTO_NAMING_STANDARD.md 표준 준수
     * 
     * @param user User 엔티티
     * @return UserResponse
     */
    public static UserResponse from(com.coresolution.consultation.entity.User user) {
        if (user == null) {
            return null;
        }
        
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .grade(user.getGrade())
                .tenantId(user.getTenantId()) // 필수 - 보안상 중요 (SECURITY_STANDARD.md, SESSION_STANDARD.md)
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
    
    /**
     * User 엔티티에서 UserResponse로 변환 (하위 호환성)
     * 
     * @deprecated Use {@link #from(com.coresolution.consultation.entity.User)} instead
     * @param user User 엔티티
     * @return UserResponse
     */
    @Deprecated
    public static UserResponse fromEntity(com.coresolution.consultation.entity.User user) {
        return from(user);
    }
    
    /**
     * User 엔티티 List에서 UserResponse List로 변환
     * 
     * DTO_NAMING_STANDARD.md 표준 준수
     * 
     * @param users User 엔티티 목록
     * @return UserResponse 목록
     */
    public static java.util.List<UserResponse> fromList(java.util.List<com.coresolution.consultation.entity.User> users) {
        if (users == null || users.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        
        return users.stream()
                .map(UserResponse::from)
                .collect(java.util.stream.Collectors.toList());
    }
}

