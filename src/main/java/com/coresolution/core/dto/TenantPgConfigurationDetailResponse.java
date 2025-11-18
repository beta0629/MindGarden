package com.coresolution.core.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 테넌트 PG 설정 상세 응답 DTO
 * (변경 이력 포함)
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class TenantPgConfigurationDetailResponse extends TenantPgConfigurationResponse {
    
    /**
     * 변경 이력 목록
     */
    private List<TenantPgConfigurationHistoryResponse> history;
    
    /**
     * Detail Builder 생성
     */
    public static TenantPgConfigurationDetailResponseBuilder detailBuilder() {
        return new TenantPgConfigurationDetailResponseBuilder();
    }
    
    public static class TenantPgConfigurationDetailResponseBuilder {
        private TenantPgConfigurationResponse base = new TenantPgConfigurationResponse();
        private List<TenantPgConfigurationHistoryResponse> history;
        
        public TenantPgConfigurationDetailResponseBuilder configId(String configId) {
            base.setConfigId(configId);
            return this;
        }
        
        public TenantPgConfigurationDetailResponseBuilder tenantId(String tenantId) {
            base.setTenantId(tenantId);
            return this;
        }
        
        public TenantPgConfigurationDetailResponseBuilder pgProvider(com.coresolution.core.domain.enums.PgProvider pgProvider) {
            base.setPgProvider(pgProvider);
            return this;
        }
        
        public TenantPgConfigurationDetailResponseBuilder pgName(String pgName) {
            base.setPgName(pgName);
            return this;
        }
        
        public TenantPgConfigurationDetailResponseBuilder merchantId(String merchantId) {
            base.setMerchantId(merchantId);
            return this;
        }
        
        public TenantPgConfigurationDetailResponseBuilder storeId(String storeId) {
            base.setStoreId(storeId);
            return this;
        }
        
        public TenantPgConfigurationDetailResponseBuilder webhookUrl(String webhookUrl) {
            base.setWebhookUrl(webhookUrl);
            return this;
        }
        
        public TenantPgConfigurationDetailResponseBuilder returnUrl(String returnUrl) {
            base.setReturnUrl(returnUrl);
            return this;
        }
        
        public TenantPgConfigurationDetailResponseBuilder cancelUrl(String cancelUrl) {
            base.setCancelUrl(cancelUrl);
            return this;
        }
        
        public TenantPgConfigurationDetailResponseBuilder testMode(Boolean testMode) {
            base.setTestMode(testMode);
            return this;
        }
        
        public TenantPgConfigurationDetailResponseBuilder status(com.coresolution.core.domain.enums.PgConfigurationStatus status) {
            base.setStatus(status);
            return this;
        }
        
        public TenantPgConfigurationDetailResponseBuilder approvalStatus(com.coresolution.core.domain.enums.ApprovalStatus approvalStatus) {
            base.setApprovalStatus(approvalStatus);
            return this;
        }
        
        public TenantPgConfigurationDetailResponseBuilder requestedBy(String requestedBy) {
            base.setRequestedBy(requestedBy);
            return this;
        }
        
        public TenantPgConfigurationDetailResponseBuilder requestedAt(java.time.LocalDateTime requestedAt) {
            base.setRequestedAt(requestedAt);
            return this;
        }
        
        public TenantPgConfigurationDetailResponseBuilder approvedBy(String approvedBy) {
            base.setApprovedBy(approvedBy);
            return this;
        }
        
        public TenantPgConfigurationDetailResponseBuilder approvedAt(java.time.LocalDateTime approvedAt) {
            base.setApprovedAt(approvedAt);
            return this;
        }
        
        public TenantPgConfigurationDetailResponseBuilder rejectionReason(String rejectionReason) {
            base.setRejectionReason(rejectionReason);
            return this;
        }
        
        public TenantPgConfigurationDetailResponseBuilder lastConnectionTestAt(java.time.LocalDateTime lastConnectionTestAt) {
            base.setLastConnectionTestAt(lastConnectionTestAt);
            return this;
        }
        
        public TenantPgConfigurationDetailResponseBuilder connectionTestResult(String connectionTestResult) {
            base.setConnectionTestResult(connectionTestResult);
            return this;
        }
        
        public TenantPgConfigurationDetailResponseBuilder connectionTestMessage(String connectionTestMessage) {
            base.setConnectionTestMessage(connectionTestMessage);
            return this;
        }
        
        public TenantPgConfigurationDetailResponseBuilder connectionTestDetails(String connectionTestDetails) {
            base.setConnectionTestDetails(connectionTestDetails);
            return this;
        }
        
        public TenantPgConfigurationDetailResponseBuilder settingsJson(String settingsJson) {
            base.setSettingsJson(settingsJson);
            return this;
        }
        
        public TenantPgConfigurationDetailResponseBuilder notes(String notes) {
            base.setNotes(notes);
            return this;
        }
        
        public TenantPgConfigurationDetailResponseBuilder createdAt(java.time.LocalDateTime createdAt) {
            base.setCreatedAt(createdAt);
            return this;
        }
        
        public TenantPgConfigurationDetailResponseBuilder updatedAt(java.time.LocalDateTime updatedAt) {
            base.setUpdatedAt(updatedAt);
            return this;
        }
        
        public TenantPgConfigurationDetailResponseBuilder history(List<TenantPgConfigurationHistoryResponse> history) {
            this.history = history;
            return this;
        }
        
        public TenantPgConfigurationDetailResponse build() {
            TenantPgConfigurationDetailResponse response = new TenantPgConfigurationDetailResponse();
            response.setConfigId(base.getConfigId());
            response.setTenantId(base.getTenantId());
            response.setPgProvider(base.getPgProvider());
            response.setPgName(base.getPgName());
            response.setMerchantId(base.getMerchantId());
            response.setStoreId(base.getStoreId());
            response.setWebhookUrl(base.getWebhookUrl());
            response.setReturnUrl(base.getReturnUrl());
            response.setCancelUrl(base.getCancelUrl());
            response.setTestMode(base.getTestMode());
            response.setStatus(base.getStatus());
            response.setApprovalStatus(base.getApprovalStatus());
            response.setRequestedBy(base.getRequestedBy());
            response.setRequestedAt(base.getRequestedAt());
            response.setApprovedBy(base.getApprovedBy());
            response.setApprovedAt(base.getApprovedAt());
            response.setRejectionReason(base.getRejectionReason());
            response.setLastConnectionTestAt(base.getLastConnectionTestAt());
            response.setConnectionTestResult(base.getConnectionTestResult());
            response.setConnectionTestMessage(base.getConnectionTestMessage());
            response.setConnectionTestDetails(base.getConnectionTestDetails());
            response.setSettingsJson(base.getSettingsJson());
            response.setNotes(base.getNotes());
            response.setCreatedAt(base.getCreatedAt());
            response.setUpdatedAt(base.getUpdatedAt());
            response.setHistory(history);
            return response;
        }
    }
}

