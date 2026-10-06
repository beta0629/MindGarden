package com.coresolution.consultation.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import com.coresolution.consultation.entity.InstitutionLinkContract;
import com.coresolution.consultation.entity.PartnerInstitution;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 타기관 연계 등록 응답.
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
    private Long clientId;
    private String clientName;
    private Long institutionId;
    private Long consultantId;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private Long prepaidAmount;
    private LocalDateTime prepaidAt;
    private Long monthlyAmount;
    private String status;
    private String notes;
    private MonthlyConsultationDocumentPlaceholder monthlyDocument;

    /**
     * 엔티티 → 응답.
     *
     * @param entity 계약
     * @param institution 기관 (문서 자리)
     * @param clientName 내담자 표시명
     * @return 응답
     */
    public static InstitutionLinkContractResponse fromEntity(InstitutionLinkContract entity,
            PartnerInstitution institution, String clientName) {
        if (entity == null) {
            return null;
        }
        return InstitutionLinkContractResponse.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .clientId(entity.getClientId())
                .clientName(clientName)
                .institutionId(entity.getInstitutionId())
                .consultantId(entity.getConsultantId())
                .periodStart(entity.getPeriodStart())
                .periodEnd(entity.getPeriodEnd())
                .prepaidAmount(entity.getPrepaidAmount())
                .prepaidAt(entity.getPrepaidAt())
                .monthlyAmount(entity.getMonthlyAmount())
                .status(entity.getStatus())
                .notes(entity.getNotes())
                .monthlyDocument(MonthlyConsultationDocumentPlaceholder.fromInstitution(institution))
                .build();
    }
}
