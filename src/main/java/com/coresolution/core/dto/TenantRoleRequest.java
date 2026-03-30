package com.coresolution.core.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 테넌트 역할 생성/수정 요청 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantRoleRequest {
    
    /**
     * 역할명
     */
    private String name;
    
    /**
     * 역할명 (한글)
     */
    private String nameKo;
    
    /**
     * 역할명 (영문)
     */
    private String nameEn;
    
    /**
     * 설명
     */
    private String description;
    
    /**
     * 설명 (한글)
     */
    private String descriptionKo;
    
    /**
     * 설명 (영문)
     */
    private String descriptionEn;
    
    /**
     * 역할 템플릿 ID (템플릿 기반 생성 시)
     */
    private String roleTemplateId;
    
    /**
     * 활성화 여부
     */
    private Boolean isActive;
    
    /**
     * 표시 순서
     */
    private Integer displayOrder;
    
    /**
     * 권한 목록 (커스텀 역할 생성 시)
     */
    private List<PermissionRequest> permissions;
    
    /**
     * 권한 요청 DTO
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PermissionRequest {
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
    }
}

