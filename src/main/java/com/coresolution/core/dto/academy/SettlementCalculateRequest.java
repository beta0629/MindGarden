package com.coresolution.core.dto.academy;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 정산 계산 요청 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettlementCalculateRequest {
    
    /**
     * 지점 ID
      * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨
 */
    private Long branchId;
    
    /**
     * 정산 기간 (YYYYMM)
     */
    @NotBlank(message = "정산 기간은 필수입니다")
    @Size(max = 10, message = "정산 기간은 10자 이하여야 합니다")
    private String settlementPeriod;
    
    /**
     * 기간 시작일
     */
    @NotNull(message = "기간 시작일은 필수입니다")
    private LocalDate periodStart;
    
    /**
     * 기간 종료일
     */
    @NotNull(message = "기간 종료일은 필수입니다")
    private LocalDate periodEnd;
    
    /**
     * 수수료율 (%)
     */
    private BigDecimal commissionRate;
    
    /**
     * 로열티율 (%)
     */
    private BigDecimal royaltyRate;
}

