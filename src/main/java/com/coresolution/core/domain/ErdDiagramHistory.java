package com.coresolution.core.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * ERD 다이어그램 변경 이력 엔티티
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Entity
@Table(name = "erd_diagram_history", indexes = {
    @Index(name = "idx_diagram_id", columnList = "diagram_id"),
    @Index(name = "idx_version", columnList = "version"),
    @Index(name = "idx_change_type", columnList = "change_type"),
    @Index(name = "idx_changed_at", columnList = "changed_at"),
    @Index(name = "idx_diagram_version", columnList = "diagram_id,version")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErdDiagramHistory {
    
    /**
     * 변경 타입 열거형
     */
    public enum ChangeType {
        CREATED("생성"),
        UPDATED("수정"),
        DELETED("삭제");
        
        private final String description;
        
        ChangeType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * ERD 다이어그램 UUID
     */
    @Column(name = "diagram_id", length = 36, nullable = false)
    private String diagramId;
    
    /**
     * ERD 버전
     */
    @Column(name = "version", nullable = false)
    private Integer version;
    
    /**
     * 변경 타입
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "change_type", length = 50, nullable = false)
    private ChangeType changeType;
    
    /**
     * 변경 설명
     */
    @Column(name = "change_description", columnDefinition = "TEXT")
    private String changeDescription;
    
    /**
     * 변경된 Mermaid ERD 코드
     */
    @Column(name = "mermaid_code", columnDefinition = "TEXT")
    private String mermaidCode;
    
    /**
     * 변경 사항 요약
     */
    @Column(name = "diff_summary", columnDefinition = "TEXT")
    private String diffSummary;
    
    /**
     * 변경자
     */
    @Column(name = "changed_by", length = 100, nullable = false)
    private String changedBy;
    
    /**
     * 변경 시각
     */
    @Column(name = "changed_at")
    @Builder.Default
    private LocalDateTime changedAt = LocalDateTime.now();
    
    /**
     * ERD 다이어그램 (참조)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diagram_id", referencedColumnName = "diagram_id", insertable = false, updatable = false)
    private ErdDiagram diagram;
}

