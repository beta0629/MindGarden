package com.coresolution.core.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * ERD 테이블 매핑 엔티티
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Entity
@Table(name = "erd_table_mappings", indexes = {
    @Index(name = "idx_diagram_id", columnList = "diagram_id"),
    @Index(name = "idx_table_name", columnList = "table_name"),
    @Index(name = "unique_diagram_table", columnList = "diagram_id,table_name", unique = true)
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErdTableMapping {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * ERD 다이어그램 UUID
     */
    @Column(name = "diagram_id", length = 36, nullable = false)
    private String diagramId;
    
    /**
     * 테이블명
     */
    @Column(name = "table_name", length = 255, nullable = false)
    private String tableName;
    
    /**
     * 표시명
     */
    @Column(name = "display_name", length = 255)
    private String displayName;
    
    /**
     * ERD에서 X 위치
     */
    @Column(name = "position_x")
    private Integer positionX;
    
    /**
     * ERD에서 Y 위치
     */
    @Column(name = "position_y")
    private Integer positionY;
    
    /**
     * 표시 여부
     */
    @Column(name = "is_visible")
    @Builder.Default
    private Boolean isVisible = true;
    
    /**
     * 생성 시각
     */
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    /**
     * ERD 다이어그램 (참조)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diagram_id", referencedColumnName = "diagram_id", insertable = false, updatable = false)
    private ErdDiagram diagram;
}

