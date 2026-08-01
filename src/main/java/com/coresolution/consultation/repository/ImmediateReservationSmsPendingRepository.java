package com.coresolution.consultation.repository;

import java.time.LocalDateTime;
import java.util.Collection;
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

    /**
     * 동일 schedule 에 대해 fire_at 이 {@code [fireAtFrom, fireAtTo)} 인 PENDING 존재 여부.
     * D-n 09:00 배치가 당일 지연 즉시문자와 충돌하지 않도록 배치 측에서 조회한다.
     *
     * @param tenantId   테넌트 ID
     * @param scheduleId 스케줄 ID
     * @param status     상태 ({@code PENDING})
     * @param fireAtFrom 구간 시작 inclusive
     * @param fireAtTo   구간 끝 exclusive
     * @return PENDING 이 있으면 true
     */
    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM ImmediateReservationSmsPending p "
            + "WHERE p.tenantId = :tenantId "
            + "  AND p.scheduleId = :scheduleId "
            + "  AND p.status = :status "
            + "  AND p.fireAt >= :fireAtFrom "
            + "  AND p.fireAt < :fireAtTo "
            + "  AND p.isDeleted = false")
    boolean existsPendingForScheduleAndFireAtRange(
            @Param("tenantId") String tenantId,
            @Param("scheduleId") Long scheduleId,
            @Param("status") String status,
            @Param("fireAtFrom") LocalDateTime fireAtFrom,
            @Param("fireAtTo") LocalDateTime fireAtTo);

    /**
     * 스케줄 ID 목록에 대한 pending 행 일괄 조회 (배지 enrich, 읽기 전용).
     *
     * @param tenantId    테넌트 ID
     * @param scheduleIds 스케줄 ID 집합
     * @return pending 목록
     */
    @Query("SELECT p FROM ImmediateReservationSmsPending p "
            + "WHERE p.tenantId = :tenantId "
            + "  AND p.scheduleId IN :scheduleIds "
            + "  AND p.isDeleted = false")
    List<ImmediateReservationSmsPending> findByTenantIdAndScheduleIdInAndIsDeletedFalse(
            @Param("tenantId") String tenantId,
            @Param("scheduleIds") Collection<Long> scheduleIds);
}
