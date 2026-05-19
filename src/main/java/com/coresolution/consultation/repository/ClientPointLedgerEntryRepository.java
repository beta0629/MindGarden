package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.ClientPointLedgerEntry;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

/**
 * 포인트 원장 저장소.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Repository
public interface ClientPointLedgerEntryRepository extends BaseRepository<ClientPointLedgerEntry, Long> {

    boolean existsByTenantIdAndIdempotencyKeyAndIsDeletedFalse(String tenantId, String idempotencyKey);

    /**
     * 테넌트·사용자별 최근 원장 (createdAt DESC).
     *
     * @param tenantId 테넌트 ID
     * @param userId   사용자 ID
     * @param pageable limit·정렬
     * @return 원장 목록
     */
    List<ClientPointLedgerEntry> findByTenantIdAndUserIdAndIsDeletedFalseOrderByCreatedAtDesc(
            String tenantId, Long userId, Pageable pageable);
}
