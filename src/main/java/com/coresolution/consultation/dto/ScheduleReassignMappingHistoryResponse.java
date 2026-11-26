package com.coresolution.consultation.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 일정 배정 변경(회기 정정) 서버 이력 한 건.
 *
 * <p>{@code GET /api/v1/admin/schedules/{id}/reassign-mapping/history}</p>
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleReassignMappingHistoryResponse {

    /** 이력 시각. */
    private LocalDateTime when;

    /** 변경 수행자 사용자 ID. */
    private Long actorUserId;

    /** 변경 수행자 표시명(없으면 null). */
    private String actorUserName;

    /** 변경 사유. */
    private String reason;

    /** 이벤트 타입({@code SESSION_REASSIGN_IN}/{@code SESSION_REASSIGN_OUT}). */
    private String eventType;

    /** 원 배정 ID(JSON·이벤트에서 해석 가능하면). */
    private Long fromMappingId;

    /** 원 배정 패키지명. */
    private String fromMappingName;

    /** 대상 배정 ID. */
    private Long toMappingId;

    /** 대상 배정 패키지명. */
    private String toMappingName;
}
