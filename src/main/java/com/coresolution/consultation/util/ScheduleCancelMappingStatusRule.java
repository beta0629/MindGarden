package com.coresolution.consultation.util;

import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;

/**
 * 일정 취소·삭제·상태 {@code CANCELLED} 전이가 매핑 상태를 바꿀 수 있는지 판정하는 SSOT.
 *
 * <p>일정 취소는 차감된 회기를 그 매핑에 1회만 되돌린다. 매핑을 {@code CANCELLED}/{@code TERMINATED} 로
 * 바꾸는 일은 환불·강제 종료 경로만 한다. 받은 돈·약정된 매핑
 * ({@link MappingStatus#ACTIVE}, {@link MappingStatus#PAYMENT_CONFIRMED},
 * {@link MappingStatus#DEPOSIT_PENDING}) 은 물론, 결제 대기({@link MappingStatus#PENDING_PAYMENT}) 도
 * 일정 취소만으로 매핑을 닫지 않는다. 형제 일정 일괄 취소도 이 판정이 거절하면 하지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
public final class ScheduleCancelMappingStatusRule {

    private ScheduleCancelMappingStatusRule() {
    }

    /**
     * 입금이 들어왔거나 결제·입금이 약정된 매핑인지.
     *
     * @param status 매핑 상태
     * @return 활성·결제 확인·입금 대기이면 true
     */
    public static boolean isMoneyReceivedOrCommitted(MappingStatus status) {
        return status == MappingStatus.ACTIVE
                || status == MappingStatus.PAYMENT_CONFIRMED
                || status == MappingStatus.DEPOSIT_PENDING;
    }

    /**
     * 일정 취소가 매핑을 CANCELLED/TERMINATED 로 바꿀 수 있는지.
     *
     * @param status 현재 매핑 상태 (null 이면 false)
     * @return 항상 false — 매핑 종료는 환불·강제 종료 경로만
     */
    public static boolean allowsMappingStatusChangeFromScheduleCancel(MappingStatus status) {
        if (status == null) {
            return false;
        }
        return false;
    }
}
