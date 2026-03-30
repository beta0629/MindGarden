package com.coresolution.consultation.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 스케줄 DTO
 * 상담사 이름과 클라이언트 이름을 포함한 스케줄 정보
 * 
 * @deprecated Use ScheduleResponse instead. This class will be removed in version 2.0.0
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Deprecated
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleDto {
    
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
    private String consultationType;
    private String vacationType; // 휴가 유형 (VACATION 스케줄용)
    private String title;
    private String description;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
