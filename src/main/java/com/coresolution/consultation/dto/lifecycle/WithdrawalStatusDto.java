package com.coresolution.consultation.dto.lifecycle;

import java.time.LocalDateTime;

import com.coresolution.consultation.constant.LifecycleState;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 자발 탈퇴 현황 응답 DTO — GET /api/v1/mypage/withdrawal/status.
 *
 * <p>현재 lifecycle 상태와 WITHDRAWAL_PENDING 인 경우 신청 시각·만료 시각을 함께 노출한다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-05
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WithdrawalStatusDto {

    private Long userId;
    private LifecycleState lifecycleState;
    private LocalDateTime withdrawalRequestedAt;
    private LocalDateTime withdrawalExpiresAt;
    private boolean cancellable;
}
