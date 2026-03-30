package com.coresolution.core.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 테넌트 대시보드 요청 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantDashboardRequest {
    
    /**
     * 테넌트 역할 ID
     */
    private String tenantRoleId;
    
    /**
     * 대시보드 이름
     */
    private String dashboardName;
    
    /**
     * 대시보드 이름 (한글)
     */
    private String dashboardNameKo;
    
    /**
     * 대시보드 이름 (영문)
     */
    private String dashboardNameEn;
    
    /**
     * 설명
     */
    private String description;
    
    /**
     * 대시보드 타입
     */
    private String dashboardType;
    
    /**
     * 활성화 여부
     */
    private Boolean isActive;
    
    /**
     * 표시 순서
     */
    private Integer displayOrder;
    
    /**
     * 대시보드 설정 (JSON)
     */
    private String dashboardConfig;
    
    /**
     * 기본 대시보드 여부
     */
    private Boolean isDefault;
}

