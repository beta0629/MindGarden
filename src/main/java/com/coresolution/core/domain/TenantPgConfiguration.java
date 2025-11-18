package com.coresolution.core.domain;

import com.coresolution.core.domain.enums.ApprovalStatus;
import com.coresolution.core.domain.enums.PgConfigurationStatus;
import com.coresolution.core.domain.enums.PgProvider;
import com.mindgarden.consultation.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 테넌트 PG 설정 엔티티
 * 테넌트별 결제 게이트웨이 설정 및 승인 관리
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Entity
@Table(name = "tenant_pg_configurations", indexes = {
    @Index(name = "idx_config_id", columnList = "config_id"),
    @Index(name = "idx_tenant_id", columnList = "tenant_id"),
    @Index(name = "idx_pg_provider", columnList = "pg_provider"),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_approval_status", columnList = "approval_status"),
    @Index(name = "idx_tenant_status", columnList = "tenant_id,status"),
    @Index(name = "idx_is_deleted", columnList = "is_deleted")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class TenantPgConfiguration extends BaseEntity {
    
    /**
     * PG 설정 UUID (고유 식별자)
     */
    @Column(name = "config_id", length = 36, unique = true, nullable = false)
    private String configId;
    
    /**
     * 테넌트 ID
     */
    @Column(name = "tenant_id", length = 36, nullable = false)
    private String tenantId;
    
    /**
     * PG사 제공자
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "pg_provider", length = 50, nullable = false)
    private PgProvider pgProvider;
    
    /**
     * PG사 명칭 (커스텀)
     */
    @Column(name = "pg_name", length = 255)
    private String pgName;
    
    /**
     * API Key (암호화 저장)
     */
    @Column(name = "api_key_encrypted", columnDefinition = "TEXT", nullable = false)
    private String apiKeyEncrypted;
    
    /**
     * Secret Key (암호화 저장)
     */
    @Column(name = "secret_key_encrypted", columnDefinition = "TEXT", nullable = false)
    private String secretKeyEncrypted;
    
    /**
     * Merchant ID
     */
    @Column(name = "merchant_id", length = 255)
    private String merchantId;
    
    /**
     * Store ID
     */
    @Column(name = "store_id", length = 255)
    private String storeId;
    
    /**
     * Webhook URL
     */
    @Column(name = "webhook_url", length = 500)
    private String webhookUrl;
    
    /**
     * Return URL
     */
    @Column(name = "return_url", length = 500)
    private String returnUrl;
    
    /**
     * Cancel URL
     */
    @Column(name = "cancel_url", length = 500)
    private String cancelUrl;
    
    /**
     * 테스트 모드 여부
     */
    @Column(name = "test_mode")
    @Builder.Default
    private Boolean testMode = false;
    
    /**
     * 상태 (PENDING, APPROVED, REJECTED, ACTIVE, INACTIVE)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    @Builder.Default
    private PgConfigurationStatus status = PgConfigurationStatus.PENDING;
    
    /**
     * 승인 상태 (PENDING, APPROVED, REJECTED)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", length = 20)
    @Builder.Default
    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING;
    
    /**
     * 요청자
     */
    @Column(name = "requested_by", length = 100)
    private String requestedBy;
    
    /**
     * 요청 시각
     */
    @Column(name = "requested_at")
    @Builder.Default
    private LocalDateTime requestedAt = LocalDateTime.now();
    
    /**
     * 승인자
     */
    @Column(name = "approved_by", length = 100)
    private String approvedBy;
    
    /**
     * 승인 시각
     */
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
    
    /**
     * 거부 사유
     */
    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;
    
    /**
     * 마지막 연결 테스트 시각
     */
    @Column(name = "last_connection_test_at")
    private LocalDateTime lastConnectionTestAt;
    
    /**
     * 연결 테스트 결과 (SUCCESS, FAILED)
     */
    @Column(name = "connection_test_result", length = 20)
    private String connectionTestResult;
    
    /**
     * 연결 테스트 메시지
     */
    @Column(name = "connection_test_message", columnDefinition = "TEXT")
    private String connectionTestMessage;
    
    /**
     * 연결 테스트 상세 정보 (JSON)
     */
    @Column(name = "connection_test_details", columnDefinition = "JSON")
    private String connectionTestDetails;
    
    /**
     * PG별 추가 설정 (JSON)
     */
    @Column(name = "settings_json", columnDefinition = "JSON")
    private String settingsJson;
    
    /**
     * 비고
     */
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    /**
     * 테넌트 (참조)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", referencedColumnName = "tenant_id", insertable = false, updatable = false)
    private Tenant tenant;
    
    /**
     * 변경 이력 목록
     */
    @OneToMany(mappedBy = "configuration", fetch = FetchType.LAZY)
    private List<TenantPgConfigurationHistory> history;
    
    // 비즈니스 메서드
    
    /**
     * 활성 상태 확인
     */
    public boolean isActive() {
        return status == PgConfigurationStatus.ACTIVE && !isDeleted();
    }
    
    /**
     * 승인 상태 확인
     */
    public boolean isApproved() {
        return approvalStatus == ApprovalStatus.APPROVED && status.isApproved();
    }
    
    /**
     * 대기 중 상태 확인
     */
    public boolean isPending() {
        return status == PgConfigurationStatus.PENDING && approvalStatus == ApprovalStatus.PENDING;
    }
    
    /**
     * 연결 테스트 성공 여부 확인
     */
    public boolean isConnectionTestSuccessful() {
        return "SUCCESS".equals(connectionTestResult);
    }
}

