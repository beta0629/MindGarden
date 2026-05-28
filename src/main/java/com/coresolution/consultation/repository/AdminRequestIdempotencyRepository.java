package com.coresolution.consultation.repository;

import java.time.LocalDateTime;
import java.util.Optional;

import com.coresolution.consultation.entity.AdminRequestIdempotency;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * {@link AdminRequestIdempotency} 영속화 저장소 — 옵션 B v2.0 합의서 §4·§6 Q11 (2026-05-28).
 *
 * <p>{@link #findByTenantIdAndRequestIdAndOperation} 는 멱등성 검사 fast-path 로 사용하고,
 * UNIQUE 제약 위반은 {@code DataIntegrityViolationException} 으로 fail-fast.</p>
 *
 * @author MindGarden
 * @since 2026-05-28
 */
@Repository
public interface AdminRequestIdempotencyRepository
        extends BaseRepository<AdminRequestIdempotency, Long> {

    /**
     * (테넌트, 요청 ID, operation) 으로 활성 멱등성 row 조회.
     *
     * @param tenantId 테넌트 UUID
     * @param requestId 클라이언트 요청 ID (Idempotency Key)
     * @param operation 오퍼레이션 식별자 (예: {@code CHECKOUT_SAME_DAY})
     * @return 매칭되는 row Optional
     */
    Optional<AdminRequestIdempotency> findByTenantIdAndRequestIdAndOperation(
            String tenantId, String requestId, String operation);

    /**
     * TTL 만료된 row hard delete — cleanup 스케줄러에서 주기 호출.
     *
     * @param cutoff 만료 기준 시각 (이 시각 이전 expires_at 은 삭제)
     * @return 삭제된 row 수
     */
    @Modifying
    @Query("DELETE FROM AdminRequestIdempotency a WHERE a.expiresAt < :cutoff")
    int deleteExpiredBefore(@Param("cutoff") LocalDateTime cutoff);
}
