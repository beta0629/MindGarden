package com.coresolution.consultation.dto;

import java.time.LocalDate;
import com.coresolution.consultation.entity.InstitutionLinkConsultationLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 타기관 연계 상담일지 응답.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstitutionLinkConsultationLogResponse {

    private Long id;
    private String tenantId;
    private Long contractId;
    private Long scheduleId;
    private Long clientId;
    private Long consultantId;
    private LocalDate sessionDate;
    private Integer sessionNumber;
    private String clientCondition;
    private Boolean isSessionCompleted;

    /**
     * 엔티티 → 응답.
     *
     * @param entity 일지
     * @return 응답
     */
    public static InstitutionLinkConsultationLogResponse fromEntity(InstitutionLinkConsultationLog entity) {
        if (entity == null) {
            return null;
        }
        return InstitutionLinkConsultationLogResponse.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .contractId(entity.getContractId())
                .scheduleId(entity.getScheduleId())
                .clientId(entity.getClientId())
                .consultantId(entity.getConsultantId())
                .sessionDate(entity.getSessionDate())
                .sessionNumber(entity.getSessionNumber())
                .clientCondition(entity.getClientCondition())
                .isSessionCompleted(entity.getIsSessionCompleted())
                .build();
    }
}
