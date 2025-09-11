package com.mindgarden.consultation.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 급여 계산 기록 엔티티
 * 상담사별 급여 계산 내역을 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
@Entity
@Table(name = "salary_calculations", indexes = {
    @Index(name = "idx_salary_calculation_consultant_id", columnList = "consultant_id"),
    @Index(name = "idx_salary_calculation_period", columnList = "calculation_period"),
    @Index(name = "idx_salary_calculation_status", columnList = "status"),
    @Index(name = "idx_salary_calculation_created_at", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SalaryCalculation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotNull(message = "상담사 ID는 필수입니다.")
    @Column(name = "consultant_id", nullable = false)
    private Long consultantId;
    
    @NotNull(message = "급여 프로필 ID는 필수입니다.")
    @Column(name = "salary_profile_id", nullable = false)
    private Long salaryProfileId;
    
    @Size(max = 20, message = "계산 기간은 20자 이하여야 합니다.")
    @Column(name = "calculation_period", length = 20, nullable = false)
    private String calculationPeriod; // 2025-01, 2025-W01, etc.
    
    @Column(name = "work_start_date")
    private java.time.LocalDate workStartDate; // 근무 시작일 (매월 1일)
    
    @Column(name = "work_end_date")
    private java.time.LocalDate workEndDate; // 근무 종료일 (매월 말일)
    
    @Column(name = "pay_date")
    private java.time.LocalDate payDate; // 급여 지급일 (다음 달 10일)
    
    @DecimalMin(value = "0.0", message = "기본 급여는 0 이상이어야 합니다.")
    @Column(name = "base_salary", precision = 10, scale = 2, nullable = false)
    private BigDecimal baseSalary; // 기본 급여
    
    @DecimalMin(value = "0.0", message = "옵션 급여는 0 이상이어야 합니다.")
    @Column(name = "option_salary", precision = 10, scale = 2)
    private BigDecimal optionSalary = BigDecimal.ZERO; // 옵션 급여 합계
    
    @DecimalMin(value = "0.0", message = "총 급여는 0 이상이어야 합니다.")
    @Column(name = "total_salary", precision = 10, scale = 2, nullable = false)
    private BigDecimal totalSalary; // 총 급여
    
    @Column(name = "consultation_count")
    private Integer consultationCount = 0; // 상담 건수
    
    @Column(name = "total_hours", precision = 5, scale = 2)
    private BigDecimal totalHours = BigDecimal.ZERO; // 총 상담 시간
    
    @Column(name = "tax_amount", precision = 10, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO; // 세금 금액 (원천징수)
    
    @Size(max = 50, message = "상태는 50자 이하여야 합니다.")
    @Column(name = "status", length = 50, nullable = false)
    private String status; // PENDING, CALCULATED, APPROVED, PAID, CANCELLED
    
    @Size(max = 1000, message = "계산 상세는 1000자 이하여야 합니다.")
    @Column(name = "calculation_details", columnDefinition = "TEXT")
    private String calculationDetails; // 계산 상세 내역 (JSON)
    
    @Size(max = 500, message = "비고는 500자 이하여야 합니다.")
    @Column(name = "remarks", length = 500)
    private String remarks; // 비고
    
    @Column(name = "calculated_at")
    private LocalDateTime calculatedAt; // 계산 완료 시간
    
    @Column(name = "approved_at")
    private LocalDateTime approvedAt; // 승인 시간
    
    @Column(name = "paid_at")
    private LocalDateTime paidAt; // 지급 시간
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = "PENDING";
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // 비즈니스 메서드
    /**
     * 총 급여 계산
     */
    public void calculateTotalSalary() {
        if (baseSalary == null) {
            baseSalary = BigDecimal.ZERO;
        }
        if (optionSalary == null) {
            optionSalary = BigDecimal.ZERO;
        }
        totalSalary = baseSalary.add(optionSalary);
    }
    
    /**
     * 계산 완료 처리
     */
    public void markAsCalculated() {
        this.status = "CALCULATED";
        this.calculatedAt = LocalDateTime.now();
    }
    
    /**
     * 승인 처리
     */
    public void markAsApproved() {
        this.status = "APPROVED";
        this.approvedAt = LocalDateTime.now();
    }
    
    /**
     * 지급 완료 처리
     */
    public void markAsPaid() {
        this.status = "PAID";
        this.paidAt = LocalDateTime.now();
    }
    
    /**
     * 취소 처리
     */
    public void markAsCancelled() {
        this.status = "CANCELLED";
    }
    
    /**
     * 지급 가능한 상태인지 확인
     */
    public boolean isPayable() {
        return "APPROVED".equals(status);
    }
    
    /**
     * 지급 완료 상태인지 확인
     */
    public boolean isPaid() {
        return "PAID".equals(status);
    }
}
