package com.coresolution.consultation.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 급여 출력(보내기) 요청 본문. 프론트 {@code SalaryExportModal}과 동일 필드.
 *
 * @author CoreSolution
 * @since 2026-05-11
 */
@Data
public class SalaryExportRequest {

    @NotNull
    private Long calculationId;

    /** PDF/EXCEL/CSV — 경로별 엔드포인트에서는 무시 가능 */
    private String format;

    private Boolean includeTaxDetails;

    private Boolean includeCalculationDetails;

    private String consultantName;

    private String period;

    private String emailAddress;
}
