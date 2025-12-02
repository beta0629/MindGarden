package com.coresolution.core.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * 보안 위협 탐지 엔티티
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
@Entity
@Table(name = "security_threat_detection",
    indexes = {
        @Index(name = "idx_tenant_id", columnList = "tenant_id"),
        @Index(name = "idx_threat_type", columnList = "threat_type"),
        @Index(name = "idx_severity", columnList = "severity"),
        @Index(name = "idx_source_ip", columnList = "source_ip"),
        @Index(name = "idx_blocked", columnList = "blocked"),
        @Index(name = "idx_detected_at", columnList = "detected_at")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SecurityThreatDetection {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "tenant_id", length = 36)
    private String tenantId;
    
    @Column(name = "threat_type", nullable = false, length = 50)
    private String threatType; // BRUTE_FORCE, SQL_INJECTION, DDOS, XSS, SUSPICIOUS_BEHAVIOR
    
    @Column(name = "severity", nullable = false, length = 20)
    private String severity; // LOW, MEDIUM, HIGH, CRITICAL
    
    @Column(name = "source_ip", length = 50)
    private String sourceIp;
    
    @Column(name = "target_url", length = 500)
    private String targetUrl;
    
    @Column(name = "user_id")
    private Long userId;
    
    @Column(name = "user_email")
    private String userEmail;
    
    @Column(name = "attack_pattern", columnDefinition = "TEXT")
    private String attackPattern;
    
    @Column(name = "confidence_score")
    private Double confidenceScore; // 0-1
    
    @Column(name = "blocked")
    private Boolean blocked = false;
    
    @Column(name = "auto_blocked")
    private Boolean autoBlocked = false;
    
    @Column(name = "details", columnDefinition = "JSON")
    private String details;
    
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

