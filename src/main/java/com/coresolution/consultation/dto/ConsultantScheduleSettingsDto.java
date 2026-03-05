package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 상담사 스케줄 설정 응답 DTO (TimeSlotGrid 등에서 사용).
 * 전체 Consultant 엔티티 대신 필요한 필드만 반환해 JSON 직렬화 오류를 방지한다.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultantScheduleSettingsDto {

    private String consultationHours;
    private String breakTime;
    private Integer sessionDuration;
    private Integer breakBetweenSessions;
}
