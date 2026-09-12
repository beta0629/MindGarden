package com.coresolution.consultation.util;

import com.coresolution.consultation.constant.SessionSuccessionConstants;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.Schedule;

/**
 * 승계 leftover occupying 일정이 COMPLETED가 될 때 소스 rem을 1 소진하는 판정.
 *
 * <p>산식({@code rem − occupying})·CANCELLED leftover 복구와 책임을 분리한다.
 * 예약 시 이미 차감된 일반 완료({@code sessionSequence} 있음, 승계 notes 없음)는 대상이 아니다.</p>
 *
 * @author MindGarden
 * @since 2026-09-12
 */
public final class LeftoverOccupyingCompleteExhaust {

    private LeftoverOccupyingCompleteExhaust() {
    }

    /**
     * 승계 소스 leftover(ACTIVE + rem&gt;0 + 소스 notes) 여부.
     *
     * @param mapping 매칭
     * @return leftover occupying 소진 대상 소스이면 true
     */
    public static boolean isLeftoverSuccessionSource(ConsultantClientMapping mapping) {
        if (mapping == null || mapping.getStatus() != MappingStatus.ACTIVE) {
            return false;
        }
        Integer remaining = mapping.getRemainingSessions();
        if (remaining == null || remaining <= 0) {
            return false;
        }
        String notes = mapping.getNotes();
        return notes != null
                && notes.contains(SessionSuccessionConstants.SOURCE_NOTE_MARKER)
                && notes.contains(SessionSuccessionConstants.SOURCE_NOTE_TARGET_MAPPING_ARROW);
    }

    /**
     * 해당 일정에 대해 leftover occupying 소진을 이미 반영했는지.
     *
     * @param mapping 매칭
     * @param scheduleId 일정 ID
     * @return 멱등 마커가 있으면 true
     */
    public static boolean alreadyExhaustedForSchedule(ConsultantClientMapping mapping, Long scheduleId) {
        if (mapping == null || scheduleId == null) {
            return false;
        }
        String notes = mapping.getNotes();
        if (notes == null || notes.isBlank()) {
            return false;
        }
        return notes.contains(buildExhaustedNote(scheduleId));
    }

    /**
     * leftover occupying 완료면 rem을 1 줄이고, rem=0이면 SESSIONS_EXHAUSTED로 전이한다.
     *
     * <p>다중 occupying이면 rem만 줄이고 ACTIVE를 유지한다.
     * 일반 완료({@code sessionSequence} 없음 또는 승계 소스 아님)는 변경하지 않는다.</p>
     *
     * @param mapping leftover 소스 후보 매칭
     * @param schedule 완료되는 occupying 일정
     * @return rem이 변경되었으면 true
     */
    public static boolean exhaustIfLeftoverOccupying(ConsultantClientMapping mapping, Schedule schedule) {
        if (mapping == null || schedule == null || schedule.getId() == null) {
            return false;
        }
        if (schedule.getSessionSequence() == null) {
            return false;
        }
        if (!isLeftoverSuccessionSource(mapping)) {
            return false;
        }
        if (alreadyExhaustedForSchedule(mapping, schedule.getId())) {
            return false;
        }
        if (!mapping.exhaustLeftoverOccupyingSession()) {
            return false;
        }
        appendExhaustedNote(mapping, schedule.getId());
        return true;
    }

    private static void appendExhaustedNote(ConsultantClientMapping mapping, Long scheduleId) {
        String line = buildExhaustedNote(scheduleId);
        String existing = mapping.getNotes();
        mapping.setNotes(existing == null || existing.isBlank() ? line : existing + "\n" + line);
    }

    private static String buildExhaustedNote(Long scheduleId) {
        return SessionSuccessionConstants.LEFTOVER_OCCUPYING_EXHAUSTED_NOTE_PREFIX + scheduleId;
    }
}
