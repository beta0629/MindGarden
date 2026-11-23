package com.coresolution.consultation.sct.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.sct.entity.SctFormItem;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * SCT 문항 Repository.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
public interface SctFormItemRepository extends JpaRepository<SctFormItem, Long> {

    List<SctFormItem> findByFormTemplateIdOrderBySortOrderAsc(Long formTemplateId);

    Optional<SctFormItem> findByIdAndFormTemplateId(Long id, Long formTemplateId);

    long countByFormTemplateId(Long formTemplateId);
}
