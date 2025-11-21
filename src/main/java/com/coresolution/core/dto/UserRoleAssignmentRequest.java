package com.coresolution.core.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 사용자 역할 할당 요청 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRoleAssignmentRequest {
    
    /**
     * 테넌트 ID
     */
    private String tenantId;
    
    /**
     * 테넌트 역할 ID
     */
    private String tenantRoleId;
    
    /**
     * 브랜치 ID (선택, NULL = 전체 브랜치)
     */
    private Long branchId;
    
    /**
     * 역할 시작일
     */
    private LocalDate effectiveFrom;
    
    /**
     * 역할 종료일 (NULL = 무기한)
     */
    private LocalDate effectiveTo;
    
    /**
     * 할당 사유
     */
    private String assignmentReason;
}

