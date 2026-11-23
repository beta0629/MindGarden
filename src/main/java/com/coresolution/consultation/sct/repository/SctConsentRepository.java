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

    Optional<SctConsent> findByTenantIdAndInvitationIdAndConsentTypeAndRevokedFalse(
            String tenantId, Long invitationId, String consentType);

    Optional<SctConsent> findFirstByTenantIdAndClientIdAndConsentTypeAndRevokedFalseAndAgreedTrueOrderByAgreedAtDesc(
            String tenantId, Long clientId, String consentType);

    boolean existsByTenantIdAndInvitationIdAndConsentTypeAndAgreedTrueAndRevokedFalse(
            String tenantId, Long invitationId, String consentType);

    boolean existsByTenantIdAndClientIdAndConsentTypeAndAgreedTrueAndRevokedFalse(
            String tenantId, Long clientId, String consentType);

    boolean existsByTenantIdAndClientIdAndConsentTypeAndRevokedTrue(
            String tenantId, Long clientId, String consentType);

    List<SctConsent> findByTenantIdAndClientIdAndRevokedFalse(String tenantId, Long clientId);

    List<SctConsent> findByTenantIdAndInvitationIdAndClientIdIsNullAndRevokedFalse(
            String tenantId, Long invitationId);
}
