package com.coresolution.consultation.repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.NotificationBatchSendLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/**
 * 알림 배치/이벤트 발송 멱등성 로그 Repository.
 *
 * <p>모든 쿼리는 {@code tenant_id} 필터 강제(멀티테넌트 격리).
 * 멱등 키는 {@code (tenant_id, template_code, target_type, target_id, recipient_user_id)} 5튜플.
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@Repository
public interface NotificationBatchSendLogRepository
        extends JpaRepository<NotificationBatchSendLog, Long> {

    /**
     * 멱등 키 5튜플로 직전 발송 로그 조회.
     *
     * <p>발송 직전 사전 체크용 — 동일 키 로그가 존재하면 (성공/실패 무관) 재시도하지 않는다.
     * 실패 재시도 정책은 별도 운영 도구(어드민 수동 재발송)로 분리한다.
     *
     * @param tenantId        테넌트 ID
     * @param templateCode    템플릿 코드 (예: {@code RESERVATION_REMINDER_D2})
     * @param targetType      대상 타입 ({@code SCHEDULE}/{@code MAPPING}/{@code USER})
     * @param targetId        대상 엔티티 PK
     * @param recipientUserId 발송 수신자 users.id
     * @return 매칭 로그 Optional
     */
    @Query("SELECT l FROM NotificationBatchSendLog l "
            + "WHERE l.tenantId = :tenantId "
            + "AND l.templateCode = :templateCode "
            + "AND l.targetType = :targetType "
            + "AND l.targetId = :targetId "
            + "AND l.recipientUserId = :recipientUserId "
            + "AND (l.isDeleted = false OR l.isDeleted IS NULL)")
    Optional<NotificationBatchSendLog> findByIdempotencyKey(
        @Param("tenantId") String tenantId,
        @Param("templateCode") String templateCode,
        @Param("targetType") String targetType,
        @Param("targetId") Long targetId,
        @Param("recipientUserId") Long recipientUserId);

    /**
     * 멱등 키 존재 여부 — 사전 가드 최적화 (count 1 회).
     *
     * @param tenantId        테넌트 ID
     * @param templateCode    템플릿 코드
     * @param targetType      대상 타입
     * @param targetId        대상 엔티티 PK
     * @param recipientUserId 발송 수신자 users.id
     * @return 1건 이상이면 true
     */
    @Query("SELECT CASE WHEN COUNT(l) > 0 THEN true ELSE false END FROM NotificationBatchSendLog l "
            + "WHERE l.tenantId = :tenantId "
            + "AND l.templateCode = :templateCode "
            + "AND l.targetType = :targetType "
            + "AND l.targetId = :targetId "
            + "AND l.recipientUserId = :recipientUserId "
            + "AND (l.isDeleted = false OR l.isDeleted IS NULL)")
    boolean existsByIdempotencyKey(
        @Param("tenantId") String tenantId,
        @Param("templateCode") String templateCode,
        @Param("targetType") String targetType,
        @Param("targetId") Long targetId,
        @Param("recipientUserId") Long recipientUserId);

    /**
     * 여러 템플릿 코드 중 하나라도 동일 (target_type, target_id, recipient_user_id) 로 발송된 적이
     * 있는지 — 멱등 키를 코드 묶음(예: INITIAL_GUIDE_OFFLINE ∪ INITIAL_GUIDE_ONLINE) 으로 공유할 때 사용.
     *
     * @param tenantId        테넌트 ID
     * @param templateCodes   비교 대상 템플릿 코드 묶음 (비어 있으면 항상 false)
     * @param targetType      대상 타입
     * @param targetId        대상 엔티티 PK
     * @param recipientUserId 발송 수신자 users.id
     * @return 묶음 중 1건이라도 존재하면 true
     */
    @Query("SELECT CASE WHEN COUNT(l) > 0 THEN true ELSE false END FROM NotificationBatchSendLog l "
            + "WHERE l.tenantId = :tenantId "
            + "AND l.templateCode IN :templateCodes "
            + "AND l.targetType = :targetType "
            + "AND l.targetId = :targetId "
            + "AND l.recipientUserId = :recipientUserId "
            + "AND (l.isDeleted = false OR l.isDeleted IS NULL)")
    boolean existsByIdempotencyKeyAnyTemplate(
        @Param("tenantId") String tenantId,
        @Param("templateCodes") Collection<String> templateCodes,
        @Param("targetType") String targetType,
        @Param("targetId") Long targetId,
        @Param("recipientUserId") Long recipientUserId);

    /**
     * 테넌트 + 기간으로 로그 조회 (운영 모니터링용).
     *
     * @param tenantId 테넌트 ID
     * @param from     발송 시각 시작 (inclusive)
     * @param to       발송 시각 종료 (inclusive)
     * @return 발송 시각 내림차순 로그 목록
     */
    @Query("SELECT l FROM NotificationBatchSendLog l "
            + "WHERE l.tenantId = :tenantId "
            + "AND l.sentAt BETWEEN :from AND :to "
            + "AND (l.isDeleted = false OR l.isDeleted IS NULL) "
            + "ORDER BY l.sentAt DESC")
    List<NotificationBatchSendLog> findByTenantIdAndSentAtBetween(
        @Param("tenantId") String tenantId,
        @Param("from") LocalDateTime from,
        @Param("to") LocalDateTime to);

    /**
     * BW-1 「푸시 설정 모니터링」 KPI: 채널 미확정({@code channel_used='PENDING'}) 누적 카운트.
     *
     * <p>발송 직전 INSERT 후 외부 호출 결과 UPDATE 가 누락된 행. 본 카운트는 윈도(range) 무관
     * 현재 시점 기준이며 KPI #1 카드 subtitle 「PENDING N건」 에 노출된다(D2).
     *
     * @param tenantId 테넌트 ID
     * @return PENDING 행 수
     * @since 2026-06-07
     */
    @Query("SELECT COUNT(l) FROM NotificationBatchSendLog l "
            + "WHERE l.tenantId = :tenantId "
            + "AND l.channelUsed = 'PENDING' "
            + "AND (l.isDeleted = false OR l.isDeleted IS NULL)")
    long countPendingByTenantId(@Param("tenantId") String tenantId);

    /**
     * BW-1: 윈도 발송 이력 조회 (tenantId + sentAt 범위 + (선택)채널 필터).
     *
     * <p>{@code channelUsed} 가 null 이면 PENDING 포함 모든 채널을 반환한다. 운영자가 채널
     * 필터를 적용하면 본 메서드의 호출자({@code AdminPushMonitoringServiceImpl}) 가
     * {@code channelUsed} 를 전달한다.
     *
     * @param tenantId    테넌트 ID
     * @param from        시작 시각 inclusive
     * @param to          종료 시각 inclusive
     * @param channelUsed channel_used 필터 (null = 전체)
     * @return 발송 시각 내림차순 목록
     * @since 2026-06-07
     */
    @Query("SELECT l FROM NotificationBatchSendLog l "
            + "WHERE l.tenantId = :tenantId "
            + "AND l.sentAt BETWEEN :from AND :to "
            + "AND (:channelUsed IS NULL OR l.channelUsed = :channelUsed) "
            + "AND (l.isDeleted = false OR l.isDeleted IS NULL) "
            + "ORDER BY l.sentAt DESC")
    List<NotificationBatchSendLog> findWindowByTenantAndChannel(
        @Param("tenantId") String tenantId,
        @Param("from") LocalDateTime from,
        @Param("to") LocalDateTime to,
        @Param("channelUsed") String channelUsed);

    /**
     * BW-1: 윈도 카운트 (tenantId + sentAt 범위).
     *
     * <p>최근 5분 발송량 KPI 계산용 — {@code from} 에 {@code now - 5min} 을 전달한다.
     *
     * @param tenantId 테넌트 ID
     * @param from     시작 시각 inclusive
     * @param to       종료 시각 inclusive
     * @return 행 수
     * @since 2026-06-07
     */
    @Query("SELECT COUNT(l) FROM NotificationBatchSendLog l "
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
    @Query("SELECT l FROM NotificationBatchSendLog l "
            + "WHERE l.id = :id AND l.tenantId = :tenantId "
            + "AND (l.isDeleted = false OR l.isDeleted IS NULL)")
    Optional<NotificationBatchSendLog> findByIdAndTenantId(
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
    @Query(value = "DELETE FROM notification_batch_send_log "
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
    @Query(value = "SELECT COUNT(*) FROM notification_batch_send_log "
            + "WHERE created_at < :cutoff",
            nativeQuery = true)
    long countOlderThan(@Param("cutoff") LocalDateTime cutoff);
}
