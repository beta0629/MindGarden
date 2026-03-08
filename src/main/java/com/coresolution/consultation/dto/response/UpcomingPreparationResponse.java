package com.coresolution.consultation.dto.response;

import java.time.LocalDate;
import java.time.LocalTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 다음 상담 준비 정보 응답 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-03-09
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpcomingPreparationResponse {
    
    private Long scheduleId;
    private String clientName;
    private LocalDate sessionDate;
    private LocalTime sessionTime;
    private Integer sessionNumber;
    private String lastIssues;
    private String riskLevel;
}
