package com.coresolution.consultation.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.dto.TestNotificationChannel;
import com.coresolution.consultation.entity.AdminTestNotificationLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/**
 * 어드민 테스트 발송 감사로그 Repository.
 *
 * <p>모든 쿼리는 {@code tenant_id} 필터 강제(멀티테넌트 격리, /core-solution-multi-tenant).
 *
 * @author MindGarden
 * @since 2026-05-22
 */
@Repository
public interface AdminTestNotificationLogRepository
        extends JpaRepository<AdminTestNotificationLog, Long> {

    /**
     * 본인 사용자의 최근 30건 이력 (현재 tenant 한정).
     *
     * @param tenantId 테넌트 ID
     * @param sentByUserId 발송자 사용자 PK
     * @return 최근 발송 시각 내림차순 30건
     */
    List<AdminTestNotificationLog>
        findTop30ByTenantIdAndSentByUserIdOrderBySentAtDesc(String tenantId, Long sentByUserId);

    /**
     * 배치 ID 로 그룹화된 감사로그 행 조회(현재 tenant 한정).
     *
     * <p>어드민 수동 다중 발송 결과 화면에서 같은 batch 의 모든 행을 일괄 조회할 때 사용.
     * 발송 시도 순서 기준 오름차순 정렬.
     *
     * @param tenantId 테넌트 ID
     * @param batchId  배치 ID(UUID)
     * @return 배치 행 목록(시간 오름차순)
     */
    @Query("SELECT l FROM AdminTestNotificationLog l "
            + "WHERE l.tenantId = :tenantId AND l.batchId = :batchId "
            + "AND (l.isDeleted = false OR l.isDeleted IS NULL) "
            + "ORDER BY l.sentAt ASC, l.id ASC")
    List<AdminTestNotificationLog> findByTenantIdAndBatchId(
        @Param("tenantId") String tenantId,
        @Param("batchId") String batchId);

    /**
     * 본인·tenant 한정 배치 그룹 페이지네이션. 같은 batch_id 의 헤더 1행만 노출하기 위해
     * 그룹별 최초 행을 가져온다.
     *
     * <p>{@code batch_id IS NOT NULL} 행만 반환 — 단일 발송(batch_id=NULL) 은 제외한다.
     *
     * @param tenantId 테넌트 ID
     * @param sentByUserId 발송자 PK
     * @param pageable 페이지 정보
     * @return 배치 헤더(최초 행) 페이지
     */
    @Query(value = "SELECT l FROM AdminTestNotificationLog l WHERE l.tenantId = :tenantId "
            + "AND l.sentByUserId = :sentByUserId AND l.batchId IS NOT NULL "
            + "AND (l.isDeleted = false OR l.isDeleted IS NULL) "
            + "AND l.id = (SELECT MIN(l2.id) FROM AdminTestNotificationLog l2 "
            + "             WHERE l2.tenantId = l.tenantId AND l2.batchId = l.batchId) "
            + "ORDER BY l.sentAt DESC",
            countQuery = "SELECT COUNT(l) FROM AdminTestNotificationLog l "
            + "WHERE l.tenantId = :tenantId AND l.sentByUserId = :sentByUserId "
            + "AND l.batchId IS NOT NULL "
            + "AND (l.isDeleted = false OR l.isDeleted IS NULL) "
            + "AND l.id = (SELECT MIN(l2.id) FROM AdminTestNotificationLog l2 "
            + "             WHERE l2.tenantId = l.tenantId AND l2.batchId = l.batchId)")
    Page<AdminTestNotificationLog> searchBatchHeaders(
        @Param("tenantId") String tenantId,
        @Param("sentByUserId") Long sentByUserId,
        Pageable pageable);

    /**
     * Rate-limit 카운트 — 사용자·tenant 한정, 특정 시각 이후 발송 시도(success 무관).
     *
     * @param tenantId 테넌트 ID
     * @param sentByUserId 발송자 사용자 PK
     * @param after 기준 시각 (exclusive)
     * @return 카운트
     */
    long countByTenantIdAndSentByUserIdAndSentAtAfter(
        String tenantId, Long sentByUserId, LocalDateTime after);

    /**
     * 이력 조회(필터·페이지네이션). 본 사용자·tenant 한정.
     *
     * @param tenantId 테넌트 ID
     * @param sentByUserId 발송자 사용자 PK
     * @param fromInclusive 시작 시각(없으면 전체)
     * @param toInclusive 종료 시각(없으면 전체)
     * @param channel 채널 필터(null이면 전체)
     * @param success 성공 여부 필터(null이면 전체)
     * @param pageable 페이지 정보
     * @return 페이지 결과
     */
    @Query("SELECT l FROM AdminTestNotificationLog l "
            + "WHERE l.tenantId = :tenantId "
            + "AND l.sentByUserId = :sentByUserId "
            + "AND (:fromInclusive IS NULL OR l.sentAt >= :fromInclusive) "
            + "AND (:toInclusive IS NULL OR l.sentAt <= :toInclusive) "
            + "AND (:channel IS NULL OR l.channel = :channel) "
            + "AND (:success IS NULL OR l.success = :success) "
            + "AND (l.isDeleted = false OR l.isDeleted IS NULL) "
            + "ORDER BY l.sentAt DESC")
    Page<AdminTestNotificationLog> searchHistory(
        @Param("tenantId") String tenantId,
        @Param("sentByUserId") Long sentByUserId,
        @Param("fromInclusive") LocalDateTime fromInclusive,
        @Param("toInclusive") LocalDateTime toInclusive,
        @Param("channel") TestNotificationChannel channel,
        @Param("success") Boolean success,
        Pageable pageable);

    /**
     * BW-1 「푸시 설정 모니터링」 윈도 이력 조회 (tenantId + sentAt 범위 + (선택)채널 필터).
     *
     * <p>{@code channel} 이 null 이면 모든 채널을 반환한다. 본 메서드는 어드민 수동 발송 (PUSH 포함)
     * 모집단 산정에 사용된다.
     *
     * @param tenantId 테넌트 ID
     * @param from     시작 시각 inclusive
     * @param to       종료 시각 inclusive
     * @param channel  채널 필터 (null = 전체)
     * @return 발송 시각 내림차순 목록
     * @since 2026-06-07
     */
    @Query("SELECT l FROM AdminTestNotificationLog l "
            + "WHERE l.tenantId = :tenantId "
            + "AND l.sentAt BETWEEN :from AND :to "
            + "AND (:channel IS NULL OR l.channel = :channel) "
            + "AND (l.isDeleted = false OR l.isDeleted IS NULL) "
            + "ORDER BY l.sentAt DESC")
    List<AdminTestNotificationLog> findWindowByTenantAndChannel(
        @Param("tenantId") String tenantId,
        @Param("from") LocalDateTime from,
        @Param("to") LocalDateTime to,
        @Param("channel") TestNotificationChannel channel);

    /**
     * BW-1: 윈도 카운트.
     *
     * @param tenantId 테넌트 ID
     * @param from     시작 시각 inclusive
     * @param to       종료 시각 inclusive
     * @return 행 수
     * @since 2026-06-07
     */
    @Query("SELECT COUNT(l) FROM AdminTestNotificationLog l "
            + "WHERE l.tenantId = :tenantId "
            + "AND l.sentAt BETWEEN :from AND :to "
            + "AND (l.isDeleted = false OR l.isDeleted IS NULL)")
    long countWindowByTenant(
        @Param("tenantId") String tenantId,
        @Param("from") LocalDateTime from,
        @Param("to") LocalDateTime to);

    /**
     * BW-1: 단건 조회(테넌트 격리).
     *
     * @param id       row PK
     * @param tenantId 테넌트 ID
     * @return Optional
     * @since 2026-06-07
     */
    @Query("SELECT l FROM AdminTestNotificationLog l "
            + "WHERE l.id = :id AND l.tenantId = :tenantId "
            + "AND (l.isDeleted = false OR l.isDeleted IS NULL)")
    Optional<AdminTestNotificationLog> findByIdAndTenantId(
        @Param("id") Long id,
        @Param("tenantId") String tenantId);

    /**
     * 보관기간 초과 row 일괄 삭제 (시스템 잡 전용 — tenant 무관 전역).
     *
     * <p>네이티브 SQL {@code LIMIT} 으로 1회 호출당 삭제량을 제한해 락 시간을 짧게 유지한다.
     * 호출부({@link com.coresolution.consultation.scheduler.NotificationLogRetentionScheduler})
     * 가 누적 카운트로 N회 반복 호출하여 전량 처리한다.
     *
     * @param cutoff    삭제 기준 시각(이 시각 이전 row 삭제)
     * @param batchSize 1회 호출당 최대 삭제 row 수
     * @return 실제 삭제된 row 수
     */
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM admin_test_notification_logs "
            + "WHERE created_at < :cutoff LIMIT :batchSize",
            nativeQuery = true)
    int deleteOlderThan(
        @Param("cutoff") LocalDateTime cutoff,
        @Param("batchSize") int batchSize);

    /**
     * 드라이런 모드용 — 보관기간 초과 row 개수 카운트 (삭제 없음).
     *
     * @param cutoff 삭제 기준 시각(이 시각 이전 row 카운트)
     * @return 대상 row 수
     */
    @Query(value = "SELECT COUNT(*) FROM admin_test_notification_logs "
            + "WHERE created_at < :cutoff",
            nativeQuery = true)
    long countOlderThan(@Param("cutoff") LocalDateTime cutoff);
}
