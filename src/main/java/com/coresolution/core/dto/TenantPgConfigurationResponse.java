package com.coresolution.core.dto;

import com.coresolution.core.domain.enums.ApprovalStatus;
import com.coresolution.core.domain.enums.PgConfigurationStatus;
import com.coresolution.core.domain.enums.PgProvider;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 테넌트 PG 설정 응답 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantPgConfigurationResponse {
    
    /**
     * PG 설정 UUID
     */
    private String configId;
    
    /**
     * 테넌트 ID
     */
    private String tenantId;
    
    /**
     * PG사 제공자
     */
    private PgProvider pgProvider;
    
    /**
     * PG사 명칭
     */
    private String pgName;
    
    /**
     * Merchant ID
     */
    private String merchantId;
    
    /**
     * Store ID
     */
    private String storeId;
    
    /**
     * Webhook URL
     */
    private String webhookUrl;
    
    /**
     * Return URL
     */
    private String returnUrl;
    
    /**
     * Cancel URL
     */
    private String cancelUrl;
    
    /**
     * 테스트 모드 여부
     */
    private Boolean testMode;
    
    /**
     * 상태
     */
    private PgConfigurationStatus status;
    
    /**
     * 승인 상태
     */
    private ApprovalStatus approvalStatus;
    
    /**
     * 요청자
     */
    private String requestedBy;
    
    /**
     * 요청 시각
     */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime requestedAt;
    
    /**
     * 승인자
     */
    private String approvedBy;
    
    /**
     * 승인 시각
     */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime approvedAt;
    
    /**
     * 거부 사유
     */
    private String rejectionReason;
    
    /**
     * 마지막 연결 테스트 시각
     */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime lastConnectionTestAt;
    
    /**
     * 연결 테스트 결과
     */
    private String connectionTestResult;
    
    /**
     * 연결 테스트 메시지
     */
    private String connectionTestMessage;
    
    /**
     * 연결 테스트 상세 정보 (JSON)
     */
    private String connectionTestDetails;
    
    /**
     * PG별 추가 설정 (JSON)
     */
    private String settingsJson;
    
    /**
     * 비고
     */
    private String notes;
    
    /**
     * 생성 시각
     */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
    
    /**
     * 수정 시각
     */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
}

