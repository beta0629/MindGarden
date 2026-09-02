package com.coresolution.consultation.util;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;

/**
 * 한 계정·복수 역할(운영자+상담사) 판별 SSOT.
 *
 * <p>users.role 과 users.counseling_enabled 를 기준으로 운영자·상담사 역량을 판별한다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-02
 */
public final class UserRoleCapabilityUtils {

    private UserRoleCapabilityUtils() {
    }

    /**
     * 센터 운영(ADMIN/STAFF) 역할 보유 여부.
     */
    public static boolean hasOperatorRole(User user) {
        if (user == null || user.getRole() == null) {
            return false;
        }
        UserRole role = user.getRole();
        return UserRole.ADMIN.equals(role) || UserRole.STAFF.equals(role);
    }

    /**
     * 상담사 역량 보유 여부 (CONSULTANT 또는 ADMIN+상담 겸직).
     */
    public static boolean hasCounselorRole(User user) {
        if (user == null) {
            return false;
        }
        return user.resolvesAsProfessionalProvider();
    }

    /**
     * 운영자·상담사 역량을 모두 보유하는지 여부.
     */
    public static boolean isDualRole(User user) {
        return hasOperatorRole(user) && hasCounselorRole(user);
    }

    /**
     * FE·API 응답용 가용 역할 목록 (예: ADMIN+counselingEnabled → ["ADMIN","CONSULTANT"]).
     */
    public static List<String> getAvailableRoles(User user) {
        if (user == null || user.getRole() == null) {
            return Collections.emptyList();
        }
        Set<String> roles = new LinkedHashSet<>();
        UserRole primary = user.getRole();
        if (hasOperatorRole(user)) {
            roles.add(primary.name());
        }
        if (hasCounselorRole(user)) {
            roles.add(UserRole.CONSULTANT.name());
        }
        if (roles.isEmpty()) {
            roles.add(primary.name());
        }
        return new ArrayList<>(roles);
    }

    /**
     * 사용자 Map 응답에 역할 역량 필드를 추가한다.
     */
    public static void enrichUserMap(Map<String, Object> userInfo, User user) {
        if (userInfo == null || user == null) {
            return;
        }
        userInfo.put("counselingEnabled", Boolean.TRUE.equals(user.getCounselingEnabled()));
        userInfo.put("availableRoles", getAvailableRoles(user));
        userInfo.put("hasOperatorRole", hasOperatorRole(user));
        userInfo.put("hasCounselorRole", hasCounselorRole(user));
    }
}
