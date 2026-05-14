package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.dto.PsychoEducationArticleResponse;
import com.coresolution.consultation.dto.content.ContentReorderRequest;
import com.coresolution.consultation.dto.content.PsychoEducationArticleAdminDetail;
import com.coresolution.consultation.dto.content.PsychoEducationArticleAdminItem;
import com.coresolution.consultation.dto.content.PsychoEducationArticleUpsertRequest;
import com.coresolution.consultation.entity.PsychoEducationArticle;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.PsychoEducationArticleRepository;
import com.coresolution.consultation.service.PsychoEducationAdminService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * 심리교육 마스터 어드민 서비스.
 *
 * @author MindGarden
 * @since 2026-05-15
 */
@Service
@RequiredArgsConstructor
public class PsychoEducationAdminServiceImpl implements PsychoEducationAdminService {

    private static final String ENTITY_NAME = "PsychoEducationArticle";

    private final PsychoEducationArticleRepository psychoEducationArticleRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public List<PsychoEducationArticleAdminItem> listAllForTenant(String tenantId) {
        String tid = requireTenant(tenantId);
        List<PsychoEducationArticle> rows =
            psychoEducationArticleRepository.findByTenantIdAndIsDeletedFalseOrderBySortOrderAscIdAsc(tid);
        List<PsychoEducationArticleAdminItem> out = new ArrayList<>(rows.size());
        for (PsychoEducationArticle row : rows) {
            out.add(new PsychoEducationArticleAdminItem(
                row.getId(),
                row.getSlug(),
                row.getTitle(),
                row.getCategory(),
                row.isPublished(),
                row.getSortOrder(),
                row.getUpdatedAt()
            ));
        }
        return out;
    }

    @Override
    @Transactional(readOnly = true)
    public PsychoEducationArticleAdminDetail getForAdmin(String tenantId, Long id) {
        String tid = requireTenant(tenantId);
        PsychoEducationArticle row = psychoEducationArticleRepository.findByIdAndTenantIdAndIsDeletedFalse(id, tid)
            .orElseThrow(() -> new EntityNotFoundException(ENTITY_NAME, id));
        return toAdminDetail(row);
    }

    @Override
    @Transactional
    public PsychoEducationArticleAdminDetail create(String tenantId, PsychoEducationArticleUpsertRequest request) {
        String tid = requireTenant(tenantId);
        String slug = normalizeSlug(request.slug());
        if (psychoEducationArticleRepository.existsByTenantIdAndSlugAndIsDeletedFalse(tid, slug)) {
            throw new IllegalArgumentException("이미 사용 중인 slug 입니다: " + slug);
        }
        PsychoEducationArticle row = new PsychoEducationArticle();
        row.setTenantId(tid);
        row.setSlug(slug);
        applyUpsert(row, request);
        PsychoEducationArticle saved = psychoEducationArticleRepository.save(row);
        return toAdminDetail(saved);
    }

    @Override
    @Transactional
    public PsychoEducationArticleAdminDetail update(String tenantId, Long id, PsychoEducationArticleUpsertRequest request) {
        String tid = requireTenant(tenantId);
        PsychoEducationArticle row = psychoEducationArticleRepository.findByIdAndTenantIdAndIsDeletedFalse(id, tid)
            .orElseThrow(() -> new EntityNotFoundException(ENTITY_NAME, id));
        String slug = normalizeSlug(request.slug());
        if (psychoEducationArticleRepository.existsByTenantIdAndSlugAndIsDeletedFalseAndIdNot(tid, slug, id)) {
            throw new IllegalArgumentException("이미 사용 중인 slug 입니다: " + slug);
        }
        row.setSlug(slug);
        applyUpsert(row, request);
        PsychoEducationArticle saved = psychoEducationArticleRepository.save(row);
        return toAdminDetail(saved);
    }

    @Override
    @Transactional
    public void softDelete(String tenantId, Long id) {
        String tid = requireTenant(tenantId);
        PsychoEducationArticle row = psychoEducationArticleRepository.findByIdAndTenantIdAndIsDeletedFalse(id, tid)
            .orElseThrow(() -> new EntityNotFoundException(ENTITY_NAME, id));
        row.delete();
        psychoEducationArticleRepository.save(row);
    }

    @Override
    @Transactional
    public void patchPublished(String tenantId, Long id, boolean published) {
        String tid = requireTenant(tenantId);
        PsychoEducationArticle row = psychoEducationArticleRepository.findByIdAndTenantIdAndIsDeletedFalse(id, tid)
            .orElseThrow(() -> new EntityNotFoundException(ENTITY_NAME, id));
        row.setPublished(published);
        psychoEducationArticleRepository.save(row);
    }

    @Override
    @Transactional
    public void reorder(String tenantId, ContentReorderRequest request) {
        String tid = requireTenant(tenantId);
        List<Long> ids = request.orderedIds();
        for (int i = 0; i < ids.size(); i++) {
            Long id = ids.get(i);
            PsychoEducationArticle row = psychoEducationArticleRepository.findByIdAndTenantIdAndIsDeletedFalse(id, tid)
                .orElseThrow(() -> new EntityNotFoundException(ENTITY_NAME, id));
            row.setSortOrder((i + 1) * 10);
            psychoEducationArticleRepository.save(row);
        }
    }

    private static String requireTenant(String tenantId) {
        if (!StringUtils.hasText(tenantId)) {
            throw new IllegalArgumentException("tenantId가 필요합니다.");
        }
        return tenantId.trim();
    }

    private static String normalizeSlug(String slug) {
        if (!StringUtils.hasText(slug)) {
            throw new IllegalArgumentException("slug는 비울 수 없습니다.");
        }
        return slug.trim();
    }

    private void applyUpsert(PsychoEducationArticle row, PsychoEducationArticleUpsertRequest request) {
        row.setTitle(request.title().trim());
        row.setSummary(request.summary().trim());
        row.setBody(request.body().trim());
        row.setCategory(request.category().trim());
        row.setCategoryLabel(request.categoryLabel().trim());
        row.setReadMinutes(request.readMinutes());
        row.setPagesJson(toPagesJson(request.pages()));
        row.setPublished(request.published());
        row.setSortOrder(request.sortOrder());
    }

    private JsonNode toPagesJson(List<PsychoEducationArticleResponse.Page> pages) {
        ArrayNode arr = objectMapper.createArrayNode();
        for (PsychoEducationArticleResponse.Page p : pages) {
            ObjectNode o = objectMapper.createObjectNode();
            o.put("title", p.title() != null ? p.title() : "");
            o.put("body", p.body() != null ? p.body() : "");
            arr.add(o);
        }
        return arr;
    }

    private PsychoEducationArticleAdminDetail toAdminDetail(PsychoEducationArticle row) {
        return new PsychoEducationArticleAdminDetail(
            row.getId(),
            row.getSlug(),
            row.isPublished(),
            row.getSortOrder(),
            row.getTitle(),
            row.getSummary(),
            row.getBody(),
            row.getCategory(),
            row.getCategoryLabel(),
            row.getReadMinutes(),
            toPages(row.getPagesJson())
        );
    }

    private List<PsychoEducationArticleResponse.Page> toPages(JsonNode node) {
        if (node == null || !node.isArray()) {
            return List.of();
        }
        List<PsychoEducationArticleResponse.Page> list = new ArrayList<>();
        for (JsonNode n : node) {
            list.add(new PsychoEducationArticleResponse.Page(
                n.path("title").asText(""),
                n.path("body").asText("")
            ));
        }
        return list;
    }
}
