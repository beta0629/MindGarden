package com.coresolution.core.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * PG 설정 승인 요청 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PgConfigurationApproveRequest {
    
    /**
     * 승인자
     */
    @NotBlank(message = "승인자는 필수입니다")
    private String approvedBy;
    
    /**
     * 승인 노트 (선택)
     */
    private String approvalNote;
    
    /**
     * 승인 전 연결 테스트 여부
     */
    @Builder.Default
    private Boolean testConnection = true;
}

