package com.coresolution.consultation.dto;

import com.coresolution.consultation.entity.PartnerInstitution;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 연계 기관 응답. 월말 상담내역 문서에 쓰일 수신 필드를 포함한다.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartnerInstitutionResponse {

    private Long id;
    private String tenantId;
    private String name;
    private String contactName;
    private String contactPhone;
    private String documentEmail;
    private String notes;
    private MonthlyConsultationDocumentPlaceholder monthlyDocument;

    /**
     * 엔티티 → 응답.
     *
     * @param entity 기관
     * @return 응답
     */
    public static PartnerInstitutionResponse fromEntity(PartnerInstitution entity) {
        if (entity == null) {
            return null;
        }
        return PartnerInstitutionResponse.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .name(entity.getName())
                .contactName(entity.getContactName())
                .contactPhone(entity.getContactPhone())
                .documentEmail(entity.getDocumentEmail())
                .notes(entity.getNotes())
                .monthlyDocument(MonthlyConsultationDocumentPlaceholder.fromInstitution(entity))
                .build();
    }
}
