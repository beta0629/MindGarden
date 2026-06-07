package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.dto.PsychoEducationArticleResponse;
import com.coresolution.consultation.dto.PsychoEducationArticleResponse.Page;
import com.coresolution.consultation.dto.SourceCitation;
import com.coresolution.consultation.entity.PsychoEducationArticle;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.PsychoEducationArticleRepository;
import com.coresolution.consultation.service.PsychoEducationService;
import com.coresolution.core.context.TenantContextHolder;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 심리 교육 콘텐츠 서비스 — 테넌트 마스터 DB 기반, 노출(is_published) 필터.
 *
 * @author MindGarden
 * @since 2026-05-13
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PsychoEducationServiceImpl implements PsychoEducationService {

    private static final String ENTITY_NAME = "PsychoEducationArticle";

    private final PsychoEducationArticleRepository psychoEducationArticleRepository;

    @Override
    @Transactional(readOnly = true)
    public List<PsychoEducationArticleResponse> listArticles() {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        List<PsychoEducationArticle> rows =
            psychoEducationArticleRepository.findByTenantIdAndIsDeletedFalseAndPublishedTrueOrderBySortOrderAscIdAsc(
                tenantId);
        List<PsychoEducationArticleResponse> out = new ArrayList<>(rows.size());
        for (PsychoEducationArticle row : rows) {
            out.add(toResponse(row));
        }
        log.debug("심리 교육 콘텐츠 목록 조회: tenantId={}, count={}", tenantId, out.size());
        return out;
    }

    @Override
    @Transactional(readOnly = true)
    public PsychoEducationArticleResponse getArticle(Long articleId) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        if (articleId == null || articleId <= 0L) {
            throw new EntityNotFoundException(ENTITY_NAME, articleId);
        }
        PsychoEducationArticle row = psychoEducationArticleRepository.findByIdAndTenantIdAndIsDeletedFalse(articleId, tenantId)
            .orElseThrow(() -> {
                log.info("심리 교육 콘텐츠 없음: tenantId={}, articleId={}", tenantId, articleId);
                return new EntityNotFoundException(ENTITY_NAME, articleId);
            });
        if (!row.isPublished()) {
            log.info("심리 교육 비노출: tenantId={}, articleId={}", tenantId, articleId);
            throw new EntityNotFoundException(ENTITY_NAME, articleId);
        }
        log.debug("심리 교육 콘텐츠 상세 조회: tenantId={}, articleId={}", tenantId, articleId);
        return toResponse(row);
    }

    private static PsychoEducationArticleResponse toResponse(PsychoEducationArticle row) {
        List<Page> pages = parsePages(row.getPagesJson());
        String body = pages.isEmpty() ? "" : pages.get(0).body();
        return new PsychoEducationArticleResponse(
            row.getId(),
            row.getTitle(),
            row.getSummary(),
            body,
            row.getCategory(),
            row.getCategoryLabel(),
            row.getReadMinutes(),
            pages,
            buildSource(row)
        );
    }

    private static SourceCitation buildSource(PsychoEducationArticle row) {
        SourceCitation source = new SourceCitation(
            row.getSourceLabel(),
            row.getSourceUrl(),
            row.getSourceAuthor(),
            row.getSourcePublishedYear()
        );
        return source.isEmpty() ? null : source;
    }

    private static List<Page> parsePages(JsonNode node) {
        if (node == null || !node.isArray()) {
            return List.of();
        }
        List<Page> list = new ArrayList<>();
        for (JsonNode n : node) {
            list.add(new Page(
                n.path("title").asText(""),
                n.path("body").asText("")
            ));
        }
        return list;
    }
}
