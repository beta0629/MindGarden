package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 관리자 일정 배정 변경(회기 정정) 실행 결과.
 *
 * <p>금액·전표·결제·취소·환불·알림은 수행하지 않는다.
 * {@code cancelRecommended} 는 원 매핑 잔여 정리(상태 종료 등) UI 힌트다.</p>
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleReassignMappingResponse {

    private Long scheduleId;
    private Long originMappingId;
    private Long targetMappingId;
    private Integer sessionSequence;
    private Integer originTotalSessions;
    private Integer originUsedSessions;
    private Integer originRemainingSessions;
    private Integer targetTotalSessions;
    private Integer targetUsedSessions;
    private Integer targetRemainingSessions;
    /** 원 매핑에 잔여 회기가 남아 관리자 후속 정리(종료 등)를 권장하면 true. */
    private boolean cancelRecommended;
}
