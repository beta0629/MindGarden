package com.coresolution.consultation.sct.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.sct.entity.SctInvitation;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * SCT 초대 Repository — 모든 조회에 tenantId 필수.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
public interface SctInvitationRepository extends JpaRepository<SctInvitation, Long> {

    Optional<SctInvitation> findByTokenHashAndIsDeletedFalse(String tokenHash);

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
