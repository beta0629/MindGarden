package com.coresolution.consultation.service;

import java.util.List;

import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * 통일 감사 로그 Service.
 *
 * <p>USER_LIFECYCLE_TERMINATION_POLICY §4 — lifecycle/anonymize/destruction/관리자 액션의
 * SSOT 기록 헬퍼. 본 위임 범위는 인터페이스 + 스켈레톤 ServiceImpl. 비즈니스 로직은 후속
 * 위임에서 작성 (UserLifecycleService / UserSelfWithdrawalService 등).</p>
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
public interface AuditLogService {

    /**
     * 감사 로그 1행 적재.
     */
    AuditLog record(AuditLog log);

    /**
     * 액션 enum + 대상 사용자/엔티티 기반 audit 로그 기록 헬퍼.
     *
     * @param tenantId    테넌트 ID
     * @param actorUserId 행위자 users.id (SYSTEM cron 이면 null)
     * @param actorRole   행위자 역할 코드 (예: CLIENT / ADMIN / SYSTEM)
     * @param targetUserId 행위 대상 users.id (사용자 무관 액션이면 null)
     * @param action      {@link AuditAction}
     * @param entityType  대상 엔티티 타입 (USER / MAPPING / SCHEDULE 등)
     * @param entityId    대상 엔티티 PK (null 가능)
     * @return 저장된 audit 로그
     */
    AuditLog log(
            String tenantId,
            Long actorUserId,
            String actorRole,
            Long targetUserId,
            AuditAction action,
            String entityType,
            Long entityId);

    /**
     * 테넌트별 최근 감사 로그 페이지 조회.
     */
    Page<AuditLog> findByTenantId(String tenantId, Pageable pageable);

    /**
     * 테넌트 + 대상 사용자별 감사 로그 조회.
     */
    List<AuditLog> findByTenantIdAndTargetUserId(String tenantId, Long targetUserId);
}
