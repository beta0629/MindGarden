package com.coresolution.consultation.util;

import java.time.LocalDateTime;
import java.util.List;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.SessionSuccessionConstants;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.Schedule;

/**
 * 이미 COMPLETED된 leftover occupying의 rem 잔존을 백필하는 판정.
 *
 * <p>{@link LeftoverOccupyingCompleteExhaust}(완료 훅)와 책임을 분리한다.
 * 산식·CANCELLED leftover 복구는 다루지 않는다.</p>
 *
 * @author MindGarden
 * @since 2026-09-12
 */
public final class LeftoverOccupyingCompleteExhaustBackfill {

    private LeftoverOccupyingCompleteExhaustBackfill() {
    }

    /**
     * 백필 판정.
     */
    public enum Decision {
        APPLY,
        SKIP_OCCUPYING_IN_PROGRESS,
        SKIP_CANCELLED,
        SKIP_TRUE_REMAINING,
        SKIP_NO_SUCCESSION,
        SKIP_ALREADY_EXHAUSTED,
        SKIP_INVALID
    }

    /**
     * 승계 이력(소스 notes 화살표·승계 마커 또는 SessionSuccession 감사) 여부.
     *
     * @param mapping leftover 소스 후보
     * @param hasSessionSuccessionAudit 해당 매핑 entityId의 승계 감사 로그 존재
     * @return 승계 이력이 있으면 true
     */
    public static boolean hasSuccessionHistory(
            ConsultantClientMapping mapping,
            boolean hasSessionSuccessionAudit) {
        if (hasSessionSuccessionAudit) {
            return true;
        }
        if (mapping == null) {
            return false;
        }
        String notes = mapping.getNotes();
        if (notes == null || notes.isBlank()) {
            return false;
        }
        return notes.contains(SessionSuccessionConstants.SOURCE_NOTE_TARGET_MAPPING_ARROW)
                || notes.contains(SessionSuccessionConstants.SOURCE_NOTE_MARKER);
    }

    /**
     * sessionSequence가 있는 종료 occupying 중 승계 이후 leftover 완료 건수.
     *
     * @param deductedCompleted sessionSequence가 있는 COMPLETED 상담 일정
     * @param successionAt 승계 시각(없으면 시간 필터 없음)
     * @return leftover occupying 완료 건수
     */
    public static int countLeftoverOccupyingDeducted(
            List<Schedule> deductedCompleted,
            LocalDateTime successionAt) {
        if (deductedCompleted == null || deductedCompleted.isEmpty()) {
            return 0;
        }
        int count = 0;
        for (Schedule schedule : deductedCompleted) {
            if (!isLeftoverOccupyingCompleted(schedule, successionAt)) {
                continue;
            }
            count++;
        }
        return count;
    }

    /**
     * 백필 적용 여부 판정.
     *
     * @param mapping 매칭
     * @param occupyingInProgress 진행 중 occupying 수
     * @param leftoverOccupyingDeducted sessionSequence로 차감된 leftover occupying 완료 수
     * @param hasSessionSuccessionAudit 승계 감사 로그 존재
     * @return 판정
     */
    public static Decision decide(
            ConsultantClientMapping mapping,
            int occupyingInProgress,
            int leftoverOccupyingDeducted,
            boolean hasSessionSuccessionAudit) {
        if (mapping == null) {
            return Decision.SKIP_INVALID;
        }
        String tenantId = mapping.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            return Decision.SKIP_INVALID;
        }
        MappingStatus status = mapping.getStatus();
        if (status == MappingStatus.CANCELLED) {
            return Decision.SKIP_CANCELLED;
        }
        if (status != MappingStatus.ACTIVE) {
            return Decision.SKIP_INVALID;
        }
        Integer remaining = mapping.getRemainingSessions();
        if (remaining == null || remaining <= 0) {
            return Decision.SKIP_ALREADY_EXHAUSTED;
        }
        if (!hasSuccessionHistory(mapping, hasSessionSuccessionAudit)) {
            return Decision.SKIP_NO_SUCCESSION;
        }
        if (occupyingInProgress > 0) {
            return Decision.SKIP_OCCUPYING_IN_PROGRESS;
        }
        if (leftoverOccupyingDeducted <= 0 || remaining != leftoverOccupyingDeducted) {
            return Decision.SKIP_TRUE_REMAINING;
        }
        return Decision.APPLY;
    }

    /**
     * leftover occupying이 모두 종료되고 rem이 그 예약분과 맞으면 rem을 소진한다.
     *
     * <p>런타임 {@link ConsultantClientMapping#exhaustLeftoverOccupyingSession()}과 동일하게
     * rem이 줄어든 만큼 usedSessions를 올리고 totalSessions는 유지한다
     * ({@code total == used + remaining}). rem→0이면 SESSIONS_EXHAUSTED로 전이한다.</p>
     *
     * @param mapping leftover 소스 후보
     * @param leftoverCompleted leftover occupying 완료 일정
     * @param occupyingInProgress 진행 중 occupying 수
     * @param leftoverOccupyingDeducted leftover occupying 완료(차감) 수
     * @param hasSessionSuccessionAudit 승계 감사 로그 존재
     * @return rem이 소진되었으면 true
     */
    public static boolean applyIfEligible(
            ConsultantClientMapping mapping,
            List<Schedule> leftoverCompleted,
            int occupyingInProgress,
            int leftoverOccupyingDeducted,
            boolean hasSessionSuccessionAudit) {
        if (decide(mapping, occupyingInProgress, leftoverOccupyingDeducted, hasSessionSuccessionAudit)
                != Decision.APPLY) {
            return false;
        }
        // decide(APPLY)면 rem == leftoverOccupyingDeducted (>0). rem 감소분만큼 used 증가.
        int toExhaust = leftoverOccupyingDeducted;
        for (int i = 0; i < toExhaust; i++) {
            if (!mapping.exhaustLeftoverOccupyingSession()) {
                throw new IllegalStateException(
                        "leftover occupying backfill failed to exhaust session; "
                                + "expectedRemDecrease=" + toExhaust
                                + ", exhaustedSoFar=" + i
                                + ", mappingId=" + mapping.getId());
            }
        }
        if (leftoverCompleted != null) {
            for (Schedule schedule : leftoverCompleted) {
                if (schedule == null || schedule.getId() == null) {
                    continue;
                }
                appendExhaustedNote(mapping, schedule.getId());
            }
        }
        return true;
    }

    private static boolean isLeftoverOccupyingCompleted(Schedule schedule, LocalDateTime successionAt) {
        if (schedule == null || schedule.getSessionSequence() == null) {
            return false;
        }
        if (schedule.getStatus() != ScheduleStatus.COMPLETED) {
            return false;
        }
        if (successionAt == null) {
            return true;
        }
        return isOnOrAfterSuccession(schedule, successionAt);
    }

    private static boolean isOnOrAfterSuccession(Schedule schedule, LocalDateTime successionAt) {
        LocalDateTime updatedAt = schedule.getUpdatedAt();
        if (updatedAt != null) {
            return !updatedAt.isBefore(successionAt);
        }
        LocalDateTime createdAt = schedule.getCreatedAt();
        if (createdAt != null) {
            return !createdAt.isBefore(successionAt);
        }
        if (schedule.getDate() != null && schedule.getStartTime() != null) {
            return !LocalDateTime.of(schedule.getDate(), schedule.getStartTime()).isBefore(successionAt);
        }
        return true;
    }

    private static void appendExhaustedNote(ConsultantClientMapping mapping, Long scheduleId) {
        if (LeftoverOccupyingCompleteExhaust.alreadyExhaustedForSchedule(mapping, scheduleId)) {
            return;
        }
        String line = SessionSuccessionConstants.LEFTOVER_OCCUPYING_EXHAUSTED_NOTE_PREFIX + scheduleId;
        String existing = mapping.getNotes();
        mapping.setNotes(existing == null || existing.isBlank() ? line : existing + "\n" + line);
    }
}
