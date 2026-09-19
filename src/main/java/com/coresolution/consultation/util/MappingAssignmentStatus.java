package com.coresolution.consultation.util;

import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;

/**
 * 내담자·쇼핑·대시보드에서 「배정됨」으로 볼 매핑 상태 판정.
 *
 * <p>관리자 생성 배정은 {@link MappingStatus#PENDING_PAYMENT} 로 시작하므로
 * {@link MappingStatus#ACTIVE} 만으로는 게이트가 어긋난다.
 * 모바일 관리자 매핑과 동일하게 ACTIVE / PENDING_PAYMENT / PAYMENT_CONFIRMED 를 포함한다.</p>
 *
 * @author MindGarden
 * @since 2026-09-16
 */
public final class MappingAssignmentStatus {

    private MappingAssignmentStatus() {
    }

    /**
     * 배정된(연결됨) 매핑 상태인지 여부.
     *
     * <p>TERMINATED / CANCELLED / INACTIVE / SUSPENDED / SESSIONS_EXHAUSTED 등은 false.</p>
     *
     * @param status 매핑 상태 (null 허용)
     * @return 배정으로 취급하면 true
     */
    public static boolean isAssigned(MappingStatus status) {
        if (status == null) {
            return false;
        }
        return status == MappingStatus.ACTIVE
                || status == MappingStatus.PENDING_PAYMENT
                || status == MappingStatus.PAYMENT_CONFIRMED;
    }

    /**
     * 쇼핑 체크아웃(재구매)에 선택 가능한 매핑 상태인지 여부.
     *
     * <p>회기 소진·Path B 환불 후에도 상담 연결이 남아 있으면 eligible 하다.
     * {@link #isAssigned} 와 달리 {@link MappingStatus#SESSIONS_EXHAUSTED} 를 포함한다.
     * TERMINATED / CANCELLED / INACTIVE / SUSPENDED / DEPOSIT_* 는 false.</p>
     *
     * @param status 매핑 상태 (null 허용)
     * @return 쇼핑 체크아웃 선택 가능하면 true
     * @author MindGarden
     * @since 2026-09-19
     */
    public static boolean isShopCheckoutEligible(MappingStatus status) {
        if (status == null) {
            return false;
        }
        return status == MappingStatus.ACTIVE
                || status == MappingStatus.PENDING_PAYMENT
                || status == MappingStatus.PAYMENT_CONFIRMED
                || status == MappingStatus.SESSIONS_EXHAUSTED;
    }
}
