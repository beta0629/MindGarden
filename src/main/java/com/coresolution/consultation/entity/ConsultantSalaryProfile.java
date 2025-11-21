package com.coresolution.consultation.entity;

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
 * 상담사 급여 프로필 엔티티
 * 상담사의 급여 체계와 옵션을 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
@Entity
@Table(name = "consultant_salary_profiles", indexes = {
    @Index(name = "idx_consultant_salary_consultant_id", columnList = "consultant_id"),
    @Index(name = "idx_consultant_salary_type", columnList = "salary_type"),
    @Index(name = "idx_consultant_salary_is_active", columnList = "is_active")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConsultantSalaryProfile {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotNull(message = "상담사 ID는 필수입니다.")
    @Column(name = "consultant_id", nullable = false)
    private Long consultantId;
    
    @NotNull(message = "급여 유형은 필수입니다.")
    @Size(max = 50, message = "급여 유형은 50자 이하여야 합니다.")
    @Column(name = "salary_type", length = 50, nullable = false)
    private String salaryType; // REGULAR, FREELANCE, PART_TIME, CONTRACT
    
    @DecimalMin(value = "0.0", message = "기본 급여는 0 이상이어야 합니다.")
    @Column(name = "base_salary", precision = 10, scale = 2)
    private BigDecimal baseSalary; // 정규직 연봉 또는 프리랜서 기본 상담료
    
    @DecimalMin(value = "0.0", message = "시간당 급여는 0 이상이어야 합니다.")
    @Column(name = "hourly_rate", precision = 10, scale = 2)
    private BigDecimal hourlyRate; // 시간제 급여
    
    @Column(name = "contract_start_date")
    private LocalDateTime contractStartDate; // 계약 시작일
    
    @Column(name = "contract_end_date")
    private LocalDateTime contractEndDate; // 계약 종료일
    
    @Size(max = 1000, message = "계약 조건은 1000자 이하여야 합니다.")
    @Column(name = "contract_terms", columnDefinition = "TEXT")
    private String contractTerms; // 계약 조건 상세
    
    @Column(name = "payment_cycle", length = 50)
    private String paymentCycle; // MONTHLY, WEEKLY, BIWEEKLY, PER_CONSULTATION
    
    @Column(name = "is_business_registered")
    private Boolean isBusinessRegistered = false; // 사업자 등록 여부
    
    @Size(max = 20, message = "사업자 등록번호는 20자 이하여야 합니다.")
    @Column(name = "business_registration_number", length = 20)
    private String businessRegistrationNumber; // 사업자 등록번호 (예: 123-45-67890)
    
    @Size(max = 100, message = "사업자명은 100자 이하여야 합니다.")
    @Column(name = "business_name", length = 100)
    private String businessName; // 사업자명
    
    @Column(name = "is_active")
    private Boolean isActive = true; // 활성화 여부
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // 비즈니스 메서드
    /**
     * 계약 만료 여부 확인
     */
    public boolean isContractExpired() {
        if (contractEndDate == null) {
            return false; // 무기한 계약
        }
        return LocalDateTime.now().isAfter(contractEndDate);
    }
    
    /**
     * 계약 활성화 여부 확인
     */
    public boolean isContractActive() {
        return isActive && !isContractExpired();
    }
    
    /**
     * 급여 유형이 프리랜서인지 확인
     */
    public boolean isFreelance() {
        return "FREELANCE".equals(salaryType);
    }
    
    /**
     * 급여 유형이 정규직인지 확인
     */
    public boolean isRegular() {
        return "REGULAR".equals(salaryType);
    }
}
