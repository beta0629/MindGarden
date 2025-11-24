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
 * 청구서 생성 요청 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceRequest {
    
    /**
     * 지점 ID
     */
    @NotNull(message = "지점 ID는 필수입니다")
    private Long branchId;
    
    /**
     * 수강 등록 ID
     */
    @Size(max = 36, message = "수강 등록 ID는 36자 이하여야 합니다")
    private String enrollmentId;
    
    /**
     * 수강생 ID
     */
    private Long consumerId;
    
    /**
     * 청구 스케줄 ID
     */
    @Size(max = 36, message = "청구 스케줄 ID는 36자 이하여야 합니다")
    private String billingScheduleId;
    
    /**
     * 청구서 번호
     */
    @NotBlank(message = "청구서 번호는 필수입니다")
    @Size(max = 50, message = "청구서 번호는 50자 이하여야 합니다")
    private String invoiceNumber;
    
    /**
     * 청구일
     */
    @NotNull(message = "청구일은 필수입니다")
    private LocalDate invoiceDate;
    
    /**
     * 납기일
     */
    @NotNull(message = "납기일은 필수입니다")
    private LocalDate dueDate;
    
    /**
     * 청구 기간 시작일
     */
    private LocalDate billingPeriodStart;
    
    /**
     * 청구 기간 종료일
     */
    private LocalDate billingPeriodEnd;
    
    /**
     * 소계 금액
     */
    @NotNull(message = "소계 금액은 필수입니다")
    private BigDecimal subtotalAmount;
    
    /**
     * 할인 금액
     */
    private BigDecimal discountAmount;
    
    /**
     * 세금
     */
    private BigDecimal taxAmount;
    
    /**
     * 총 금액
     */
    @NotNull(message = "총 금액은 필수입니다")
    private BigDecimal totalAmount;
    
    /**
     * 통화
     */
    private String currency;
    
    /**
     * 청구 항목 상세 (JSON)
     */
    private String lineItemsJson;
    
    /**
     * 비고
     */
    private String notes;
}

