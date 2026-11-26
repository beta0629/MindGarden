package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 관리자 일정 배정 변경(회기 정정) 실행 결과.
 *
 * <p>금액·전표·결제·취소·환불·알림은 수행하지 않는다.
 * {@code cancelRecommended} 는 원 배정이 결제대기(PENDING_PAYMENT)로 비었을 때(used=0)
 * 「필요 없으면 취소」 UI 힌트다. 자동 취소는 하지 않는다.</p>
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
    /** 대상 배정 패키지명(상세 모달 표시 갱신용). */
    private String targetPackageName;
    /** 원 배정이 결제대기로 비면(PENDING_PAYMENT + used=0) 취소 권장 UI 힌트. */
    private boolean cancelRecommended;
}
