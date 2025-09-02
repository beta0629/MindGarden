package com.mindgarden.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 스케줄 생성 요청 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleCreateDto {
    
    private Long consultantId;
    private Long clientId;
    private String date;
    private String startTime;
    private String endTime;
    private String title;
    private String description;
    private String scheduleType = "CONSULTATION";
    private String consultationType = "INDIVIDUAL";
}
