package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

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
     * @deprecated Use userResponse instead. This field will be removed in version 2.0.0
     */
    @Deprecated
    private UserDto user;
    
    /**
     * 사용자 정보 (표준화된 DTO)
     */
    private UserResponse userResponse;
    
    /**
     * 중복 로그인 확인 필요 여부
     */
    private boolean requiresConfirmation;
    
    /**
     * 응답 타입 (normal, duplicate_login_confirmation, tenant_selection_required)
     */
    private String responseType;
    
    /**
     * 멀티 테넌트 사용자 여부
     */
    private boolean isMultiTenant;
    
    /**
     * 테넌트 선택 필요 여부
     */
    private boolean requiresTenantSelection;
    
    /**
     * 접근 가능한 테넌트 목록 (멀티 테넌트 사용자인 경우)
     */
    private List<TenantInfo> accessibleTenants;
    
    /**
     * 테넌트 정보 DTO
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TenantInfo {
        private String tenantId;
        private String tenantName;
        private String businessType;
        private String status;
        private String role; // 해당 테넌트에서의 사용자 역할 (레거시 호환)
        
        // 새로운 역할 시스템 정보
        private TenantRoleInfo tenantRole; // 테넌트별 역할 정보
    }
    
    /**
     * 테넌트 역할 정보 DTO
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TenantRoleInfo {
        private String tenantRoleId;
        private String roleName;
        private String roleNameKo;
        private String templateCode;
        private Long branchId;
        private String branchName;
    }
    
    /**
     * 현재 테넌트의 역할 정보 (단일 테넌트 사용자 또는 테넌트 선택 후)
     */
    private TenantRoleInfo currentTenantRole;
    
    /**
     * 성공 응답 생성
     * @deprecated Use success(String, String, String, UserResponse) instead
     */
    @Deprecated
    public static AuthResponse success(String message, String token, String refreshToken, UserDto user) {
        return AuthResponse.builder()
            .success(true)
            .message(message)
            .token(token)
            .refreshToken(refreshToken)
            .user(user)
            .userResponse(user != null ? UserResponse.fromDto(user) : null)
            .build();
    }
    
    /**
     * 성공 응답 생성 (표준화된 DTO 사용)
     */
    public static AuthResponse success(String message, String token, String refreshToken, UserResponse userResponse) {
        // 하위 호환성을 위해 UserDto도 함께 설정
        UserDto userDto = null;
        if (userResponse != null) {
            userDto = UserDto.builder()
                .id(userResponse.getId())
                .email(userResponse.getEmail())
                .name(userResponse.getName())
                .role(userResponse.getRole())
                .grade(userResponse.getGrade())
                .isActive(userResponse.getIsActive())
                .isEmailVerified(userResponse.getIsEmailVerified())
                .build();
        }
        
        return AuthResponse.builder()
            .success(true)
            .message(message)
            .token(token)
            .refreshToken(refreshToken)
            .userResponse(userResponse)
            .user(userDto) // 하위 호환성
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
