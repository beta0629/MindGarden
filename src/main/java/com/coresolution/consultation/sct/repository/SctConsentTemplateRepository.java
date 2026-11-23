package com.coresolution.consultation.sct.repository;

import java.util.Optional;
import com.coresolution.consultation.sct.entity.SctConsentTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * SCT 동의 템플릿 Repository.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
public interface SctConsentTemplateRepository extends JpaRepository<SctConsentTemplate, Long> {

    Optional<SctConsentTemplate> findFirstByTenantIdAndConsentTypeAndIsActiveTrueOrderByCreatedAtDesc(
            String tenantId, String consentType);
}
