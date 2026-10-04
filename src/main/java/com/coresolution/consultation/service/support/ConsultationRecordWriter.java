package com.coresolution.consultation.service.support;

import java.util.Objects;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.util.ConsultationRecordWriterRoles;

/**
 * 상담일지 쓰기(작성·수정) 권한 판정을 통과한 작성자 정보 (불변).
 *
 * <p>{@link ConsultationRecordAccessGuard#requireCreateAccess}·{@link ConsultationRecordAccessGuard#requireWriteAccess}
 * 만 만든다. 서비스는 이 값이 있으면 권한 재판정 없이 저장하고, {@code scheduleId}·{@code recordId} 로
 * 판정 대상과 저장 대상이 같은지 확인한다. 실제 작성자 id·역할은 {@code created_by_*}·{@code updated_by_*}
 * 컬럼과 수정 감사 행에 남긴다.</p>
 *
 * @param userId        실제 작성자 users.id
 * @param role          실제 작성자 역할명 ({@link UserRole#name()})
 * @param tenantManager 같은 테넌트 관리자 계열(ADMIN·STAFF) 여부
 * @param scheduleId    작성 판정 대상 일정 ID (수정이면 null)
 * @param recordId      수정 판정 대상 일지 ID (작성이면 null)
 * @author CoreSolution
 * @since 2026-10-06
 */
public record ConsultationRecordWriter(Long userId, String role, boolean tenantManager, Long scheduleId,
        Long recordId) {

    /**
     * 작성(신규) 판정 결과.
     *
     * @param caller        세션 사용자
     * @param tenantManager 관리자 계열 여부
     * @param scheduleId    대상 일정 ID
     * @return 작성자 정보
     */
    public static ConsultationRecordWriter forCreate(User caller, boolean tenantManager, Long scheduleId) {
        return new ConsultationRecordWriter(caller.getId(), roleName(caller), tenantManager, scheduleId, null);
    }

    /**
     * 수정 판정 결과.
     *
     * @param caller        세션 사용자
     * @param tenantManager 관리자 계열 여부
     * @param recordId      대상 일지 ID
     * @return 작성자 정보
     */
    public static ConsultationRecordWriter forEdit(User caller, boolean tenantManager, Long recordId) {
        return new ConsultationRecordWriter(caller.getId(), roleName(caller), tenantManager, null, recordId);
    }

    /**
     * 판정 없이 들어온 내부 경로(배치·학원 상담 완료 등)의 작성자 정보. 권한은 호출 측이 이미 검증했다.
     *
     * @param caller 현재 사용자 (null 이면 시스템)
     * @return 작성자 정보
     */
    public static ConsultationRecordWriter ofInternal(User caller) {
        if (caller == null) {
            return new ConsultationRecordWriter(null, null, false, null, null);
        }
        return new ConsultationRecordWriter(caller.getId(), roleName(caller), isManagerRole(roleName(caller)),
                null, null);
    }

    /**
     * 저장된 역할명이 관리자 계열(ADMIN·STAFF)인지 — {@link ClientPathAccessGuard#isTenantManager} 와 같은 기준.
     *
     * @param role 역할명 (null 허용)
     * @return 관리자 계열이면 true
     */
    public static boolean isManagerRole(String role) {
        return ConsultationRecordWriterRoles.isManagerRole(role);
    }

    /**
     * 판정 대상 일정과 저장 대상 일정이 같은지.
     *
     * @param targetScheduleId 저장 대상 일정 ID
     * @return 같으면 true
     */
    public boolean matchesSchedule(Long targetScheduleId) {
        return scheduleId != null && Objects.equals(scheduleId, targetScheduleId);
    }

    /**
     * 판정 대상 일지와 저장 대상 일지가 같은지.
     *
     * @param targetRecordId 저장 대상 일지 ID
     * @return 같으면 true
     */
    public boolean matchesRecord(Long targetRecordId) {
        return recordId != null && Objects.equals(recordId, targetRecordId);
    }

    private static String roleName(User caller) {
        return caller.getRole() != null ? caller.getRole().name() : null;
    }
}
