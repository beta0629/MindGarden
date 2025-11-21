package com.coresolution.core.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 테넌트 역할 응답 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantRoleResponse {
    
    /**
     * 테넌트 역할 ID
     */
    private String tenantRoleId;
    
    /**
     * 테넌트 ID
     */
    private String tenantId;
    
    /**
     * 역할 템플릿 ID
     */
    private String roleTemplateId;
    
    /**
     * 템플릿 코드 (템플릿 기반인 경우)
     */
    private String templateCode;
    
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
     * 활성화 여부
     */
    private Boolean isActive;
    
    /**
     * 표시 순서
     */
    private Integer displayOrder;
    
    /**
     * 사용자 수 (할당된 사용자 수)
     */
    private Long userCount;
    
    /**
     * 권한 목록
     */
    private List<PermissionResponse> permissions;
    
    /**
     * 권한 응답 DTO
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PermissionResponse {
        /**
         * 권한 ID
         */
        private Long id;
        
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
    }
}

