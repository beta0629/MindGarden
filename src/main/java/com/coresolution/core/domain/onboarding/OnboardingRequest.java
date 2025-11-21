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
 * 
 * @author CoreSolution
 * @version 1.0.0
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
@EqualsAndHashCode(callSuper = true)
public class OnboardingRequest extends BaseEntity {
    
    @Column(name = "tenant_id", nullable = true, length = 64)
    private String tenantId; // 온보딩 중이면 null (승인 후 자동 생성)
    
    @Column(name = "tenant_name", nullable = false, length = 120)
    private String tenantName;
    
    @Column(name = "requested_by", nullable = false, length = 64)
    private String requestedBy;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
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
}

