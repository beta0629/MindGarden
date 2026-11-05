package com.coresolution.consultation.dto;

import com.coresolution.consultation.entity.PartnerInstitution;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 월말 상담내역 문서에 기관 정보를 넣을 자리. 생성기 풀구현은 하지 않는다.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyConsultationDocumentPlaceholder {

    private String institutionName;
    private String contactName;
    private String contactPhone;
    private String documentEmail;

    /**
     * 기관 마스터에서 문서용 스냅샷을 만든다.
     *
     * @param institution 기관
     * @return 문서 자리 필드
     */
    public static MonthlyConsultationDocumentPlaceholder fromInstitution(PartnerInstitution institution) {
        if (institution == null) {
            return null;
        }
        return MonthlyConsultationDocumentPlaceholder.builder()
                .institutionName(institution.getName())
                .contactName(institution.getContactName())
                .contactPhone(institution.getContactPhone())
                .documentEmail(institution.getDocumentEmail())
                .build();
    }
}
