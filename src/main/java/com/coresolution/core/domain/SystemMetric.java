package com.coresolution.core.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 시스템 메트릭 엔티티
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
@Entity
@Table(name = "system_metrics",
    indexes = {
        @Index(name = "idx_tenant_id", columnList = "tenant_id"),
        @Index(name = "idx_metric_type", columnList = "metric_type"),
        @Index(name = "idx_collected_at", columnList = "collected_at")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemMetric {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "tenant_id", length = 36)
    private String tenantId;
    
    @Column(name = "metric_type", nullable = false, length = 50)
    private String metricType; // CPU, MEMORY, DISK, NETWORK, DB_CONNECTION, API_RESPONSE_TIME
    
    @Column(name = "metric_value", nullable = false)
    private Double metricValue;
    
    @Column(name = "unit", length = 20)
    private String unit; // %, MB, ms 등
    
    @Column(name = "host", length = 100)
    private String host;
    
    @Column(name = "additional_data", columnDefinition = "JSON")
    private String additionalData;
    
    @Column(name = "collected_at", nullable = false)
    private LocalDateTime collectedAt;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (collectedAt == null) {
            collectedAt = LocalDateTime.now();
        }
    }
}

