package com.coresolution.core.dto;

import com.coresolution.core.domain.TenantPgConfigurationHistory.ChangeType;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 테넌트 PG 설정 변경 이력 응답 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantPgConfigurationHistoryResponse {
    
    /**
     * 이력 ID
     */
    private Long id;
    
    /**
     * PG 설정 UUID
     */
    private String configId;
    
    /**
     * 변경 유형
     */
    private ChangeType changeType;
    
    /**
     * 변경 전 상태
     */
    private String oldStatus;
    
    /**
     * 변경 후 상태
     */
    private String newStatus;
    
    /**
     * 변경자
     */
    private String changedBy;
    
    /**
     * 변경 시각
     */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime changedAt;
    
    /**
     * 변경 상세 정보 (JSON)
     */
    private String changeDetailsJson;
    
    /**
     * 비고
     */
    private String notes;
}

