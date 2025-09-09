package com.mindgarden.consultation.dto;

import java.time.DayOfWeek;
import java.time.LocalTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 상담사 상담 가능 시간 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultantAvailabilityDto {
    
    private Long id;
    private Long consultantId;
    private DayOfWeek dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer durationMinutes;
    private Boolean isActive;
    private String notes;
}
