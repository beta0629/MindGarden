package com.coresolution.core.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 역할 권한 응답 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RolePermissionResponse {
    
    /**
     * 권한 ID
     */
    private Long id;
    
    /**
     * 테넌트 역할 ID
     */
    private String tenantRoleId;
    
    /**
     * 권한 코드
     */
    private String permissionCode;
    
    /**
     * 권한 범위
     */
    private String scope;
    
    /**
     * ABAC 정책 (JSON)
     */
    private String policyJson;
    
    /**
     * 부여한 사용자
     */
    private String grantedBy;
    
    /**
     * 부여 일시
     */
    private LocalDateTime grantedAt;
    
    /**
     * 비고
     */
    private String notes;
}

