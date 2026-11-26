package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 일정 배정 변경(회기 정정) 미리보기. DB 변경 없음.
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleReassignMappingPreviewResponse {

    private Long scheduleId;
    private Long originMappingId;
    private Long targetMappingId;
    private boolean sessionWouldRestoreOnOrigin;
    private Integer plannedSessionSequence;
    private Integer originRemainingAfter;
    private Integer originUsedAfter;
    private Integer targetRemainingAfter;
    private Integer targetUsedAfter;
    private Integer originTotalSessions;
    private Integer targetTotalSessions;
    /** 원 배정이 결제대기로 비면(PENDING_PAYMENT + usedAfter=0) 취소 권장 UI 힌트. */
    private boolean cancelRecommended;
}
