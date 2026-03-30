package com.coresolution.core.dto.academy;

import com.coresolution.core.domain.academy.AcademyBillingSchedule;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 청구 스케줄 응답 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillingScheduleResponse {
    
    private String billingScheduleId;
    private String tenantId;
    /**
     * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨
     */
    @Deprecated    private Long branchId;
    private String name;
    private String description;
    private AcademyBillingSchedule.BillingCycle billingCycle;
    private Integer dayOfMonth;
    private Integer dayOfWeek;
    private Integer billingDateOffset;
    private String targetFiltersJson;
    private AcademyBillingSchedule.BillingMethod billingMethod;
    private BigDecimal fixedAmount;
    private String calculationRuleJson;
    private Boolean isActive;
    private LocalDate lastBillingDate;
    private LocalDate nextBillingDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

