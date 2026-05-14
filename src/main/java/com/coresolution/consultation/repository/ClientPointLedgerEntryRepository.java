package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.ClientPointLedgerEntry;
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
}
