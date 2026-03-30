package com.coresolution.core.dto.academy;

import com.coresolution.core.domain.academy.AcademyTuitionPayment;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 수강료 결제 생성 요청 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TuitionPaymentRequest {
    
    /**
     * 지점 ID
     */
    @NotNull(message = "지점 ID는 필수입니다")
    /**
     * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨
     */
    @Deprecated    private Long branchId;
    
    /**
     * 청구서 ID
     */
    @NotBlank(message = "청구서 ID는 필수입니다")
    @Size(max = 36, message = "청구서 ID는 36자 이하여야 합니다")
    private String invoiceId;
    
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
     * 결제 금액
     */
    @NotNull(message = "결제 금액은 필수입니다")
    private BigDecimal amount;
    
    /**
     * 통화
     */
    private String currency;
    
    /**
     * 결제 수단
     */
    @NotNull(message = "결제 수단은 필수입니다")
    private AcademyTuitionPayment.PaymentMethod paymentMethod;
    
    /**
     * PG 제공자
     */
    @Size(max = 50, message = "PG 제공자는 50자 이하여야 합니다")
    private String pgProvider;
    
    /**
     * PG 거래 ID
     */
    @Size(max = 100, message = "PG 거래 ID는 100자 이하여야 합니다")
    private String pgTransactionId;
    
    /**
     * PG 상태
     */
    @Size(max = 50, message = "PG 상태는 50자 이하여야 합니다")
    private String pgStatus;
    
    /**
     * 비고
     */
    private String notes;
}

