package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 회기 승계 실행 응답.
 *
 * @author CoreSolution
 * @since 2026-08-22
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionSuccessionResponse {

    private Integer transferredCount;
    private Integer occupyingScheduleCount;
    private Integer transferableSessionsBefore;
    private SessionSuccessionMappingSummary sourceMapping;
    private SessionSuccessionMappingSummary targetMapping;
}
