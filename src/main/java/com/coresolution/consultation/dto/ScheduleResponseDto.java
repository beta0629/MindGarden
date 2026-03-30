package com.coresolution.consultation.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import com.coresolution.consultation.entity.Schedule;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 스케줄 응답 DTO
 * 상담 유형을 한글로 변환하여 반환
 * 
 * @deprecated Use ScheduleResponse instead. This class will be removed in version 2.0.0
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-09
 */
@Deprecated
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleResponseDto {
    
    private Long id;
    private Long consultantId;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private String status;
    private String scheduleType;
    private String consultationType; // 한글로 변환된 상담 유형
    private String title;
    private String description;
    private Long consultationId;
    private Long clientId;
    
    /**
     * Schedule 엔티티를 DTO로 변환
     * 상담 유형을 한글로 변환
     */
    public static ScheduleResponseDto from(Schedule schedule, String koreanConsultationType) {
        return ScheduleResponseDto.builder()
                .id(schedule.getId())
                .consultantId(schedule.getConsultantId())
                .date(schedule.getDate())
                .startTime(schedule.getStartTime())
                .endTime(schedule.getEndTime())
                .status(schedule.getStatus().name())
                .scheduleType(schedule.getScheduleType())
                .consultationType(koreanConsultationType)
                .title(schedule.getTitle())
                .description(schedule.getDescription())
                .consultationId(schedule.getConsultationId())
                .clientId(schedule.getClientId())
                .build();
    }
}
