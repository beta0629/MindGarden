package com.mindgarden.consultation.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
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
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "salary_calculations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalaryCalculation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consultant_id", nullable = false)
    private User consultant;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "salary_profile_id", nullable = false)
    private SalaryProfile salaryProfile;
    
    @Column(name = "calculation_period_start", nullable = false)
    private LocalDate calculationPeriodStart;
    
    @Column(name = "calculation_period_end", nullable = false)
    private LocalDate calculationPeriodEnd;
    
    @Column(name = "calculation_period", length = 20)
    private String calculationPeriod;
    
    @Column(name = "base_salary", precision = 15, scale = 2)
    private BigDecimal baseSalary;
    
    @Column(name = "total_hours_worked", precision = 8, scale = 2)
    private BigDecimal totalHoursWorked;
    
    @Column(name = "hourly_earnings", precision = 15, scale = 2)
    private BigDecimal hourlyEarnings;
    
    @Column(name = "total_consultations", nullable = false)
    private Integer totalConsultations;
    
    @Column(name = "completed_consultations", nullable = false)
    private Integer completedConsultations;
    
    @Column(name = "commission_earnings", precision = 15, scale = 2)
    private BigDecimal commissionEarnings;
    
    @Column(name = "bonus_earnings", precision = 15, scale = 2)
    private BigDecimal bonusEarnings;
    
    @Column(name = "deductions", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal deductions = BigDecimal.ZERO;
    
    @Column(name = "gross_salary", precision = 15, scale = 2)
    private BigDecimal grossSalary;
    
    @Column(name = "net_salary", precision = 15, scale = 2)
    private BigDecimal netSalary;
    
    @Column(name = "total_salary", precision = 10, scale = 2, nullable = false)
    private BigDecimal totalSalary;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private SalaryStatus status;
    
    @Column(name = "calculated_at", nullable = false)
    private LocalDateTime calculatedAt;
    
    @Column(name = "calculated_by", length = 50)
    private String calculatedBy;
    
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
    
    @Column(name = "paid_at")
    private LocalDateTime paidAt;
    
    @Column(name = "branch_code", length = 20)
    private String branchCode;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum SalaryStatus {
        PENDING, CALCULATED, APPROVED, PAID, CANCELLED
    }
}