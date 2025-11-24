package com.coresolution.core.domain.academy;

import com.coresolution.consultation.entity.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 학원 청구 스케줄 엔티티
 * 학원 시스템의 월별 청구 스케줄 정보를 관리하는 엔티티
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Entity
@Table(name = "academy_billing_schedules", indexes = {
    @Index(name = "idx_billing_schedule_id", columnList = "billing_schedule_id"),
    @Index(name = "idx_tenant_id", columnList = "tenant_id"),
    @Index(name = "idx_branch_id", columnList = "branch_id"),
    @Index(name = "idx_tenant_branch", columnList = "tenant_id,branch_id"),
    @Index(name = "idx_billing_cycle", columnList = "billing_cycle"),
    @Index(name = "idx_next_billing_date", columnList = "next_billing_date"),
    @Index(name = "idx_is_active", columnList = "is_active"),
    @Index(name = "idx_is_deleted", columnList = "is_deleted")
})
@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class AcademyBillingSchedule extends BaseEntity {
    
    /**
     * 청구 주기 열거형
     */
    public enum BillingCycle {
        MONTHLY("월간"),
        WEEKLY("주간"),
        CUSTOM("사용자 정의");
        
        private final String description;
        
        BillingCycle(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 청구 방법 열거형
     */
    public enum BillingMethod {
        TUITION_AMOUNT("수강료 금액"),
        FIXED("고정 금액"),
        CALCULATED("계산식");
        
        private final String description;
        
        BillingMethod(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    // === 기본 정보 ===
    
    /**
     * 청구 스케줄 UUID (고유 식별자)
     */
    @NotBlank(message = "청구 스케줄 ID는 필수입니다")
    @Size(max = 36, message = "청구 스케줄 ID는 36자 이하여야 합니다")
    @Column(name = "billing_schedule_id", nullable = false, unique = true, length = 36, updatable = false)
    private String billingScheduleId;
    
    /**
     * 지점 ID
     */
    @Column(name = "branch_id")
    private Long branchId;
    
    /**
     * 청구 스케줄명
     */
    @NotBlank(message = "청구 스케줄명은 필수입니다")
    @Size(max = 255, message = "청구 스케줄명은 255자 이하여야 합니다")
    @Column(name = "name", nullable = false, length = 255)
    private String name;
    
    /**
     * 설명
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    // === 청구 주기 설정 ===
    
    /**
     * 청구 주기
     */
    @NotNull(message = "청구 주기는 필수입니다")
    @Enumerated(EnumType.STRING)
    @Column(name = "billing_cycle", nullable = false, length = 20)
    private BillingCycle billingCycle;
    
    /**
     * 월 중 청구일 (1-31)
     */
    @Column(name = "day_of_month")
    private Integer dayOfMonth;
    
    /**
     * 주 중 청구일 (0=일요일, 1=월요일, ..., 6=토요일)
     */
    @Column(name = "day_of_week")
    private Integer dayOfWeek;
    
    /**
     * 청구일 오프셋 (일)
     */
    @Column(name = "billing_date_offset")
    private Integer billingDateOffset;
    
    // === 청구 대상 필터 ===
    
    /**
     * 청구 대상 필터 (JSON)
     */
    @Column(name = "target_filters_json", columnDefinition = "JSON")
    private String targetFiltersJson;
    
    // === 청구 금액 설정 ===
    
    /**
     * 청구 방법
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "billing_method", length = 50)
    private BillingMethod billingMethod;
    
    /**
     * 고정 금액
     */
    @Column(name = "fixed_amount", precision = 15, scale = 2)
    private BigDecimal fixedAmount;
    
    /**
     * 계산 규칙 (JSON)
     */
    @Column(name = "calculation_rule_json", columnDefinition = "JSON")
    private String calculationRuleJson;
    
    // === 상태 정보 ===
    
    /**
     * 활성화 여부
     */
    @Column(name = "is_active", nullable = false)
    private Boolean isActive;
    
    /**
     * 마지막 청구일
     */
    @Column(name = "last_billing_date")
    private LocalDate lastBillingDate;
    
    /**
     * 다음 청구일
     */
    @Column(name = "next_billing_date")
    private LocalDate nextBillingDate;
    
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
    
    // === 비즈니스 메서드 ===
    
    /**
     * 활성 상태 확인
     */
    public boolean isActiveSchedule() {
        return isActive != null && isActive && !isDeleted();
    }
    
    /**
     * 다음 청구일이 지났는지 확인
     */
    public boolean isBillingDue() {
        if (nextBillingDate == null) {
            return false;
        }
        return LocalDate.now().isAfter(nextBillingDate) || LocalDate.now().equals(nextBillingDate);
    }
}

