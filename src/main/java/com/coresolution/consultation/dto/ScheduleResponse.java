package com.coresolution.consultation.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-11-20
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleResponse {
    
    private Long id;
    private Long consultantId;
    private String consultantName;
    private Long clientId;
    private String clientName;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private String status;
    private String scheduleType;
    private String consultationType; // 한글로 변환된 상담 유형
    private String vacationType; // 휴가 유형 (VACATION 스케줄용)
    private String title;
    private String description;
    private String notes;
    private Long consultationId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    /**
     * Schedule 엔티티를 ScheduleResponse로 변환
     * 상담 유형을 한글로 변환
     */
    public static ScheduleResponse from(Schedule schedule, String koreanConsultationType) {
        return ScheduleResponse.builder()
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
                .createdAt(schedule.getCreatedAt())
                .updatedAt(schedule.getUpdatedAt())
                .build();
    }
    
    /**
     * ScheduleResponseDto에서 ScheduleResponse로 변환 (하위 호환성)
     * @deprecated Use from(Schedule, String) instead
     */
    @Deprecated
    public static ScheduleResponse fromDto(ScheduleResponseDto dto) {
        if (dto == null) {
            return null;
        }
        
        return ScheduleResponse.builder()
                .id(dto.getId())
                .consultantId(dto.getConsultantId())
                .date(dto.getDate())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .status(dto.getStatus())
                .scheduleType(dto.getScheduleType())
                .consultationType(dto.getConsultationType())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .consultationId(dto.getConsultationId())
                .clientId(dto.getClientId())
                .build();
    }
    
    /**
     * ScheduleDto에서 ScheduleResponse로 변환 (하위 호환성)
     * @deprecated Use from(Schedule, String) instead
     */
    @Deprecated
    public static ScheduleResponse fromScheduleDto(ScheduleDto dto) {
        if (dto == null) {
            return null;
        }
        
        return ScheduleResponse.builder()
                .id(dto.getId())
                .consultantId(dto.getConsultantId())
                .consultantName(dto.getConsultantName())
                .clientId(dto.getClientId())
                .clientName(dto.getClientName())
                .date(dto.getDate())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .status(dto.getStatus())
                .scheduleType(dto.getScheduleType())
                .consultationType(dto.getConsultationType())
                .vacationType(dto.getVacationType())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .notes(dto.getNotes())
                .createdAt(dto.getCreatedAt())
                .updatedAt(dto.getUpdatedAt())
                .build();
    }
}

