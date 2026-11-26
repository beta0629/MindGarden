package com.coresolution.consultation.repository;

import java.util.Optional;

import com.coresolution.consultation.entity.ClientEvent;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
