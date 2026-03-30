package com.coresolution.consultation.dto.response;

import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 긴급 확인 필요 내담자 응답 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-03-09
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HighPriorityClientResponse {
    
    private Long clientId;
    private String clientName;
    private String riskLevel;
    private LocalDate lastSessionDate;
    private String emergencyPlan;
    private Integer sessionNumber;
    private String mainIssue;
}
