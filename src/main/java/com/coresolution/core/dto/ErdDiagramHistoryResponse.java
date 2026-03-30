package com.coresolution.core.dto;

import com.coresolution.core.domain.ErdDiagramHistory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * ERD 변경 이력 응답 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErdDiagramHistoryResponse {
    
    private Long id;
    private String diagramId;
    private Integer version;
    private ErdDiagramHistory.ChangeType changeType;
    private String changeDescription;
    private String mermaidCode;
    private String diffSummary;
    private String changedBy;
    private LocalDateTime changedAt;
}

