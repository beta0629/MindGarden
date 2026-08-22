package com.coresolution.consultation.constant;

import java.util.List;

/**
 * 회기 승계(Session Succession) 전용 상수.
 *
 * <p>승계가능 산식의 점유 스케줄 status 집합은 {@code SESSION_SUCCESSION_PLAN.md} §3.2 SSOT.
 * {@code SessionSyncServiceImpl} 의 used 정합용 집합(COMPLETED 포함)과 <strong>의도적으로 다름</strong>.</p>
 *
 * @author CoreSolution
 * @since 2026-08-22
 */
public final class SessionSuccessionConstants {

    private SessionSuccessionConstants() {
    }

    /**
     * 스케줄에 이미 잡혀 소스에 남겨야 하는 점유 상태.
     * BOOKED / TENTATIVE_PENDING_PAYMENT / CONFIRMED / IN_PROGRESS.
     * COMPLETED·CANCELLED 제외.
     */
    public static final List<ScheduleStatus> OCCUPYING_STATUSES_FOR_SUCCESSION = List.of(
            ScheduleStatus.BOOKED,
            ScheduleStatus.TENTATIVE_PENDING_PAYMENT,
            ScheduleStatus.CONFIRMED,
            ScheduleStatus.IN_PROGRESS);

    public static final String ENTITY_TYPE_MAPPING = "MAPPING";

    public static final String MSG_SOURCE_NOT_FOUND = "소스 매핑을 찾을 수 없습니다.";
    public static final String MSG_SOURCE_NOT_ACTIVE = "회기 승계는 ACTIVE 매핑에서만 가능합니다.";
    public static final String MSG_INVALID_SESSION_COUNT = "이전 회기 수는 1 이상이어야 합니다.";
    public static final String MSG_EXCEEDS_TRANSFERABLE = "승계가능 회기를 초과할 수 없습니다.";
    public static final String MSG_ZERO_TRANSFERABLE = "스케줄에 묶인 회기만 남아 승계할 수 없습니다.";
    public static final String MSG_SAME_CLIENT = "수혜자는 이전 당사자와 달라야 합니다.";
    public static final String MSG_BENEFICIARY_REQUIRED = "수혜자(기존 ID 또는 신규 등록)가 필요합니다.";
    public static final String MSG_TARGET_CONSULTANT_REQUIRED = "타깃 상담사는 필수입니다.";
    public static final String MSG_TARGET_CONSULTANT_NOT_FOUND = "타깃 상담사를 찾을 수 없습니다.";
    public static final String MSG_NOT_CONSULTANT = "타깃 사용자는 상담사 역할이어야 합니다.";
    public static final String MSG_BENEFICIARY_NOT_FOUND = "수혜자 내담자를 찾을 수 없습니다.";
    public static final String MSG_CONCURRENCY = "회기 정보가 변경되었습니다. 미리보기를 다시 확인한 뒤 재시도해 주세요.";
}
