package com.coresolution.core.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * PG 설정 거부 요청 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PgConfigurationRejectRequest {
    
    /**
     * 거부자
     */
    @NotBlank(message = "거부자는 필수입니다")
    private String rejectedBy;
    
    /**
     * 거부 사유 (필수)
     */
    @NotBlank(message = "거부 사유는 필수입니다")
    private String rejectionReason;
}

