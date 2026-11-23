package com.coresolution.consultation.sct.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.sct.entity.SctInvitation;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * SCT 초대 Repository — 모든 조회에 tenantId 필수.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
public interface SctInvitationRepository extends JpaRepository<SctInvitation, Long> {

    Optional<SctInvitation> findByTokenHashAndIsDeletedFalse(String tokenHash);

    /**
     * verify fail count 원자적 갱신용 행 잠금.
     *
     * @param tokenHash 토큰 해시
     * @return 초대
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM SctInvitation i WHERE i.tokenHash = :tokenHash AND i.isDeleted = false")
    Optional<SctInvitation> findByTokenHashAndIsDeletedFalseForUpdate(@Param("tokenHash") String tokenHash);

    Optional<SctInvitation> findByTenantIdAndIdAndIsDeletedFalse(String tenantId, Long id);

    List<SctInvitation> findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId);

    List<SctInvitation> findByTenantIdAndClientIdAndIsDeletedFalseOrderByCreatedAtDesc(
            String tenantId, Long clientId);

    List<SctInvitation> findByTenantIdAndClientIdIsNullAndIsDeletedFalseOrderByCreatedAtDesc(
            String tenantId);

    List<SctInvitation> findByTenantIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(
            String tenantId, String status);

    Optional<SctInvitation> findFirstByTenantIdAndClientIdAndStatusAndIsDeletedFalseOrderBySubmittedAtDesc(
            String tenantId, Long clientId, String status);
}
