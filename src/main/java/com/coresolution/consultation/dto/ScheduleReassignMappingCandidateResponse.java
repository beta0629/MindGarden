package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 일정 배정 변경 후보 매핑 한 건.
 *
 * <p>같은 상담사·내담자의 관련 매핑을 모두 노출한다.
 * {@code selectable=true} 는 ACTIVE·잔여 ≥ 1·원 배정 제외와 같다.
 * 고를 수 없으면 {@code blockReason} 에 한글 사유를 넣고, 원 배정은 {@code current=true}.</p>
 *
 * <p>회기 수는 하드코딩하지 않고 매핑의 total/used/remaining 을 그대로 노출한다.</p>
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleReassignMappingCandidateResponse {

    private Long mappingId;
    private Long clientId;
    private Long consultantId;
    private String status;
    private String packageName;
    private Integer totalSessions;
    private Integer usedSessions;
    private Integer remainingSessions;
    /** 현재 일정의 회차(없으면 null). 후보 선택 전 참고용. */
    private Integer sessionSequence;
    /** 배정 변경 대상으로 고를 수 있으면 true. */
    private boolean selectable;
    /** 선택 불가 사유(한글). 가능하면 null. */
    private String blockReason;
    /** 지금 일정에 연결된 원 배정이면 true. */
    private boolean current;
}
