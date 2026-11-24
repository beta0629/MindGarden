package com.coresolution.consultation.sct.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.sct.entity.SctFormTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * SCT 양식 템플릿 Repository.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
public interface SctFormTemplateRepository extends JpaRepository<SctFormTemplate, Long> {

    Optional<SctFormTemplate> findByTenantIdAndFormTypeAndFormVersionAndIsActiveTrueAndIsDeletedFalse(
            String tenantId, String formType, String formVersion);

    List<SctFormTemplate> findByTenantIdAndIsActiveTrueAndIsDeletedFalse(String tenantId);

    Optional<SctFormTemplate> findByIdAndIsDeletedFalse(Long id);
}
