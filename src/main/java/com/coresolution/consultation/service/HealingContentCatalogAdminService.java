package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.content.ContentReorderRequest;
import com.coresolution.consultation.dto.content.HealingContentCatalogAdminDetail;
import com.coresolution.consultation.dto.content.HealingContentCatalogAdminItem;
import com.coresolution.consultation.dto.content.HealingContentCatalogUpsertRequest;
import java.util.List;

/**
 * 힐링 카탈로그 마스터 어드민 CRUD·노출·순서.
 *
 * @author MindGarden
 * @since 2026-05-15
 */
public interface HealingContentCatalogAdminService {

    List<HealingContentCatalogAdminItem> listAllForTenant(String tenantId);

    HealingContentCatalogAdminDetail getForAdmin(String tenantId, Long id);

    HealingContentCatalogAdminDetail create(String tenantId, HealingContentCatalogUpsertRequest request);

    HealingContentCatalogAdminDetail update(String tenantId, Long id, HealingContentCatalogUpsertRequest request);

    void softDelete(String tenantId, Long id);

    void patchPublished(String tenantId, Long id, boolean published);

    void reorder(String tenantId, ContentReorderRequest request);
}
