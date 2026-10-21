package com.coresolution.consultation.service.support;

import java.util.ArrayList;
import java.util.List;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.SystemNotification;

/**
 * 시스템 공지 수신 대상(목록·상세·읽음) 공통 판정.
 *
 * <p>목록 조회와 동일하게 {@code ALL} + 역할별 {@code CONSULTANT}/{@code CLIENT} 만 노출한다.
 * 관리자 작성·관리 API({@code /admin/*})는 이 헬퍼를 쓰지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-21
 */
public final class SystemNotificationAudience {

    private SystemNotificationAudience() {
    }

    /**
     * 사용자 역할에 따른 수신 대상 타입 목록을 반환한다.
     *
     * <p>전체 공지({@code ALL})는 항상 포함한다. 전문가 계열은 {@code CONSULTANT},
     * 내담자는 {@code CLIENT}를 추가한다. ADMIN/STAFF 등은 {@code ALL}만 반환한다.</p>
     *
     * @param userRole 세션 사용자 역할 문자열
     * @return 노출 가능한 targetType 목록 (비어 있지 않음)
     */
    public static List<String> getTargetTypesForUser(String userRole) {
        List<String> targetTypes = new ArrayList<>();
        targetTypes.add("ALL");

        // 2026-06 4종 SSOT: 전문가 세부 분류(놀이·언어)는 enum 이 아니라
        // users.professional_provider_type_code 컬럼으로 표현됨. targetType 은 CONSULTANT 단일.
        UserRole role = UserRole.fromString(userRole);
        if (role != null && role.isProfessionalProvider()) {
            targetTypes.add(UserRole.CONSULTANT.name());
        } else if (role == UserRole.CLIENT) {
            targetTypes.add(UserRole.CLIENT.name());
        }

        return targetTypes;
    }

    /**
     * 현재 테넌트·삭제 여부·수신 대상이 모두 맞는지 확인한다.
     *
     * <p>{@code targetType}이 null이면 비노출(안전). 비대상·다른 테넌트·삭제는 모두 false이며
     * 호출측에서 동일하게 404 처리한다.</p>
     *
     * @param found 조회된 공지
     * @param tenantId 현재 테넌트 ID
     * @param userRole 조회 사용자 역할
     * @return 수신자에게 노출 가능하면 true
     */
    public static boolean isVisibleForRecipient(SystemNotification found, String tenantId, String userRole) {
        if (found == null || Boolean.TRUE.equals(found.getIsDeleted()) || found.isDeleted()) {
            return false;
        }
        if (tenantId == null || !tenantId.equals(found.getTenantId())) {
            return false;
        }
        String targetType = found.getTargetType();
        if (targetType == null || targetType.isBlank()) {
            return false;
        }
        return getTargetTypesForUser(userRole).contains(targetType);
    }
}
