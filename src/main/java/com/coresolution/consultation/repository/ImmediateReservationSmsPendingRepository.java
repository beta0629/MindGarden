package com.coresolution.consultation.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.ImmediateReservationSmsPending;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 예약 즉시 SMS 업무시간 외 지연 발송 pending 리포지토리.
 *
 * @author MindGarden
 * @since 2026-07-29
 */
@Repository
public interface ImmediateReservationSmsPendingRepository
        extends BaseRepository<ImmediateReservationSmsPending, Long> {

    /**
     * 동일 일정·템플릿의 PENDING 행 조회 (재등록 시 fire_at upsert 대상).
     *
     * @param tenantId     테넌트 ID
     * @param scheduleId   스케줄 ID
     * @param templateCode 템플릿 코드
     * @param status       상태 ({@code PENDING})
     * @return PENDING 행 (없으면 empty)
     */
    Optional<ImmediateReservationSmsPending>
            findFirstByTenantIdAndScheduleIdAndTemplateCodeAndStatusAndIsDeletedFalse(
                    String tenantId, Long scheduleId, String templateCode, String status);

    /**
     * fire_at 경과 PENDING 목록 (스케줄러 폴링).
     *
     * @param status 상태 ({@code PENDING})
     * @param fireAt 기준 시각 (보통 now)
     * @return due pending 목록
     */
    @Query("SELECT p FROM ImmediateReservationSmsPending p "
            + "WHERE p.status = :status "
            + "  AND p.fireAt <= :fireAt "
            + "  AND p.isDeleted = false "
            + "ORDER BY p.fireAt ASC")
    List<ImmediateReservationSmsPending> findDuePending(
            @Param("status") String status,
            @Param("fireAt") LocalDateTime fireAt);

    /**
     * 동일 schedule + templateCode 로 이미 SENT 여부 (멱등).
     *
     * @param tenantId     테넌트 ID
     * @param scheduleId   스케줄 ID
     * @param templateCode 템플릿 코드
     * @param status       상태 ({@code SENT})
     * @return 이미 발송됨이면 true
     */
    boolean existsByTenantIdAndScheduleIdAndTemplateCodeAndStatusAndIsDeletedFalse(
            String tenantId, Long scheduleId, String templateCode, String status);
}
