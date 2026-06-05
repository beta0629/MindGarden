package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 어드민 회기 차감 보정 트리거 응답.
 *
 * <ul>
 *   <li>{@code mappingId} 단건 → {@code processed} 만 채워지고 {@code skipped/alerted} 는 0.</li>
 *   <li>{@code all=true} → 배치 1 사이클 결과 (success / skipped / alerted).</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-06-05
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionRecoveryResponse {

    /** 정상 차감 처리된 일정 수. */
    private int processed;

    /** 처리 대상이지만 멱등 skip / 가드 위반 등으로 건너뛴 일정 수. */
    private int skipped;

    /** 활성 매핑 없음·잔여 회기 0 등으로 어드민 알림 적재된 일정 수. */
    private int alerted;
}
