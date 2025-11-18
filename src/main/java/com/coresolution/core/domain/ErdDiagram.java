package com.coresolution.core.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * ERD 다이어그램 엔티티
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Entity
@Table(name = "erd_diagrams", indexes = {
    @Index(name = "idx_diagram_id", columnList = "diagram_id"),
    @Index(name = "idx_tenant_id", columnList = "tenant_id"),
    @Index(name = "idx_diagram_type", columnList = "diagram_type"),
    @Index(name = "idx_module_type", columnList = "module_type"),
    @Index(name = "idx_is_active", columnList = "is_active"),
    @Index(name = "idx_is_public", columnList = "is_public"),
    @Index(name = "idx_trigger_source", columnList = "trigger_source")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErdDiagram {
    
    /**
     * ERD 타입 열거형
     */
    public enum DiagramType {
        FULL("전체 시스템 ERD"),
        MODULE("모듈별 ERD"),
        CUSTOM("커스텀 ERD"),
        TENANT("테넌트별 ERD");
        
        private final String description;
        
        DiagramType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 생성 트리거 소스 열거형
     */
    public enum TriggerSource {
        ONBOARDING_APPROVAL("온보딩 승인"),
        MANUAL("수동 생성"),
        SCHEDULED("스케줄링");
        
        private final String description;
        
        TriggerSource(String description) {
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
    @Column(name = "diagram_id", length = 36, unique = true, nullable = false)
    private String diagramId;
    
    /**
     * 테넌트 UUID (NULL이면 전체 시스템 ERD)
     */
    @Column(name = "tenant_id", length = 36)
    private String tenantId;
    
    /**
     * ERD 이름
     */
    @Column(name = "name", length = 255, nullable = false)
    private String name;
    
    /**
     * ERD 설명
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    /**
     * ERD 타입
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "diagram_type", length = 50, nullable = false)
    private DiagramType diagramType;
    
    /**
     * 모듈 타입 (ACADEMY, FOOD_SERVICE 등)
     */
    @Column(name = "module_type", length = 50)
    private String moduleType;
    
    /**
     * Mermaid ERD 코드
     */
    @Column(name = "mermaid_code", columnDefinition = "TEXT", nullable = false)
    private String mermaidCode;
    
    /**
     * 텍스트 ERD
     */
    @Column(name = "text_erd", columnDefinition = "TEXT")
    private String textErd;
    
    /**
     * ERD 버전
     */
    @Column(name = "version", nullable = false)
    @Builder.Default
    private Integer version = 1;
    
    /**
     * 활성화 여부
     */
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
    
    /**
     * 공개 여부 (테넌트 포털에서 조회 가능)
     */
    @Column(name = "is_public")
    @Builder.Default
    private Boolean isPublic = false;
    
    /**
     * 생성 트리거
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_source", length = 50)
    private TriggerSource triggerSource;
    
    /**
     * 생성 시각
     */
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    /**
     * 수정 시각
     */
    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    /**
     * 생성자
     */
    @Column(name = "created_by", length = 100)
    private String createdBy;
    
    /**
     * 수정자
     */
    @Column(name = "updated_by", length = 100)
    private String updatedBy;
    
    /**
     * 테넌트 (참조)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", referencedColumnName = "tenant_id", insertable = false, updatable = false)
    private Tenant tenant;
}

