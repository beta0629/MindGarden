package com.coresolution.core.dto.academy;

import com.coresolution.core.domain.academy.AcademyBillingSchedule;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 청구 스케줄 생성/수정 요청 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillingScheduleRequest {
    
    /**
     * 지점 ID
      * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨
 */
    private Long branchId;
    
    /**
     * 청구 스케줄명
     */
    @NotBlank(message = "청구 스케줄명은 필수입니다")
    @Size(max = 255, message = "청구 스케줄명은 255자 이하여야 합니다")
    private String name;
    
    /**
     * 설명
     */
    private String description;
    
    /**
     * 청구 주기
     */
    @NotNull(message = "청구 주기는 필수입니다")
    private AcademyBillingSchedule.BillingCycle billingCycle;
    
    /**
     * 월 중 청구일 (1-31)
     */
    private Integer dayOfMonth;
    
    /**
     * 주 중 청구일 (0=일요일, 1=월요일, ..., 6=토요일)
     */
    private Integer dayOfWeek;
    
    /**
     * 청구일 오프셋 (일)
     */
    private Integer billingDateOffset;
    
    /**
     * 청구 대상 필터 (JSON)
     */
    private String targetFiltersJson;
    
    /**
     * 청구 방법
     */
    private AcademyBillingSchedule.BillingMethod billingMethod;
    
    /**
     * 고정 금액
     */
    private BigDecimal fixedAmount;
    
    /**
     * 계산 규칙 (JSON)
     */
    private String calculationRuleJson;
    
    /**
     * 활성화 여부
     */
    private Boolean isActive;
}

