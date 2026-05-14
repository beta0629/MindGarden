package com.coresolution.consultation.repository;

import java.util.Optional;
import com.coresolution.consultation.entity.ClientPointWallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 포인트 지갑 저장소.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Repository
public interface ClientPointWalletRepository extends BaseRepository<ClientPointWallet, Long> {

    @Query("SELECT w FROM ClientPointWallet w WHERE w.tenantId = :tenantId AND w.userId = :userId AND w.isDeleted = false")
    Optional<ClientPointWallet> findByTenantIdAndUserId(
            @Param("tenantId") String tenantId,
            @Param("userId") Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM ClientPointWallet w WHERE w.tenantId = :tenantId AND w.userId = :userId AND w.isDeleted = false")
    Optional<ClientPointWallet> lockByTenantIdAndUserId(
            @Param("tenantId") String tenantId,
            @Param("userId") Long userId);
}
