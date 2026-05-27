package com.coresolution.consultation.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.coresolution.consultation.entity.DormantUserPiiVault;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 휴면 사용자 PII vault Repository — USER_LIFECYCLE_TERMINATION_POLICY v1.2 §10.9.
 *
 * <p>3 개의 cron 배치({@code DormantUserBatchService}, {@code AnonymizeBatchService},
 * {@code DormantUserPreNoticeService}) 와 {@code UserLifecycleService.reactivate(...)} 가
 * 본 repository 를 통해 vault 행을 조회·수정한다. 시스템 cron 은 모든 테넌트 across 로
 * 동작하므로 일부 조회 메서드는 {@code tenantId} 필터 없이 정의되며, 각 호출자는
 * 단일 사용자 처리 트랜잭션 내에서 {@code tenantId} 정합을 검증한다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@Repository
public interface DormantUserPiiVaultRepository
        extends BaseRepository<DormantUserPiiVault, Long> {

    /**
     * 사용자·테넌트 조합으로 vault 단건 조회 (멀티테넌트 격리).
     *
     * @param userId   대상 users.id
     * @param tenantId 테넌트 ID
     * @return vault Optional
     */
    @Query("SELECT v FROM DormantUserPiiVault v "
            + "WHERE v.userId = :userId AND v.tenantId = :tenantId "
            + "AND v.isDeleted = false")
    Optional<DormantUserPiiVault> findByUserIdAndTenantId(
            @Param("userId") Long userId, @Param("tenantId") String tenantId);

    /**
     * {@code anonymize_scheduled_at &lt; cutoff} 인 vault 행 조회 — AnonymizeBatchService 입력.
     *
     * <p>SYSTEM cron 이 호출 — 모든 테넌트 across.</p>
     *
     * @param cutoff 만료 기준 시각 (LocalDateTime.now() — 4년 경과 행 검색)
     * @return 익명화 대상 vault 목록
     */
    @Query("SELECT v FROM DormantUserPiiVault v "
            + "WHERE v.anonymizeScheduledAt < :cutoff "
            + "AND v.isDeleted = false "
            + "ORDER BY v.anonymizeScheduledAt ASC")
    List<DormantUserPiiVault> findDueForAnonymization(@Param("cutoff") LocalDateTime cutoff);

    /**
     * 30일 이내 익명화 예정 + 사전 통지 미발송 vault 조회 — DormantUserPreNoticeService 입력.
     *
     * <p>{@code pre_notice_sent_at IS NULL AND anonymize_scheduled_at &lt; :preNoticeCutoff}.</p>
     *
     * @param preNoticeCutoff 사전 통지 기준 시각 (LocalDateTime.now() + 30 DAY)
     * @return 사전 통지 대상 vault 목록
     */
    @Query("SELECT v FROM DormantUserPiiVault v "
            + "WHERE v.preNoticeSentAt IS NULL "
            + "AND v.anonymizeScheduledAt < :preNoticeCutoff "
            + "AND v.isDeleted = false "
            + "ORDER BY v.anonymizeScheduledAt ASC")
    List<DormantUserPiiVault> findDueForPreNotice(
            @Param("preNoticeCutoff") LocalDateTime preNoticeCutoff);

    /**
     * 테넌트별 vault 행 개수 — 운영 대시보드용.
     */
    @Query("SELECT COUNT(v) FROM DormantUserPiiVault v "
            + "WHERE v.tenantId = :tenantId AND v.isDeleted = false")
    long countByTenantIdActive(@Param("tenantId") String tenantId);
}
