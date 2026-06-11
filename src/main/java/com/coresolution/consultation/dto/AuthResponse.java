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
     * 비밀번호 변경 필요 여부 (임시 비밀번호로 로그인한 경우)
     */
    private boolean requiresPasswordChange;

    /**
     * 일반 로그인(전화 + 비밀번호) 다중 매치 — P1 silent first 차단 분기.
     *
     * <p>{@code true} 인 경우 {@link #candidates} 와 {@link #selectionToken} 이 함께 채워지며 FE 는 계정
     * 선택 모달/화면을 노출한 뒤 {@code POST /api/v1/auth/select-account} 로 선택 완료를 요청한다.</p>
     *
     * @since 2026-06-11
     */
    private boolean multipleAccounts;

    /**
     * 다중 매치 시 노출할 후보 목록(본인 식별 최소 정보).
     *
     * <p>전화 + 비밀번호 검증을 모두 통과한 사용자만 포함된다(timing attack 방어).
     * {@link #multipleAccounts} 가 false 일 때는 항상 null.</p>
     *
     * @since 2026-06-11
     */
    private List<AccountCandidate> candidates;

    /**
     * 다중 매치 계정 선택용 단기 JWT.
     *
     * <p>{@code POST /api/v1/auth/select-account} 호출 시 본 토큰과 사용자가 선택한 {@code userId}
     * 를 함께 전송한다. 5분 TTL · 1회 사용.</p>
     *
     * @since 2026-06-11
     */
    private String selectionToken;

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
        /**
         * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨
         */
        @Deprecated        private Long branchId;
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
                .tenantId(userResponse.getTenantId()) // 필수 - 보안상 중요 (SECURITY_STANDARD.md, SESSION_STANDARD.md)
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
