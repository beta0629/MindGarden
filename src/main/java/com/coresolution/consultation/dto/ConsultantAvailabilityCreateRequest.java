package com.coresolution.consultation.dto;

import java.time.DayOfWeek;
import java.time.LocalTime;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 상담사 상담 가능 시간 생성 요청 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-11-20
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultantAvailabilityCreateRequest {
    
    @NotNull(message = "상담사 ID는 필수입니다.")
    private Long consultantId;
    
    @NotNull(message = "요일은 필수입니다.")
    private DayOfWeek dayOfWeek;
    
    @NotNull(message = "시작 시간은 필수입니다.")
    private LocalTime startTime;
    
    @NotNull(message = "종료 시간은 필수입니다.")
    private LocalTime endTime;
    
    private Integer durationMinutes;
    
    private Boolean isActive;
    
    private String notes;
}

