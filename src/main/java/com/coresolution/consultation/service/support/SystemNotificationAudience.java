package com.coresolution.consultation.service.support;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.SystemNotification;

/**
 * 시스템 공지 수신 대상(목록·상세·읽음) 공통 판정.
 *
 * <p>목록 조회와 동일하게 {@code ALL} + 역할별 {@code CONSULTANT}/{@code CLIENT} 만 노출한다.
 * 게시 조건도 목록 JPQL({@code findValidNotificationsByTenantIdAndTargetTypes})과 동일하다.
 * 관리자 작성·관리 API({@code /admin/*})는 이 헬퍼를 쓰지 않는다.
 * 관리자 상세 미리보기는 {@link #canAdminPreviewSameTenant} 만 사용한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-21
 */
public final class SystemNotificationAudience {

    /** 목록 JPQL {@code n.status = 'PUBLISHED'} 와 동일 */
    private static final String STATUS_PUBLISHED = "PUBLISHED";

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
     * 목록 JPQL과 동일한 게시 조건인지 판정한다.
     *
     * <ul>
     *   <li>{@code status = 'PUBLISHED'}</li>
     *   <li>{@code publishedAt IS NULL OR publishedAt <= now}</li>
     *   <li>{@code expiresAt IS NULL OR expiresAt > now}</li>
     * </ul>
     *
     * <p>엔티티 {@code isValid()}의 {@code now.isAfter(expiresAt)} 과 달리,
     * {@code expiresAt == now} 는 비게시(목록과 동일)로 본다.</p>
     *
     * @param notification 공지
     * @param now 기준 시각
     * @return 게시 중이면 true
     */
    public static boolean isPublishedForAudience(SystemNotification notification, LocalDateTime now) {
        if (notification == null || now == null) {
            return false;
        }
        if (!STATUS_PUBLISHED.equals(notification.getStatus())) {
            return false;
        }
        LocalDateTime publishedAt = notification.getPublishedAt();
        if (publishedAt != null && publishedAt.isAfter(now)) {
            return false;
        }
        LocalDateTime expiresAt = notification.getExpiresAt();
        if (expiresAt != null && !expiresAt.isAfter(now)) {
            return false;
        }
        return true;
    }

    /**
     * 현재 테넌트·삭제 여부·게시 조건·수신 대상이 모두 맞는지 확인한다.
     *
     * <p>{@code targetType}이 null이면 비노출(안전). 비대상·다른 테넌트·삭제·비게시는 모두 false이며
     * 호출측에서 동일하게 404 처리한다.</p>
     *
     * @param found 조회된 공지
     * @param tenantId 현재 테넌트 ID
     * @param userRole 조회 사용자 역할
     * @return 수신자에게 노출 가능하면 true
     */
    public static boolean isVisibleForRecipient(SystemNotification found, String tenantId, String userRole) {
        return isVisibleForRecipient(found, tenantId, userRole, LocalDateTime.now());
    }

    /**
     * 현재 테넌트·삭제 여부·게시 조건·수신 대상이 모두 맞는지 확인한다 (기준 시각 지정).
     *
     * @param found 조회된 공지
     * @param tenantId 현재 테넌트 ID
     * @param userRole 조회 사용자 역할
     * @param now 게시 기간 판정 기준 시각
     * @return 수신자에게 노출 가능하면 true
     */
    public static boolean isVisibleForRecipient(
            SystemNotification found, String tenantId, String userRole, LocalDateTime now) {
        if (found == null || Boolean.TRUE.equals(found.getIsDeleted()) || found.isDeleted()) {
            return false;
        }
        if (tenantId == null || !tenantId.equals(found.getTenantId())) {
            return false;
        }
        if (!isPublishedForAudience(found, now)) {
            return false;
        }
        String targetType = found.getTargetType();
        if (targetType == null || targetType.isBlank()) {
            return false;
        }
        return getTargetTypesForUser(userRole).contains(targetType);
    }

    /**
     * 관리자 상세 미리보기: 같은 테넌트·비삭제만 허용한다.
     *
     * <p>대상(targetType)·게시 상태·게시 기간은 검사하지 않는다.</p>
     *
     * @param found 조회된 공지
     * @param tenantId 현재 테넌트 ID
     * @return 관리자가 같은 테넌트에서 열람 가능하면 true
     */
    public static boolean canAdminPreviewSameTenant(SystemNotification found, String tenantId) {
        if (found == null || Boolean.TRUE.equals(found.getIsDeleted()) || found.isDeleted()) {
            return false;
        }
        return tenantId != null && tenantId.equals(found.getTenantId());
    }
}
