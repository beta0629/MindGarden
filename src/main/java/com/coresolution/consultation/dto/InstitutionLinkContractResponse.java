package com.coresolution.consultation.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import com.coresolution.consultation.entity.InstitutionLinkContract;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 타기관 연계 계약 응답.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstitutionLinkContractResponse {

    private Long id;
    private String tenantId;
    private Long consultantId;
    private Long clientId;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private Long prepaidAmount;
    private LocalDateTime prepaidAt;
    private Long monthlyAmount;
    private String status;
    private String institutionName;
    private String notes;
    private Long sourceMappingId;

    /**
     * 엔티티 → 응답.
     *
     * @param entity 계약
     * @return 응답
     */
    public static InstitutionLinkContractResponse fromEntity(InstitutionLinkContract entity) {
        if (entity == null) {
            return null;
        }
        return InstitutionLinkContractResponse.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .consultantId(entity.getConsultantId())
                .clientId(entity.getClientId())
                .periodStart(entity.getPeriodStart())
                .periodEnd(entity.getPeriodEnd())
                .prepaidAmount(entity.getPrepaidAmount())
                .prepaidAt(entity.getPrepaidAt())
                .monthlyAmount(entity.getMonthlyAmount())
                .status(entity.getStatus())
                .institutionName(entity.getInstitutionName())
                .notes(entity.getNotes())
                .sourceMappingId(entity.getSourceMappingId())
                .build();
    }
}
