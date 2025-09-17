package com.mindgarden.consultation.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 환불 요청 엔티티
 * - ERP 시스템과 연동하여 환불 처리 상태 관리
 * - 회계 시스템과의 동기화 지원
 */
@Entity
@Table(name = "refund_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 환불 대상 매핑
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mapping_id", nullable = false)
    private ConsultantClientMapping mapping;

    /**
     * 환불 요청자 (관리자)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by", nullable = false)
    private User requestedBy;

    /**
     * 환불 사유
     */
    @Column(name = "refund_reason", nullable = false, length = 500)
    private String refundReason;

    /**
     * 환불 사유 코드 (공통 코드)
     */
    @Column(name = "reason_code", length = 50)
    private String reasonCode;

    /**
     * 환불 회기 수
     */
    @Column(name = "refund_sessions", nullable = false)
    private Integer refundSessions;

    /**
     * 환불 금액
     */
    @Column(name = "refund_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal refundAmount;

    /**
     * 환불 상태
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private RefundStatus status;

    /**
     * ERP 연동 상태
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "erp_status", nullable = false, length = 20)
    private ErpIntegrationStatus erpStatus;

    /**
     * ERP 참조 번호
     */
    @Column(name = "erp_reference_number", length = 100)
    private String erpReferenceNumber;

    /**
     * ERP 응답 메시지
     */
    @Column(name = "erp_response_message", length = 1000)
    private String erpResponseMessage;

    /**
     * 환불 요청 일시
     */
    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    /**
     * 환불 승인 일시
     */
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    /**
     * 환불 승인자
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    /**
     * 환불 완료 일시
     */
    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    /**
     * 환불 거부 일시
     */
    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;

    /**
     * 환불 거부 사유
     */
    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    /**
     * 생성 일시
     */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /**
     * 수정 일시
     */
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * 환불 상태 열거형
     */
    public enum RefundStatus {
        REQUESTED("환불 요청"),
        APPROVED("환불 승인"),
        PROCESSING("환불 처리중"),
        COMPLETED("환불 완료"),
        REJECTED("환불 거부");

        private final String description;

        RefundStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * ERP 연동 상태 열거형
     */
    public enum ErpIntegrationStatus {
        PENDING("ERP 연동 대기"),
        SENT("ERP 전송 완료"),
        CONFIRMED("ERP 확인 완료"),
        FAILED("ERP 연동 실패"),
        RETRY("재시도 대기");

        private final String description;

        ErpIntegrationStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.requestedAt == null) {
            this.requestedAt = now;
        }
        if (this.status == null) {
            this.status = RefundStatus.REQUESTED;
        }
        if (this.erpStatus == null) {
            this.erpStatus = ErpIntegrationStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
