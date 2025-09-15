package com.mindgarden.consultation.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 회기 추가 요청 엔티티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Entity
@Table(name = "session_extension_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class SessionExtensionRequest {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mapping_id", nullable = false)
    private ConsultantClientMapping mapping;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;
    
    @Column(nullable = false)
    private Integer additionalSessions;
    
    @Column(nullable = false)
    private String packageName;
    
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal packagePrice;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExtensionStatus status;
    
    @Column(length = 500)
    private String reason;
    
    @Column(length = 1000)
    private String adminComment;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;
    
    @Column
    private LocalDateTime approvedAt;
    
    @Column
    private LocalDateTime rejectedAt;
    
    @Column(length = 1000)
    private String rejectionReason;
    
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    /**
     * 회기 추가 요청 상태
     */
    public enum ExtensionStatus {
        PENDING("대기중"),
        PAYMENT_CONFIRMED("입금확인"),
        ADMIN_APPROVED("관리자승인"),
        REJECTED("거부됨"),
        COMPLETED("완료");
        
        private final String description;
        
        ExtensionStatus(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 입금 확인 처리
     */
    public void confirmPayment() {
        if (this.status != ExtensionStatus.PENDING) {
            throw new IllegalStateException("입금 확인할 수 없는 상태입니다: " + this.status);
        }
        this.status = ExtensionStatus.PAYMENT_CONFIRMED;
    }
    
    /**
     * 관리자 승인
     */
    public void approveByAdmin(User admin) {
        if (this.status != ExtensionStatus.PAYMENT_CONFIRMED) {
            throw new IllegalStateException("관리자 승인할 수 없는 상태입니다: " + this.status);
        }
        this.status = ExtensionStatus.ADMIN_APPROVED;
        this.approvedBy = admin;
        this.approvedAt = LocalDateTime.now();
    }
    
    /**
     * 거부 처리
     */
    public void reject(String reason) {
        if (this.status == ExtensionStatus.COMPLETED || this.status == ExtensionStatus.REJECTED) {
            throw new IllegalStateException("거부할 수 없는 상태입니다: " + this.status);
        }
        this.status = ExtensionStatus.REJECTED;
        this.rejectionReason = reason;
        this.rejectedAt = LocalDateTime.now();
    }
    
    /**
     * 완료 처리
     */
    public void complete() {
        if (this.status != ExtensionStatus.ADMIN_APPROVED) {
            throw new IllegalStateException("완료할 수 없는 상태입니다: " + this.status);
        }
        this.status = ExtensionStatus.COMPLETED;
    }
    
    /**
     * 승인 가능한 상태인지 확인
     */
    public boolean isApprovable() {
        return this.status == ExtensionStatus.PAYMENT_CONFIRMED;
    }
    
    /**
     * 거부 가능한 상태인지 확인
     */
    public boolean isRejectable() {
        return this.status == ExtensionStatus.PENDING || this.status == ExtensionStatus.PAYMENT_CONFIRMED;
    }
}
