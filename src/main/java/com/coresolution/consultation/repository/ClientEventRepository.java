package com.coresolution.consultation.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import com.coresolution.consultation.constant.ClientEventSource;
import com.coresolution.consultation.entity.ClientEvent;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * {@link ClientEvent} 리포지토리 — 내담자 관리용 타임라인.
 *
 * <p>모든 조회는 {@code tenantId} 를 필수 인자로 받는다.</p>
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@Repository
public interface ClientEventRepository extends JpaRepository<ClientEvent, Long> {

    /**
     * 테넌트·내담자 기준 타임라인 페이지 조회.
     *
     * @param tenantId 테넌트 ID
     * @param clientId 내담자 ID
     * @param pageable 페이지·정렬
     * @return 이벤트 페이지
     */
    Page<ClientEvent> findByTenantIdAndClientId(String tenantId, Long clientId, Pageable pageable);

    /**
     * 멱등 키로 기존 행을 조회한다.
     *
     * @param tenantId 테넌트 ID
     * @param idempotencyKey 멱등 키
     * @return 기존 이벤트(없으면 empty)
     */
    Optional<ClientEvent> findByTenantIdAndIdempotencyKey(String tenantId, String idempotencyKey);

    /**
     * 테넌트·source 기준 행 조회 (롤백 후보 스캔).
     *
     * @param tenantId 테넌트 ID
     * @param source 출처
     * @return 이벤트 목록
     */
    List<ClientEvent> findByTenantIdAndSource(String tenantId, ClientEventSource source);

    /**
     * 테넌트·source·ID 집합 삭제 (롤백 apply).
     *
     * @param tenantId 테넌트 ID
     * @param source 출처({@link ClientEventSource#BACKFILLED} 만)
     * @param ids 삭제 대상 ID
     * @return 삭제 건수
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM ClientEvent e WHERE e.tenantId = :tenantId AND e.source = :source AND e.id IN :ids")
    int deleteByTenantIdAndSourceAndIdIn(
            @Param("tenantId") String tenantId,
            @Param("source") ClientEventSource source,
            @Param("ids") Collection<Long> ids);
}
