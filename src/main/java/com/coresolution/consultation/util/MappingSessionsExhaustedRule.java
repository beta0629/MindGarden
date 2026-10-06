package com.coresolution.consultation.util;

import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;

/**
 * 매핑을 회기 소진({@link MappingStatus#SESSIONS_EXHAUSTED})으로 바꿀 수 있는지 판정하는 SSOT.
 *
 * <p>회기 소진 전이는 활성({@link MappingStatus#ACTIVE}) 매핑에서만 일어난다.
 * 종료·취소({@link MappingStatus#TERMINATED}, {@link MappingStatus#CANCELLED})는 종료 사유·시각을 보존해야 하고,
 * 입금 확인 전({@link MappingPaymentScheduleGate#isAwaitingDeposit})은 잔여 회기가 아직 채워지지 않아
 * 잔여 0 이 소진을 뜻하지 않는다. 그 밖의 상태(승인 대기·중단 등)도 바꾸지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
public final class MappingSessionsExhaustedRule {

    private MappingSessionsExhaustedRule() {
    }

    /**
     * 이 상태에서 회기 소진으로 전이할 수 있는지.
     *
     * @param status 현재 매핑 상태
     * @return {@link MappingStatus#ACTIVE} 이면 true
     */
    public static boolean allowsTransitionFrom(MappingStatus status) {
        if (status != MappingStatus.ACTIVE) {
            return false;
        }
        return !MappingPaymentScheduleGate.isAwaitingDeposit(status);
    }

    /**
     * 잔여 회기와 상태로 회기 소진 전이 대상인지.
     *
     * @param status            현재 매핑 상태
     * @param remainingSessions 잔여 회기 (null 이면 판정 불가 → false)
     * @return 활성 매핑이고 잔여가 0 이하이면 true
     */
    public static boolean shouldMarkExhausted(MappingStatus status, Integer remainingSessions) {
        return remainingSessions != null && remainingSessions <= 0 && allowsTransitionFrom(status);
    }
}
