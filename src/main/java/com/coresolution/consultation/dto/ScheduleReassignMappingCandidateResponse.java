package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 일정 배정 변경 후보 매핑 한 건.
 *
 * <p>같은 상담사·내담자, ACTIVE, 잔여 ≥ 1. 결제대기·일시중지·다른 상담사 제외.
 * 회기 수는 하드코딩하지 않고 매핑의 total/used/remaining 을 그대로 노출한다.</p>
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
}
