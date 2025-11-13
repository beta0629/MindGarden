package com.mindgarden.ops.domain.onboarding;

import com.mindgarden.ops.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.Entity;

@Entity
@Table(name = "ops_onboarding_request")
public class OnboardingRequest extends BaseEntity {

    @Column(nullable = false, length = 64)
    private String tenantId;

    @Column(nullable = false, length = 120)
    private String tenantName;

    @Column(nullable = false, length = 64)
    private String requestedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OnboardingStatus status = OnboardingStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private RiskLevel riskLevel = RiskLevel.LOW;

    @Column(columnDefinition = "TEXT")
    private String checklistJson;

    @Column(length = 64)
    private String decidedBy;

    @Column(length = 20)
    private String decisionAt; // ISO-8601 string 저장 (단순화를 위해)

    @Column(columnDefinition = "TEXT")
    private String decisionNote;

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getTenantName() {
        return tenantName;
    }

    public void setTenantName(String tenantName) {
        this.tenantName = tenantName;
    }

    public String getRequestedBy() {
        return requestedBy;
    }

    public void setRequestedBy(String requestedBy) {
        this.requestedBy = requestedBy;
    }

    public OnboardingStatus getStatus() {
        return status;
    }

    public void setStatus(OnboardingStatus status) {
        this.status = status;
    }

    public RiskLevel getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(RiskLevel riskLevel) {
        this.riskLevel = riskLevel;
    }

    public String getChecklistJson() {
        return checklistJson;
    }

    public void setChecklistJson(String checklistJson) {
        this.checklistJson = checklistJson;
    }

    public String getDecidedBy() {
        return decidedBy;
    }

    public void setDecidedBy(String decidedBy) {
        this.decidedBy = decidedBy;
    }

    public String getDecisionAt() {
        return decisionAt;
    }

    public void setDecisionAt(String decisionAt) {
        this.decisionAt = decisionAt;
    }

    public String getDecisionNote() {
        return decisionNote;
    }

    public void setDecisionNote(String decisionNote) {
        this.decisionNote = decisionNote;
    }
}
