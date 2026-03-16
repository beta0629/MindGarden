package com.coresolution.consultation.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 추가 세금 계산 요청 DTO (POST /api/v1/admin/salary/tax/calculate)
 *
 * @author MindGarden
 * @since 2025-03-16
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaxCalculateRequest {

    @NotNull(message = "급여 계산 ID는 필수입니다.")
    private Long calculationId;

    @NotNull(message = "과세 기준 금액은 필수입니다.")
    @DecimalMin(value = "0.0", message = "과세 기준 금액은 0 이상이어야 합니다.")
    private BigDecimal grossAmount;

    @NotNull(message = "세금 유형은 필수입니다.")
    @Size(max = 50)
    private String taxType;

    @NotNull(message = "세율은 필수입니다.")
    @DecimalMin(value = "0.0", message = "세율은 0 이상이어야 합니다.")
    private BigDecimal taxRate;

    @Size(max = 100)
    private String taxName;

    @Size(max = 500)
    private String description;
}
