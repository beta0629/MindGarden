package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 관리자 매칭 상태-only 종료 결과.
 *
 * @author CoreSolution
 * @since 2026-10-14
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MappingStatusCloseResponse {

    private Long mappingId;
    private String status;
    /** 이미 TERMINATED/CANCELLED 여서 변경 없이 성공한 경우 true. */
    private boolean alreadyClosed;
    private int cancelledScheduleCount;
    private Integer remainingSessions;
    private Integer usedSessions;
    private String paymentStatus;
}
