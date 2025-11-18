package com.coresolution.core.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 테넌트 PG 설정 변경 이력 엔티티
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Entity
@Table(name = "tenant_pg_configuration_history", indexes = {
    @Index(name = "idx_config_id", columnList = "config_id"),
    @Index(name = "idx_change_type", columnList = "change_type"),
    @Index(name = "idx_changed_at", columnList = "changed_at"),
    @Index(name = "idx_config_changed", columnList = "config_id,changed_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantPgConfigurationHistory {
    
    /**
     * 변경 유형 열거형
     */
    public enum ChangeType {
        CREATED("생성"),
        UPDATED("수정"),
        STATUS_CHANGED("상태 변경"),
        APPROVED("승인"),
        REJECTED("거부"),
        ACTIVATED("활성화"),
        DEACTIVATED("비활성화");
        
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
     * PG 설정 UUID
     */
    @Column(name = "config_id", length = 36, nullable = false)
    private String configId;
    
    /**
     * 변경 유형
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "change_type", length = 50, nullable = false)
    private ChangeType changeType;
    
    /**
     * 변경 전 상태
     */
    @Column(name = "old_status", length = 20)
    private String oldStatus;
    
    /**
     * 변경 후 상태
     */
    @Column(name = "new_status", length = 20)
    private String newStatus;
    
    /**
     * 변경자
     */
    @Column(name = "changed_by", length = 100)
    private String changedBy;
    
    /**
     * 변경 시각
     */
    @Column(name = "changed_at")
    @Builder.Default
    private LocalDateTime changedAt = LocalDateTime.now();
    
    /**
     * 변경 상세 정보 (JSON)
     */
    @Column(name = "change_details_json", columnDefinition = "JSON")
    private String changeDetailsJson;
    
    /**
     * 비고
     */
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    /**
     * PG 설정 (참조)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "config_id", referencedColumnName = "config_id", insertable = false, updatable = false)
    private TenantPgConfiguration configuration;
}

