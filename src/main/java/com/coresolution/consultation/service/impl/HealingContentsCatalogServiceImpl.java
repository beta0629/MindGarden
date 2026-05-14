package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.HealingContentMediaType;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.HealingContentItemResponse;
import com.coresolution.consultation.entity.DailyHealingContent;
import com.coresolution.consultation.entity.HealingContentCatalogItem;
import com.coresolution.consultation.repository.DailyHealingContentRepository;
import com.coresolution.consultation.repository.HealingContentCatalogItemRepository;
import com.coresolution.consultation.service.HealingContentsCatalogService;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * 테넌트 힐링 카탈로그 마스터(DB) + 일별 힐링({@link DailyHealingContent}) 병합.
 *
 * @author MindGarden
 * @since 2026-05-13
 */
@Service
@RequiredArgsConstructor
public class HealingContentsCatalogServiceImpl implements HealingContentsCatalogService {

    private static final int DESCRIPTION_MAX_LEN = 280;

    private final DailyHealingContentRepository dailyHealingContentRepository;
    private final HealingContentCatalogItemRepository healingContentCatalogItemRepository;

    @Override
    @Transactional(readOnly = true)
    public List<HealingContentItemResponse> listForClientTenant(String tenantId) {
        if (!StringUtils.hasText(tenantId)) {
            return List.of();
        }
        String tid = tenantId.trim();
        LocalDate today = LocalDate.now();
        List<DailyHealingContent> dailyRows = dailyHealingContentRepository.findByTenantIdAndDateAndUserRole(
            tid, today, UserRole.CLIENT.name());

        List<HealingContentCatalogItem> catalogRows =
            healingContentCatalogItemRepository.findByTenantIdAndIsDeletedFalseAndPublishedTrueOrderBySortOrderAscIdAsc(
                tid);

        List<HealingContentItemResponse> merged =
            new ArrayList<>(dailyRows.size() + catalogRows.size());
        for (HealingContentCatalogItem row : catalogRows) {
            merged.add(mapCatalogRow(row));
        }
        for (DailyHealingContent row : dailyRows) {
            merged.add(mapDailyRow(row));
        }
        return List.copyOf(merged);
    }

    private static HealingContentItemResponse mapCatalogRow(HealingContentCatalogItem row) {
        HealingContentMediaType type = HealingContentMediaType.valueOf(row.getMediaType().trim().toUpperCase());
        return HealingContentItemResponse.builder()
            .id(row.getId())
            .title(row.getTitle())
            .description(row.getDescription() != null ? row.getDescription() : "")
            .category(row.getCategory())
            .type(type)
            .thumbnailUrl(row.getThumbnailUrl())
            .contentUrl(row.getContentUrl())
            .durationMinutes(row.getDurationMinutes())
            .build();
    }

    private static HealingContentItemResponse mapDailyRow(DailyHealingContent row) {
        String category = row.getCategory() != null ? row.getCategory() : "GENERAL";
        HealingContentMediaType type = mapCategoryToType(category);
        return HealingContentItemResponse.builder()
            .id(row.getId())
            .title(row.getTitle())
            .description(truncatePlainText(row.getContent()))
            .category(category)
            .type(type)
            .build();
    }

    private static HealingContentMediaType mapCategoryToType(String category) {
        if (category == null) {
            return HealingContentMediaType.ARTICLE;
        }
        String c = category.trim().toUpperCase();
        if ("MEDITATION".equals(c)) {
            return HealingContentMediaType.MEDITATION;
        }
        return HealingContentMediaType.ARTICLE;
    }

    private static String truncatePlainText(String html) {
        if (html == null) {
            return "";
        }
        String plain = html.replaceAll("<[^>]*>", " ").replaceAll("\\s+", " ").trim();
        if (plain.length() <= DESCRIPTION_MAX_LEN) {
            return plain;
        }
        return plain.substring(0, DESCRIPTION_MAX_LEN) + "…";
    }
}
