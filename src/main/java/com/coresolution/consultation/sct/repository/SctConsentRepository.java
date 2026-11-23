package com.coresolution.consultation.sct.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.sct.entity.SctConsent;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * SCT 동의 Repository.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
public interface SctConsentRepository extends JpaRepository<SctConsent, Long> {

    List<SctConsent> findByTenantIdAndInvitationId(String tenantId, Long invitationId);

    Optional<SctConsent> findByTenantIdAndInvitationIdAndConsentType(
            String tenantId, Long invitationId, String consentType);

    boolean existsByTenantIdAndInvitationIdAndConsentTypeAndAgreedTrue(
            String tenantId, Long invitationId, String consentType);
}
