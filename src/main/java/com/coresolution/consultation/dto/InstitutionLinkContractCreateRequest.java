package com.coresolution.consultation.dto;

import java.time.LocalDate;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 타기관 연계 등록 요청. 회기 remainingSessions·바우처 필드 없음.
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
    private Long clientId;

    @NotNull
    private Long institutionId;

    private Long consultantId;

    private LocalDate periodStart;

    private LocalDate periodEnd;

    @NotNull
    @Min(0)
    private Long prepaidAmount;

    @NotNull
    @Min(0)
    private Long monthlyAmount;

    @Size(max = 2000)
    private String notes;
}
