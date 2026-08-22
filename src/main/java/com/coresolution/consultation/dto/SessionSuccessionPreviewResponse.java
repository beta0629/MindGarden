package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 회기 승계 미리보기 응답.
 *
 * @author CoreSolution
 * @since 2026-08-22
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionSuccessionPreviewResponse {

    private Long sourceMappingId;
    private Integer remainingSessions;
    private Integer usedSessions;
    private Integer totalSessions;
    private Integer occupyingScheduleCount;
    /** 승계가능 = max(0, remaining − occupyingScheduleCount) */
    private Integer transferableSessions;
    private Long consultantId;
    private String consultantName;
    private Long clientId;
    private String clientName;
    private String packageName;
    private Long packagePrice;
    private String status;
}
