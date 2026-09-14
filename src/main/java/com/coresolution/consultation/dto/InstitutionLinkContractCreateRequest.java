package com.coresolution.consultation.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 타기관 연계 계약 생성 요청. 회기 remainingSessions 없음.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstitutionLinkContractCreateRequest {

    @NotNull
    private Long consultantId;

    @NotNull
    private Long clientId;

    @NotNull
    private LocalDate periodStart;

    private LocalDate periodEnd;

    private Long prepaidAmount;

    private LocalDateTime prepaidAt;

    private Long monthlyAmount;

    @NotBlank
    @Size(max = 50)
    private String status;

    @Size(max = 200)
    private String institutionName;

    private String notes;
}
