package com.coresolution.core.dto.academy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * 시간표 응답 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassScheduleResponse {
    
    private String scheduleId;
    private String tenantId;
    private Long branchId;
    private String classId;
    private Integer dayOfWeek;
    private String dayOfWeekName;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer durationMinutes;
    private String room;
    private Integer sessionNumber;
    private LocalDate sessionDate;
    private Boolean isRegular;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

