package com.coresolution.core.dto;

import com.coresolution.core.domain.ErdDiagram;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * ERD 다이어그램 응답 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErdDiagramResponse {
    
    private String diagramId;
    private String tenantId;
    private String name;
    private String description;
    private ErdDiagram.DiagramType diagramType;
    private String moduleType;
    private String mermaidCode;
    private String textErd;
    private Integer version;
    private Boolean isActive;
    private Boolean isPublic;
    private ErdDiagram.TriggerSource triggerSource;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}

