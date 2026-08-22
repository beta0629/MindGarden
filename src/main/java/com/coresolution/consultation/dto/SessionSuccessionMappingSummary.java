package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 회기 승계 응답용 매핑 요약.
 *
 * @author CoreSolution
 * @since 2026-08-22
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionSuccessionMappingSummary {

    private Long id;
    private Integer remainingSessions;
    private Integer usedSessions;
    private Integer totalSessions;
    private Long consultantId;
    private String consultantName;
    private Long clientId;
    private String clientName;
    private String status;
    private String packageName;
}
