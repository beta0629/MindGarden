package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 어드민 회기 차감 보정 트리거 요청.
 *
 * <p>{@code mappingId} 또는 {@code all} 중 하나만 사용한다.</p>
 * <ul>
 *   <li>{@code mappingId} 단독 → 특정 매핑의 누락 일정만 패치 7.1 로직으로 즉시 차감</li>
 *   <li>{@code all=true} → {@code SessionDeductionRecoveryBatch} 1회 즉시 실행</li>
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
public class SessionRecoveryRequest {

    /** 단건 처리 대상 매핑 ID. {@code all=true} 일 때는 무시된다. */
    private Long mappingId;

    /** {@code true} 인 경우 전체 후보를 한 사이클 즉시 실행. */
    private Boolean all;
}
