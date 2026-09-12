package com.coresolution.consultation.util;

import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;

/**
 * 일정 취소 동기로 CANCELLED된 잔여 매칭을 ACTIVE로 복구하는 판정.
 *
 * <p>ACTIVE rem&gt;0 가드 배포 이전에 일정 취소만으로 닫힌 결제완료 매칭이 대상이다.
 * 관리자 강제 종료·결제대기 취소 등 다른 CANCELLED는 복구하지 않는다.</p>
 *
 * @author MindGarden
 * @since 2026-09-12
 */
public final class ScheduleCancelLinkedMappingReopen {

    private ScheduleCancelLinkedMappingReopen() {
    }

    /**
     * 일정 취소 동기 잔여(CANCELLED + rem&gt;0 + notes 마커) 여부.
     *
     * @param mapping 매칭
     * @return 복구 대상이면 true
     */
    public static boolean isLeftoverScheduleCancelWithRemaining(ConsultantClientMapping mapping) {
        if (mapping == null || mapping.getStatus() != MappingStatus.CANCELLED) {
            return false;
        }
        Integer remaining = mapping.getRemainingSessions();
        if (remaining == null || remaining <= 0) {
            return false;
        }
        String notes = mapping.getNotes();
        return notes != null
                && notes.contains(AdminServiceUserFacingMessages.NOTES_SCHEDULE_CANCEL_LINKED_MAPPING_MARKER);
    }

    /**
     * 조건 충족 시 ACTIVE로 복구하고 {@code terminatedAt}을 해제한다.
     *
     * @param mapping 매칭
     * @return 상태가 변경되었으면 true
     */
    public static boolean reopenIfLeftover(ConsultantClientMapping mapping) {
        if (!isLeftoverScheduleCancelWithRemaining(mapping)) {
            return false;
        }
        mapping.setStatus(MappingStatus.ACTIVE);
        mapping.setTerminatedAt(null);
        return true;
    }
}
