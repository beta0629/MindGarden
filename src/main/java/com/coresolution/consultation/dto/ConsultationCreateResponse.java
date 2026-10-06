package com.coresolution.consultation.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import com.coresolution.consultation.entity.Consultation;
import lombok.Builder;
import lombok.Getter;

/**
 * 상담 요청(Consultation) 생성 결과.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@Getter
@Builder
public class ConsultationCreateResponse {

    private final Long id;
    private final String status;
    private final Long clientId;
    private final Long consultantId;
    private final LocalDate consultationDate;
    private final LocalTime startTime;
    private final LocalTime endTime;
    private final String title;

    /**
     * @param consultation 저장된 상담 요청
     * @return 응답 DTO
     */
    public static ConsultationCreateResponse fromEntity(Consultation consultation) {
        return ConsultationCreateResponse.builder()
                .id(consultation.getId())
                .status(consultation.getStatus())
                .clientId(consultation.getClientId())
                .consultantId(consultation.getConsultantId())
                .consultationDate(consultation.getConsultationDate())
                .startTime(consultation.getStartTime())
                .endTime(consultation.getEndTime())
                .title(consultation.getTitle())
                .build();
    }
}
