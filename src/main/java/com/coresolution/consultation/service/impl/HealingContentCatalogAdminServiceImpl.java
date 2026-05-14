package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.HealingContentMediaType;
import com.coresolution.consultation.dto.content.ContentReorderRequest;
import com.coresolution.consultation.dto.content.HealingContentCatalogAdminDetail;
import com.coresolution.consultation.dto.content.HealingContentCatalogAdminItem;
import com.coresolution.consultation.dto.content.HealingContentCatalogUpsertRequest;
import com.coresolution.consultation.entity.HealingContentCatalogItem;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.HealingContentCatalogItemRepository;
import com.coresolution.consultation.service.HealingContentCatalogAdminService;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * 힐링 카탈로그 마스터 어드민 서비스.
 *
 * @author MindGarden
 * @since 2026-05-15
 */
@Service
@RequiredArgsConstructor
public class HealingContentCatalogAdminServiceImpl implements HealingContentCatalogAdminService {

    private static final String ENTITY_NAME = "HealingContentCatalogItem";

    private final HealingContentCatalogItemRepository healingContentCatalogItemRepository;

    @Override
    @Transactional(readOnly = true)
    public List<HealingContentCatalogAdminItem> listAllForTenant(String tenantId) {
        String tid = requireTenant(tenantId);
        List<HealingContentCatalogItem> rows =
            healingContentCatalogItemRepository.findByTenantIdAndIsDeletedFalseOrderBySortOrderAscIdAsc(tid);
        List<HealingContentCatalogAdminItem> out = new ArrayList<>(rows.size());
        for (HealingContentCatalogItem row : rows) {
            out.add(new HealingContentCatalogAdminItem(
                row.getId(),
                row.getCode(),
                row.getTitle(),
                row.getCategory(),
                row.getMediaType(),
                row.isPublished(),
                row.getSortOrder(),
                row.getUpdatedAt()
            ));
        }
        return out;
    }

    @Override
    @Transactional(readOnly = true)
    public HealingContentCatalogAdminDetail getForAdmin(String tenantId, Long id) {
        String tid = requireTenant(tenantId);
        HealingContentCatalogItem row = healingContentCatalogItemRepository.findByIdAndTenantIdAndIsDeletedFalse(id, tid)
            .orElseThrow(() -> new EntityNotFoundException(ENTITY_NAME, id));
        return toDetail(row);
    }

    @Override
    @Transactional
    public HealingContentCatalogAdminDetail create(String tenantId, HealingContentCatalogUpsertRequest request) {
        String tid = requireTenant(tenantId);
        String code = normalizeCode(request.code());
        if (healingContentCatalogItemRepository.existsByTenantIdAndCodeAndIsDeletedFalse(tid, code)) {
            throw new IllegalArgumentException("이미 사용 중인 code 입니다: " + code);
        }
        HealingContentCatalogItem row = new HealingContentCatalogItem();
        row.setTenantId(tid);
        row.setCode(code);
        applyUpsert(row, request);
        HealingContentCatalogItem saved = healingContentCatalogItemRepository.save(row);
        return toDetail(saved);
    }

    @Override
    @Transactional
    public HealingContentCatalogAdminDetail update(String tenantId, Long id, HealingContentCatalogUpsertRequest request) {
        String tid = requireTenant(tenantId);
        HealingContentCatalogItem row = healingContentCatalogItemRepository.findByIdAndTenantIdAndIsDeletedFalse(id, tid)
            .orElseThrow(() -> new EntityNotFoundException(ENTITY_NAME, id));
        String code = normalizeCode(request.code());
        if (healingContentCatalogItemRepository.existsByTenantIdAndCodeAndIsDeletedFalseAndIdNot(tid, code, id)) {
            throw new IllegalArgumentException("이미 사용 중인 code 입니다: " + code);
        }
        row.setCode(code);
        applyUpsert(row, request);
        HealingContentCatalogItem saved = healingContentCatalogItemRepository.save(row);
        return toDetail(saved);
    }

    @Override
    @Transactional
    public void softDelete(String tenantId, Long id) {
        String tid = requireTenant(tenantId);
        HealingContentCatalogItem row = healingContentCatalogItemRepository.findByIdAndTenantIdAndIsDeletedFalse(id, tid)
            .orElseThrow(() -> new EntityNotFoundException(ENTITY_NAME, id));
        row.delete();
        healingContentCatalogItemRepository.save(row);
    }

    @Override
    @Transactional
    public void patchPublished(String tenantId, Long id, boolean published) {
        String tid = requireTenant(tenantId);
        HealingContentCatalogItem row = healingContentCatalogItemRepository.findByIdAndTenantIdAndIsDeletedFalse(id, tid)
            .orElseThrow(() -> new EntityNotFoundException(ENTITY_NAME, id));
        row.setPublished(published);
        healingContentCatalogItemRepository.save(row);
    }

    @Override
    @Transactional
    public void reorder(String tenantId, ContentReorderRequest request) {
        String tid = requireTenant(tenantId);
        List<Long> ids = request.orderedIds();
        for (int i = 0; i < ids.size(); i++) {
            Long id = ids.get(i);
            HealingContentCatalogItem row =
                healingContentCatalogItemRepository.findByIdAndTenantIdAndIsDeletedFalse(id, tid)
                    .orElseThrow(() -> new EntityNotFoundException(ENTITY_NAME, id));
            row.setSortOrder((i + 1) * 10);
            healingContentCatalogItemRepository.save(row);
        }
    }

    private static String requireTenant(String tenantId) {
        if (!StringUtils.hasText(tenantId)) {
            throw new IllegalArgumentException("tenantId가 필요합니다.");
        }
        return tenantId.trim();
    }

    private static String normalizeCode(String code) {
        if (!StringUtils.hasText(code)) {
            throw new IllegalArgumentException("code는 비울 수 없습니다.");
        }
        return code.trim();
    }

    private static void applyUpsert(HealingContentCatalogItem row, HealingContentCatalogUpsertRequest request) {
        row.setTitle(request.title().trim());
        row.setDescription(request.description() != null ? request.description().trim() : null);
        row.setCategory(request.category().trim());
        String mt = request.mediaType().trim().toUpperCase();
        try {
            HealingContentMediaType.valueOf(mt);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("지원하지 않는 mediaType 입니다: " + mt);
        }
        row.setMediaType(mt);
        row.setThumbnailUrl(StringUtils.hasText(request.thumbnailUrl()) ? request.thumbnailUrl().trim() : null);
        row.setContentUrl(StringUtils.hasText(request.contentUrl()) ? request.contentUrl().trim() : null);
        row.setDurationMinutes(request.durationMinutes());
        row.setPublished(request.published());
        row.setSortOrder(request.sortOrder());
    }

    private static HealingContentCatalogAdminDetail toDetail(HealingContentCatalogItem row) {
        return new HealingContentCatalogAdminDetail(
            row.getId(),
            row.getCode(),
            row.isPublished(),
            row.getSortOrder(),
            row.getTitle(),
            row.getDescription(),
            row.getCategory(),
            row.getMediaType(),
            row.getThumbnailUrl(),
            row.getContentUrl(),
            row.getDurationMinutes()
        );
    }
}
