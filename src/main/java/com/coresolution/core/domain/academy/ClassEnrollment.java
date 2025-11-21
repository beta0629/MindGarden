package com.coresolution.core.domain.academy;

import com.coresolution.consultation.entity.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 수강 등록 엔티티
 * 학원 시스템의 수강 등록 정보를 관리하는 엔티티
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-18
 */
@Entity
@Table(name = "class_enrollments", indexes = {
    @Index(name = "idx_enrollment_id", columnList = "enrollment_id"),
    @Index(name = "idx_tenant_id", columnList = "tenant_id"),
    @Index(name = "idx_branch_id", columnList = "branch_id"),
    @Index(name = "idx_class_id", columnList = "class_id"),
    @Index(name = "idx_consumer_id", columnList = "consumer_id"),
    @Index(name = "idx_tenant_branch", columnList = "tenant_id,branch_id"),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_payment_status", columnList = "payment_status"),
    @Index(name = "idx_enrollment_date", columnList = "enrollment_date"),
    @Index(name = "idx_is_active", columnList = "is_active"),
    @Index(name = "idx_is_deleted", columnList = "is_deleted")
})
@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ClassEnrollment extends BaseEntity {
    
    /**
     * 수강 상태 열거형
     */
    public enum EnrollmentStatus {
        DRAFT("초안"),
        ACTIVE("수강중"),
        PAUSED("휴원"),
        COMPLETED("완료"),
        CANCELLED("취소"),
        TRANSFERRED("전원");
        
        private final String description;
        
        EnrollmentStatus(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 결제 상태 열거형
     */
    public enum PaymentStatus {
        PENDING("대기중"),
        PAID("결제완료"),
        PARTIAL("부분결제"),
        OVERDUE("연체"),
        CANCELLED("취소");
        
        private final String description;
        
        PaymentStatus(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    // === 기본 정보 ===
    
    /**
     * 수강 등록 UUID (고유 식별자)
     */
    @NotBlank(message = "수강 등록 ID는 필수입니다")
    @Size(max = 36, message = "수강 등록 ID는 36자 이하여야 합니다")
    @Column(name = "enrollment_id", nullable = false, unique = true, length = 36, updatable = false)
    private String enrollmentId;
    
    /**
     * 지점 ID
     */
    @NotNull(message = "지점 ID는 필수입니다")
    @Column(name = "branch_id", nullable = false)
    private Long branchId;
    
    /**
     * 반 ID
     */
    @NotBlank(message = "반 ID는 필수입니다")
    @Size(max = 36, message = "반 ID는 36자 이하여야 합니다")
    @Column(name = "class_id", nullable = false, length = 36)
    private String classId;
    
    /**
     * 수강생 ID
     */
    @Column(name = "consumer_id")
    private Long consumerId;
    
    // === 수강 정보 ===
    
    /**
     * 등록일
     */
    @NotNull(message = "등록일은 필수입니다")
    @Column(name = "enrollment_date", nullable = false)
    private LocalDate enrollmentDate;
    
    /**
     * 수강 시작일
     */
    @Column(name = "start_date")
    private LocalDate startDate;
    
    /**
     * 수강 종료일
     */
    @Column(name = "end_date")
    private LocalDate endDate;
    
    // === 수강료 정보 ===
    
    /**
     * 수강료 플랜 ID
     */
    @Size(max = 36, message = "수강료 플랜 ID는 36자 이하여야 합니다")
    @Column(name = "tuition_plan_id", length = 36)
    private String tuitionPlanId;
    
    /**
     * 수강료 금액
     */
    @Column(name = "tuition_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal tuitionAmount = BigDecimal.ZERO;
    
    /**
     * 결제 상태
     */
    @NotNull(message = "결제 상태는 필수입니다")
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 20)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;
    
    // === 상태 정보 ===
    
    /**
     * 수강 상태
     */
    @NotNull(message = "수강 상태는 필수입니다")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private EnrollmentStatus status = EnrollmentStatus.ACTIVE;
    
    /**
     * 활성화 여부
     */
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    
    // === 메모 및 설정 ===
    
    /**
     * 비고
     */
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    /**
     * 수강별 설정 (JSON)
     */
    @Column(name = "settings_json", columnDefinition = "JSON")
    private String settingsJson;
    
    /**
     * 생성자
     */
    @Column(name = "created_by", length = 100)
    private String createdBy;
    
    /**
     * 수정자
     */
    @Column(name = "updated_by", length = 100)
    private String updatedBy;
    
    // === 연관 관계 ===
    
    /**
     * 반 (Many-to-One)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", referencedColumnName = "class_id", insertable = false, updatable = false)
    @JsonIgnore
    private Class classEntity;
    
    // === 비즈니스 메서드 ===
    
    /**
     * 수강이 활성 상태인지 확인
     */
    public boolean isActiveEnrollment() {
        return isActive != null && isActive && !isDeleted() && EnrollmentStatus.ACTIVE.equals(status);
    }
    
    /**
     * 결제가 완료되었는지 확인
     */
    public boolean isPaid() {
        return PaymentStatus.PAID.equals(paymentStatus);
    }
    
    /**
     * 결제가 대기 중인지 확인
     */
    public boolean isPaymentPending() {
        return PaymentStatus.PENDING.equals(paymentStatus);
    }
    
    /**
     * 수강 기간이 유효한지 확인
     */
    public boolean isValidPeriod() {
        if (startDate == null || endDate == null) {
            return false;
        }
        LocalDate today = LocalDate.now();
        return !today.isBefore(startDate) && !today.isAfter(endDate);
    }
    
    /**
     * 수강 기간이 만료되었는지 확인
     */
    public boolean isExpired() {
        return endDate != null && LocalDate.now().isAfter(endDate);
    }
}

