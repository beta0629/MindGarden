package com.coresolution.consultation.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.constant.ManualNotificationJobStatus;
import com.coresolution.consultation.entity.ManualNotificationJob;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 수동 발송 작업 저장소. 상태 전이·집계는 조건부 UPDATE 로만 바꾼다(실행 점유 경쟁 안전).
 *
 * @author MindGarden
 * @since 2026-10-05
 */
@Repository
public interface ManualNotificationJobRepository extends JpaRepository<ManualNotificationJob, Long> {

    /**
     * 같은 관리자·테넌트의 멱등 키로 만든 작업.
     *
     * @param tenantId        테넌트 ID
     * @param createdByUserId 요청 관리자 PK
     * @param idempotencyKey  멱등 키
     * @return 작업
     */
    Optional<ManualNotificationJob> findByTenantIdAndCreatedByUserIdAndIdempotencyKey(String tenantId,
            Long createdByUserId, String idempotencyKey);

    /**
     * 관리자별 작업 생성 수(생성 빈도 한도).
     *
     * @param tenantId        테넌트 ID
     * @param createdByUserId 요청 관리자 PK
     * @param after           이 시각 이후 생성분
     * @return 건수
     */
    long countByTenantIdAndCreatedByUserIdAndCreatedAtAfter(String tenantId, Long createdByUserId,
            LocalDateTime after);

    /**
     * 테넌트 범위 작업 조회(관리자 진행 조회).
     *
     * @param tenantId 테넌트 ID
     * @param jobUuid  작업 UUID
     * @return 작업
     */
    Optional<ManualNotificationJob> findByTenantIdAndJobUuidAndIsDeletedFalse(String tenantId, String jobUuid);

    /**
     * 실행 점유(claim). PENDING 이거나 점유가 만료된 RUNNING 만 집는다. 1 이면 이 실행자가 점유했다.
     *
     * @param id         작업 PK
     * @param owner      실행자 식별자
     * @param now        현재 시각(KST)
     * @param leaseUntil 점유 만료 시각(KST)
     * @return 갱신 행 수
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE ManualNotificationJob j SET j.status = com.coresolution.consultation.constant"
        + ".ManualNotificationJobStatus.RUNNING, j.leaseOwner = :owner, j.leaseUntil = :leaseUntil,"
        + " j.executionAttempts = j.executionAttempts + 1,"
        + " j.startedAt = COALESCE(j.startedAt, :now)"
        + " WHERE j.id = :id AND (j.status = com.coresolution.consultation.constant"
        + ".ManualNotificationJobStatus.PENDING OR (j.status = com.coresolution.consultation.constant"
        + ".ManualNotificationJobStatus.RUNNING AND (j.leaseUntil IS NULL OR j.leaseUntil < :now)))")
    int claim(@Param("id") Long id, @Param("owner") String owner, @Param("now") LocalDateTime now,
            @Param("leaseUntil") LocalDateTime leaseUntil);

    /**
     * 점유 연장. 점유자가 바뀌었으면 0.
     *
     * @param id         작업 PK
     * @param owner      실행자 식별자
     * @param leaseUntil 새 만료 시각
     * @return 갱신 행 수
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE ManualNotificationJob j SET j.leaseUntil = :leaseUntil WHERE j.id = :id"
        + " AND j.leaseOwner = :owner AND j.status = com.coresolution.consultation.constant"
        + ".ManualNotificationJobStatus.RUNNING")
    int renewLease(@Param("id") Long id, @Param("owner") String owner,
            @Param("leaseUntil") LocalDateTime leaseUntil);

    /**
     * 작업 종료(COMPLETED·FAILED). 점유자만 닫을 수 있다.
     *
     * @param id        작업 PK
     * @param owner     실행자 식별자
     * @param status    종료 상태
     * @param errorCode 오류 코드(없으면 null)
     * @param now       종료 시각
     * @return 갱신 행 수
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE ManualNotificationJob j SET j.status = :status, j.errorCode = :errorCode,"
        + " j.finishedAt = :now, j.leaseOwner = NULL, j.leaseUntil = NULL"
        + " WHERE j.id = :id AND j.leaseOwner = :owner AND j.status = com.coresolution.consultation.constant"
        + ".ManualNotificationJobStatus.RUNNING")
    int finish(@Param("id") Long id, @Param("owner") String owner,
            @Param("status") ManualNotificationJobStatus status, @Param("errorCode") String errorCode,
            @Param("now") LocalDateTime now);

    /**
     * 진행 집계 증가.
     *
     * @param id      작업 PK
     * @param sent    성공 증가분
     * @param failed  실패 증가분
     * @param skipped 스킵 증가분
     * @return 갱신 행 수
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE ManualNotificationJob j SET j.sentCount = j.sentCount + :sent,"
        + " j.failedCount = j.failedCount + :failed, j.skippedCount = j.skippedCount + :skipped"
        + " WHERE j.id = :id")
    int incrementCounters(@Param("id") Long id, @Param("sent") int sent, @Param("failed") int failed,
            @Param("skipped") int skipped);

    /**
     * 복구 대상: 오래 남은 PENDING 또는 점유가 만료된 RUNNING.
     *
     * @param pendingBefore 이 시각 전에 만든 PENDING 만
     * @param now           현재 시각(KST, 점유 만료 비교)
     * @param pageable      최대 건수
     * @return 작업 PK 목록
     */
    @Query("SELECT j.id FROM ManualNotificationJob j WHERE j.isDeleted = false AND ("
        + "(j.status = com.coresolution.consultation.constant.ManualNotificationJobStatus.PENDING"
        + " AND j.createdAt < :pendingBefore)"
        + " OR (j.status = com.coresolution.consultation.constant.ManualNotificationJobStatus.RUNNING"
        + " AND j.leaseUntil < :now)) ORDER BY j.id ASC")
    List<Long> findRecoverableIds(@Param("pendingBefore") LocalDateTime pendingBefore,
            @Param("now") LocalDateTime now, Pageable pageable);
}
