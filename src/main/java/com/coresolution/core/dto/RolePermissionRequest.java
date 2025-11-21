package com.coresolution.core.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 역할 권한 요청 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RolePermissionRequest {
    
    /**
     * 권한 코드
     */
    private String permissionCode;
    
    /**
     * 권한 범위 (SELF, BRANCH, TENANT, ALL)
     */
    private String scope;
    
    /**
     * ABAC 정책 (JSON)
     */
    private String policyJson;
    
    /**
     * 비고
     */
    private String notes;
}

