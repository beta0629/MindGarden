package com.coresolution.core.domain.onboarding;

import com.coresolution.consultation.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

 /**
 * 온보딩 요청 엔티티
 /**
 * 
 /**
 * @author CoreSolution
 /**
 * @version 1.0.0
 /**
 * @since 2025-01-XX
 */
@Entity
@Table(name = "onboarding_request", indexes = {
    @Index(name = "idx_onboarding_tenant_id", columnList = "tenant_id"),
    @Index(name = "idx_onboarding_status", columnList = "status"),
    @Index(name = "idx_onboarding_tenant_status", columnList = "tenant_id,status")
})
@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = false)
public class OnboardingRequest {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private java.util.UUID id;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private java.time.LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private java.time.LocalDateTime updatedAt;
    
    @Column(name = "deleted_at")
    private java.time.LocalDateTime deletedAt;
    
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;
    
    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;
    
    @Column(name = "tenant_id", nullable = true, length = 64)
    private String tenantId; // 온보딩 중이면 null (승인 후 자동 생성)
    
    @Column(name = "tenant_name", nullable = false, length = 120)
    private String tenantName;
    
    @Column(name = "requested_by", nullable = false, length = 64)
    private String requestedBy;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
    private OnboardingStatus status = OnboardingStatus.PENDING;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false, length = 16)
    @Builder.Default
    private RiskLevel riskLevel = RiskLevel.LOW;
    
    @Column(name = "checklist_json", columnDefinition = "TEXT")
    private String checklistJson;
    
    @Column(name = "decided_by", length = 64)
    private String decidedBy;
    
    @Column(name = "decision_at", length = 30)
    private String decisionAt; // ISO-8601 string 저장
    
    @Column(name = "decision_note", columnDefinition = "TEXT")
    private String decisionNote;
    
    @Column(name = "business_type", length = 50)
    private String businessType; // 업종 타입 (동적 카테고리 시스템 사용)
    
    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = java.time.LocalDateTime.now();
        }
        if (this.updatedAt == null) {
            this.updatedAt = java.time.LocalDateTime.now();
        }
        if (this.isDeleted == null) {
            this.isDeleted = false;
        }
        if (this.version == null) {
            this.version = 0L;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = java.time.LocalDateTime.now();
    }
}

