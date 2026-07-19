package com.coresolution.consultation.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.ScheduleChangeNotificationPending;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 일정 변경 SCHEDULE_CHANGED 디바운스 pending 리포지토리.
 *
 * @author MindGarden
 * @since 2026-07-19
 */
@Repository
public interface ScheduleChangeNotificationPendingRepository
        extends BaseRepository<ScheduleChangeNotificationPending, Long> {

    /**
     * 동일 일정의 PENDING 행 조회 (재변경 시 fire_at upsert 대상).
     *
     * @param tenantId   테넌트 ID
     * @param scheduleId 스케줄 ID
     * @param status     상태 ({@code PENDING})
     * @return PENDING 행 (없으면 empty)
     */
    Optional<ScheduleChangeNotificationPending> findFirstByTenantIdAndScheduleIdAndStatusAndIsDeletedFalse(
            String tenantId, Long scheduleId, String status);

    /**
     * fire_at 경과 PENDING 목록 (스케줄러 폴링).
     *
     * @param status 상태 ({@code PENDING})
     * @param fireAt 기준 시각 (보통 now)
     * @return due pending 목록
     */
    @Query("SELECT p FROM ScheduleChangeNotificationPending p "
            + "WHERE p.status = :status "
            + "  AND p.fireAt <= :fireAt "
            + "  AND p.isDeleted = false "
            + "ORDER BY p.fireAt ASC")
    List<ScheduleChangeNotificationPending> findDuePending(
            @Param("status") String status,
            @Param("fireAt") LocalDateTime fireAt);

    /**
     * 동일 schedule + slotVersion 으로 이미 SENT 여부 (멱등).
     *
     * @param tenantId    테넌트 ID
     * @param scheduleId  스케줄 ID
     * @param slotVersion 슬롯 버전
     * @param status      상태 ({@code SENT})
     * @return 이미 발송됨이면 true
     */
    boolean existsByTenantIdAndScheduleIdAndSlotVersionAndStatusAndIsDeletedFalse(
            String tenantId, Long scheduleId, String slotVersion, String status);
}
