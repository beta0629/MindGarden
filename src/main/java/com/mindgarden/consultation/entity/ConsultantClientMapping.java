package com.mindgarden.consultation.entity;

import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 상담사-내담자 매핑 엔티티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Entity
@Table(name = "consultant_client_mappings", indexes = {
    @Index(name = "idx_mapping_consultant", columnList = "consultant_id"),
    @Index(name = "idx_mapping_client", columnList = "client_id"),
    @Index(name = "idx_mapping_status", columnList = "status"),
    @Index(name = "idx_mapping_start_date", columnList = "start_date"),
    @Index(name = "idx_mapping_payment_status", columnList = "payment_status"),
    @Index(name = "idx_mapping_remaining_sessions", columnList = "remaining_sessions")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultantClientMapping extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consultant_id", nullable = false)
    private User consultant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50, nullable = false)
    private MappingStatus status = MappingStatus.PENDING_PAYMENT;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", length = 50, nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Column(name = "total_sessions", nullable = false)
    private Integer totalSessions = 0; // 총 회기 수

    @Column(name = "remaining_sessions", nullable = false)
    private Integer remainingSessions = 0; // 남은 회기 수

    @Column(name = "used_sessions")
    private Integer usedSessions = 0; // 사용된 회기 수

    @Column(name = "package_name", length = 100)
    private String packageName; // 패키지명 (예: "10회기 패키지", "20회기 패키지")

    @Column(name = "package_price")
    private Long packagePrice; // 패키지 가격

    @Column(name = "payment_amount")
    private Long paymentAmount; // 실제 결제 금액

    @Column(name = "payment_date")
    private LocalDateTime paymentDate; // 결제일

    @Column(name = "payment_method", length = 50)
    private String paymentMethod; // 결제 방법 (CARD, BANK_TRANSFER, CASH 등)

    @Column(name = "payment_reference", length = 200)
    private String paymentReference; // 결제 참조번호

    @Column(name = "admin_approval_date")
    private LocalDateTime adminApprovalDate; // 관리자 승인일

    @Column(name = "approved_by", length = 100)
    private String approvedBy; // 승인한 관리자

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "responsibility", length = 500)
    private String responsibility;

    @Column(name = "special_considerations", columnDefinition = "TEXT")
    private String specialConsiderations;

    @Column(name = "assigned_by", length = 100)
    private String assignedBy;

    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;

    @Column(name = "termination_reason", length = 500)
    private String terminationReason;

    @Column(name = "terminated_by", length = 100)
    private String terminatedBy;

    @Column(name = "terminated_at")
    private LocalDateTime terminatedAt;

    /**
     * 매핑 상태 enum
     */
    public enum MappingStatus {
        PENDING_PAYMENT,    // 입금 대기
        PAYMENT_CONFIRMED,  // 입금 확인됨
        ACTIVE,            // 활성 (승인 후)
        INACTIVE,          // 비활성
        SUSPENDED,         // 중단
        TERMINATED,        // 종료
        SESSIONS_EXHAUSTED // 회기 소진
    }

    /**
     * 결제 상태 enum
     */
    public enum PaymentStatus {
        PENDING,        // 대기
        CONFIRMED,      // 확인됨
        APPROVED,       // 승인됨
        REJECTED,       // 거부됨
        REFUNDED        // 환불됨
    }

    /**
     * 입금 확인 처리
     */
    public void confirmPayment(String paymentMethod, String paymentReference) {
        this.paymentStatus = PaymentStatus.CONFIRMED;
        this.paymentMethod = paymentMethod;
        this.paymentReference = paymentReference;
        this.paymentDate = LocalDateTime.now();
        this.status = MappingStatus.PAYMENT_CONFIRMED;
    }

    /**
     * 관리자 승인
     */
    public void approveByAdmin(String adminName) {
        if (this.paymentStatus != PaymentStatus.CONFIRMED) {
            throw new IllegalStateException("입금 확인이 완료되지 않았습니다.");
        }
        this.paymentStatus = PaymentStatus.APPROVED;
        this.status = MappingStatus.ACTIVE;
        this.adminApprovalDate = LocalDateTime.now();
        this.approvedBy = adminName;
        this.startDate = LocalDateTime.now();
    }

    /**
     * 회기 사용
     */
    public void useSession() {
        if (this.remainingSessions <= 0) {
            throw new IllegalStateException("사용 가능한 회기가 없습니다.");
        }
        this.remainingSessions--;
        this.usedSessions++;
        
        // 모든 회기 소진 시 자동 종료
        if (this.remainingSessions <= 0) {
            this.status = MappingStatus.SESSIONS_EXHAUSTED;
            this.endDate = LocalDateTime.now();
        }
    }

    /**
     * 회기 추가 (연장)
     */
    public void addSessions(Integer additionalSessions, String packageName, Long packagePrice) {
        this.totalSessions += additionalSessions;
        this.remainingSessions += additionalSessions;
        this.packageName = packageName;
        this.packagePrice = packagePrice;
        
        // 상태를 다시 활성으로 변경
        if (this.status == MappingStatus.SESSIONS_EXHAUSTED) {
            this.status = MappingStatus.ACTIVE;
            this.endDate = null;
        }
    }

    /**
     * 매핑 활성화
     */
    public void activate() {
        if (this.paymentStatus != PaymentStatus.APPROVED) {
            throw new IllegalStateException("관리자 승인이 필요합니다.");
        }
        this.status = MappingStatus.ACTIVE;
        this.startDate = LocalDateTime.now();
    }

    /**
     * 매핑 비활성화
     */
    public void deactivate() {
        this.status = MappingStatus.INACTIVE;
        this.endDate = LocalDateTime.now();
    }

    /**
     * 매핑 중단
     */
    public void suspend(String reason) {
        this.status = MappingStatus.SUSPENDED;
        this.notes = reason;
    }

    /**
     * 매핑 종료
     */
    public void terminate(String reason, String terminatedBy) {
        this.status = MappingStatus.TERMINATED;
        this.terminationReason = reason;
        this.terminatedBy = terminatedBy;
        this.terminatedAt = LocalDateTime.now();
        this.endDate = LocalDateTime.now();
    }

    /**
     * 스케줄 작성 가능 여부 확인
     */
    public boolean canCreateSchedule() {
        return this.status == MappingStatus.ACTIVE && this.remainingSessions > 0;
    }

    /**
     * 남은 회기 수 확인
     */
    public Integer getRemainingSessions() {
        return Math.max(0, this.remainingSessions);
    }

    /**
     * 진행률 계산 (백분율)
     */
    public Double getProgressPercentage() {
        if (this.totalSessions == 0) return 0.0;
        return ((double) this.usedSessions / this.totalSessions) * 100;
    }

    @PrePersist
    protected void onCreate() {
        if (this.assignedAt == null) {
            this.assignedAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = MappingStatus.PENDING_PAYMENT;
        }
        if (this.paymentStatus == null) {
            this.paymentStatus = PaymentStatus.PENDING;
        }
    }
}
