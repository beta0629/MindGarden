package com.coresolution.consultation.util;

import com.coresolution.consultation.constant.UserRole;

/**
 * 상담일지 작성·수정자 역할명 판정 유틸.
 *
 * <p>{@code consultation_records.created_by_role}·{@code updated_by_role} 에 저장된 역할명이
 * 관리자 계열(ADMIN·STAFF)인지 판정한다. 기준은
 * {@code ClientPathAccessGuard#isTenantManager} 와 같다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
public final class ConsultationRecordWriterRoles {

    private ConsultationRecordWriterRoles() {
    }

    /**
     * 역할명이 관리자 계열(ADMIN·STAFF)인지.
     *
     * @param role 역할명 (null·공백 허용)
     * @return 관리자 계열이면 true
     */
    public static boolean isManagerRole(String role) {
        if (role == null || role.isBlank()) {
            return false;
        }
        UserRole resolved = UserRole.fromString(role);
        return resolved.isAdmin() || resolved.isStaff();
    }
}
