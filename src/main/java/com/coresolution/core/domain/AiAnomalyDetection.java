package com.coresolution.core.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * AI 이상 탐지 결과 엔티티
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
@Entity
@Table(name = "ai_anomaly_detection",
    indexes = {
        @Index(name = "idx_tenant_id", columnList = "tenant_id"),
        @Index(name = "idx_detection_type", columnList = "detection_type"),
        @Index(name = "idx_severity", columnList = "severity"),
        @Index(name = "idx_detected_at", columnList = "detected_at")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiAnomalyDetection {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "tenant_id", length = 36)
    private String tenantId;
    
    @Column(name = "detection_type", nullable = false, length = 50)
    private String detectionType; // PERFORMANCE, SECURITY, BEHAVIOR
    
    @Column(name = "anomaly_score", nullable = false)
    private Double anomalyScore; // 0-1
    
    @Column(name = "severity", nullable = false, length = 20)
    private String severity; // LOW, MEDIUM, HIGH, CRITICAL
    
    @Column(name = "metric_type", length = 50)
    private String metricType;
    
    @Column(name = "metric_value")
    private Double metricValue;
    
    @Column(name = "expected_value")
    private Double expectedValue;
    
    @Column(name = "deviation")
    private Double deviation;
    
    @Column(name = "model_used", length = 50)
    private String modelUsed; // ISOLATION_FOREST, LSTM, STATISTICAL
    
    @Column(name = "details", columnDefinition = "JSON")
    private String details;
    
    @Column(name = "is_false_positive")
    @Builder.Default
    private Boolean isFalsePositive = false;
    
    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
    
    @Column(name = "detected_at", nullable = false)
    private LocalDateTime detectedAt;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (detectedAt == null) {
            detectedAt = LocalDateTime.now();
        }
    }
}

