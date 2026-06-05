package com.coresolution.consultation.repository;

import java.util.List;
import com.coresolution.consultation.entity.SessionRecoveryAlert;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 회기 차감 보정 알림 리포지토리.
 *
 * <p>{@code SessionDeductionRecoveryBatch} 가 처리 불가 케이스를 적재하고, 어드민 UI 가
 * {@code resolved_at IS NULL} 인 미해결 알림을 조회한다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-05
 */
@Repository
public interface SessionRecoveryAlertRepository extends BaseRepository<SessionRecoveryAlert, Long> {

    /**
     * 테넌트별 미해결 알림 조회 (resolved_at IS NULL).
     *
     * @param tenantId 테넌트 ID
     * @return 미해결 알림 목록 (생성 시각 ASC)
     */
    @Query("SELECT a FROM SessionRecoveryAlert a "
            + "WHERE a.tenantId = :tenantId "
            + "  AND a.resolvedAt IS NULL "
            + "  AND a.isDeleted = false "
            + "ORDER BY a.createdAt ASC")
    List<SessionRecoveryAlert> findUnresolvedByTenantId(@Param("tenantId") String tenantId);

    /**
     * 특정 일정에 대한 미해결 알림 존재 여부 (멱등성: 동일 사이클에서 중복 적재 방지).
     */
    @Query("SELECT COUNT(a) > 0 FROM SessionRecoveryAlert a "
            + "WHERE a.tenantId = :tenantId "
            + "  AND a.scheduleId = :scheduleId "
            + "  AND a.resolvedAt IS NULL "
            + "  AND a.isDeleted = false")
    boolean existsUnresolvedByTenantIdAndScheduleId(
            @Param("tenantId") String tenantId,
            @Param("scheduleId") Long scheduleId);
}
