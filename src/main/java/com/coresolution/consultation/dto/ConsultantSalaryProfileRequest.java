package com.coresolution.consultation.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 급여 프로필 생성/수정 요청 DTO
 * POST /api/v1/admin/salary/profiles, PUT /api/v1/admin/salary/profiles/{id}
 *
 * @author MindGarden
 * @since 2026-03-18
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultantSalaryProfileRequest {

    @NotNull(message = "상담사 ID는 필수입니다.")
    private Long consultantId;

    @NotNull(message = "급여 유형은 필수입니다.")
    @Size(max = 50, message = "급여 유형은 50자 이하여야 합니다.")
    private String salaryType;

    @DecimalMin(value = "0.0", message = "기본 급여는 0 이상이어야 합니다.")
    private BigDecimal baseSalary;

    @DecimalMin(value = "0.0", message = "시간당 급여는 0 이상이어야 합니다.")
    private BigDecimal hourlyRate;

    private LocalDateTime contractStartDate;
    private LocalDateTime contractEndDate;

    @Size(max = 1000, message = "계약 조건은 1000자 이하여야 합니다.")
    private String contractTerms;

    @Size(max = 50)
    private String paymentCycle;

    private Boolean isBusinessRegistered;
    @Size(max = 20)
    private String businessRegistrationNumber;
    @Size(max = 100)
    private String businessName;

    private Boolean isActive;

    /**
     * 급여 옵션 동기화용 (null이면 기존 옵션 유지, 빈 배열이면 전부 삭제, 값이 있으면 전체 치환)
     */
    @Valid
    private List<ConsultantSalaryOptionItemRequest> options;
}
