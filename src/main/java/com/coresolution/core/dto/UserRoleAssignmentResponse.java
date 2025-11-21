package com.coresolution.core.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 사용자 역할 할당 응답 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRoleAssignmentResponse {
    
    /**
     * 할당 ID
     */
    private String assignmentId;
    
    /**
     * 사용자 ID
     */
    private Long userId;
    
    /**
     * 테넌트 ID
     */
    private String tenantId;
    
    /**
     * 테넌트 역할 ID
     */
    private String tenantRoleId;
    
    /**
     * 역할명
     */
    private String roleName;
    
    /**
     * 역할명 (한글)
     */
    private String roleNameKo;
    
    /**
     * 템플릿 코드
     */
    private String templateCode;
    
    /**
     * 브랜치 ID
     */
    private Long branchId;
    
    /**
     * 브랜치명
     */
    private String branchName;
    
    /**
     * 역할 시작일
     */
    private LocalDate effectiveFrom;
    
    /**
     * 역할 종료일
     */
    private LocalDate effectiveTo;
    
    /**
     * 활성 여부
     */
    private Boolean isActive;
    
    /**
     * 현재 유효한 할당인지 여부
     */
    private Boolean isCurrentlyEffective;
}

