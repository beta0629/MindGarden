package com.coresolution.consultation.repository;

import java.time.LocalDateTime;
import java.util.List;
import com.coresolution.consultation.dto.TestNotificationChannel;
import com.coresolution.consultation.entity.AdminTestNotificationLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

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
}
