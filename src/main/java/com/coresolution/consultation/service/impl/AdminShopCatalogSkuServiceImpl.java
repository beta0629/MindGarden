package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.BankTransferConstants;
import com.coresolution.consultation.constant.ShopAdminOrderConstants;
import com.coresolution.consultation.constant.ShopCatalogCategory;
import com.coresolution.consultation.constant.ShopCatalogSkuConstants;
import com.coresolution.consultation.dto.shop.admin.ShopCatalogSkuAdminDetail;
import com.coresolution.consultation.dto.shop.admin.ShopCatalogSkuAdminItem;
import com.coresolution.consultation.dto.shop.admin.ShopCatalogSkuPriceHistoryItem;
import com.coresolution.consultation.dto.shop.admin.ShopCatalogSkuUpsertRequest;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.entity.ShopCatalogSkuPriceHistory;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.ShopCatalogSkuPriceHistoryRepository;
import com.coresolution.consultation.repository.ShopCatalogSkuRepository;
import com.coresolution.consultation.service.AdminShopCatalogSkuService;
import com.coresolution.consultation.service.ShopCatalogSkuCodeGenerator;
import com.coresolution.consultation.service.ShopCatalogSkuThumbnailService;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

/**
 * 어드민 카탈로그 SKU 서비스.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@Service
@RequiredArgsConstructor
public class AdminShopCatalogSkuServiceImpl implements AdminShopCatalogSkuService {

    private static final String ENTITY_NAME = "ShopCatalogSku";
    private static final String ANONYMOUS_PRINCIPAL = "anonymousUser";

    private final ShopCatalogSkuRepository shopCatalogSkuRepository;
    private final ShopCatalogSkuPriceHistoryRepository shopCatalogSkuPriceHistoryRepository;
    private final ShopCatalogSkuCodeGenerator shopCatalogSkuCodeGenerator;
    private final ShopCatalogSkuThumbnailService shopCatalogSkuThumbnailService;

    @Override
    @Transactional(readOnly = true)
    public List<ShopCatalogSkuAdminItem> listAllForTenant(String tenantId) {
        String tid = requireTenant(tenantId);
        List<ShopCatalogSku> rows =
                shopCatalogSkuRepository.findByTenantIdAndIsDeletedFalseOrderBySortOrderAscIdAsc(tid);
        List<ShopCatalogSkuAdminItem> out = new ArrayList<>(rows.size());
        for (ShopCatalogSku row : rows) {
            out.add(toItem(row));
        }
        return out;
    }

    @Override
    @Transactional(readOnly = true)
    public ShopCatalogSkuAdminDetail getForAdmin(String tenantId, Long id) {
        String tid = requireTenant(tenantId);
        ShopCatalogSku row = shopCatalogSkuRepository.findByIdAndTenantIdAndIsDeletedFalse(id, tid)
                .orElseThrow(() -> new EntityNotFoundException(ENTITY_NAME, id));
        return toDetail(row);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShopCatalogSkuPriceHistoryItem> listPriceHistory(String tenantId, Long skuId, int limit) {
        String tid = requireTenant(tenantId);
        shopCatalogSkuRepository.findByIdAndTenantIdAndIsDeletedFalse(skuId, tid)
                .orElseThrow(() -> new EntityNotFoundException(ENTITY_NAME, skuId));
        int capped = Math.min(
                Math.max(1, limit),
                ShopAdminOrderConstants.MAX_LIST_LIMIT);
        List<ShopCatalogSkuPriceHistory> rows = shopCatalogSkuPriceHistoryRepository
                .findByTenantIdAndSkuIdAndIsDeletedFalseOrderByChangedAtDescIdDesc(
                        tid, skuId, PageRequest.of(0, capped));
        List<ShopCatalogSkuPriceHistoryItem> out = new ArrayList<>(rows.size());
        for (ShopCatalogSkuPriceHistory row : rows) {
            out.add(toPriceHistoryItem(row));
        }
        return out;
    }

    @Override
    @Transactional
    public ShopCatalogSkuAdminDetail create(String tenantId, ShopCatalogSkuUpsertRequest request) {
        String tid = requireTenant(tenantId);
        String skuCode = resolveSkuCodeForCreate(tid, request.skuCode());
        assertSkuCodeUniqueForCreate(tid, skuCode);
        ShopCatalogSku row = new ShopCatalogSku();
        row.setTenantId(tid);
        row.setSkuCode(skuCode);
        applyUpsert(row, request);
        ShopCatalogSku saved = shopCatalogSkuRepository.save(row);
        recordPriceHistoryIfChanged(saved, null);
        return toDetail(saved);
    }

    @Override
    @Transactional
    public ShopCatalogSkuAdminDetail update(String tenantId, Long id, ShopCatalogSkuUpsertRequest request) {
        String tid = requireTenant(tenantId);
        ShopCatalogSku row = shopCatalogSkuRepository.findByIdAndTenantIdAndIsDeletedFalse(id, tid)
                .orElseThrow(() -> new EntityNotFoundException(ENTITY_NAME, id));
        Long previousUnitPriceMinor = row.getUnitPriceMinor();
        applyUpsert(row, request);
        ShopCatalogSku saved = shopCatalogSkuRepository.save(row);
        recordPriceHistoryIfChanged(saved, previousUnitPriceMinor);
        return toDetail(saved);
    }

    @Override
    @Transactional
    public ShopCatalogSkuAdminDetail uploadThumbnail(String tenantId, Long id, MultipartFile file) {
        String tid = requireTenant(tenantId);
        ShopCatalogSku row = shopCatalogSkuRepository.findByIdAndTenantIdAndIsDeletedFalse(id, tid)
                .orElseThrow(() -> new EntityNotFoundException(ENTITY_NAME, id));
        String thumbnailUrl = shopCatalogSkuThumbnailService.storeThumbnail(tid, id, file);
        row.setThumbnailUrl(thumbnailUrl);
        return toDetail(shopCatalogSkuRepository.save(row));
    }

    @Override
    @Transactional
    public void patchCatalogVisible(String tenantId, Long id, boolean catalogVisible) {
        String tid = requireTenant(tenantId);
        ShopCatalogSku row = shopCatalogSkuRepository.findByIdAndTenantIdAndIsDeletedFalse(id, tid)
                .orElseThrow(() -> new EntityNotFoundException(ENTITY_NAME, id));
        row.setCatalogVisible(catalogVisible);
        shopCatalogSkuRepository.save(row);
    }

    private String resolveSkuCodeForCreate(String tenantId, String requestedSkuCode) {
        if (StringUtils.hasText(requestedSkuCode)) {
            return requestedSkuCode.trim();
        }
        for (int attempt = 0; attempt < ShopCatalogSkuConstants.SKU_CODE_GENERATION_MAX_ATTEMPTS; attempt++) {
            String candidate = shopCatalogSkuCodeGenerator.generateNextCode(tenantId);
            if (!shopCatalogSkuRepository.existsByTenantIdAndSkuCodeAndIsDeletedFalse(tenantId, candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("SKU 코드 자동 발급에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }

    private void assertSkuCodeUniqueForCreate(String tenantId, String skuCode) {
        if (shopCatalogSkuRepository.existsByTenantIdAndSkuCodeAndIsDeletedFalse(tenantId, skuCode)) {
            throw new IllegalArgumentException(ShopCatalogSkuConstants.DUPLICATE_SKU_CODE_MESSAGE + skuCode);
        }
    }

    private void recordPriceHistoryIfChanged(ShopCatalogSku row, Long previousUnitPriceMinor) {
        Long newPrice = row.getUnitPriceMinor();
        if (previousUnitPriceMinor != null && Objects.equals(previousUnitPriceMinor, newPrice)) {
            return;
        }
        LocalDateTime changedAt = LocalDateTime.now();
        ShopCatalogSkuPriceHistory history = ShopCatalogSkuPriceHistory.builder()
                .skuId(row.getId())
                .skuCode(row.getSkuCode())
                .unitPriceMinor(newPrice)
                .currency(row.getCurrency())
                .changedAt(changedAt)
                .changedBy(resolveChangedBy())
                .build();
        history.setTenantId(row.getTenantId());
        shopCatalogSkuPriceHistoryRepository.save(history);
    }

    private static String resolveChangedBy() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()) {
                String name = authentication.getName();
                if (StringUtils.hasText(name) && !ANONYMOUS_PRINCIPAL.equals(name)) {
                    return name.trim();
                }
            }
        } catch (RuntimeException ignored) {
            // SecurityContext 없음(단위 테스트 등)
        }
        return null;
    }

    private static String requireTenant(String tenantId) {
        if (!StringUtils.hasText(tenantId)) {
            throw new IllegalArgumentException("tenantId가 필요합니다.");
        }
        return tenantId.trim();
    }

    private void applyUpsert(ShopCatalogSku row, ShopCatalogSkuUpsertRequest request) {
        row.setTitle(request.title().trim());
        row.setDescriptionText(
                StringUtils.hasText(request.descriptionText()) ? request.descriptionText().trim() : null);
        row.setUnitPriceMinor(request.unitPriceMinor());
        String currency = StringUtils.hasText(request.currency())
                ? request.currency().trim().toUpperCase()
                : BankTransferConstants.CURRENCY_KRW;
        row.setCurrency(currency);
        row.setCatalogVisible(request.catalogVisible());
        row.setActive(request.active());
        row.setSortOrder(request.sortOrder());
        row.setCatalogCategory(normalizeCatalogCategory(request.catalogCategory(), row.getSkuCode()));

        if (StringUtils.hasText(request.thumbnailUrl())) {
            row.setThumbnailUrl(request.thumbnailUrl().trim());
        }
        requireThumbnailUrl(row);
    }

    private static void requireThumbnailUrl(ShopCatalogSku row) {
        if (!StringUtils.hasText(row.getThumbnailUrl())) {
            throw new IllegalArgumentException(ShopCatalogSkuConstants.THUMBNAIL_REQUIRED_MESSAGE);
        }
    }

    private static String normalizeCatalogCategory(String requestedCategory, String skuCode) {
        if (StringUtils.hasText(requestedCategory)) {
            String normalized = requestedCategory.trim().toUpperCase();
            if (ShopCatalogCategory.ASSESSMENT.equals(normalized)) {
                return ShopCatalogCategory.ASSESSMENT;
            }
            return ShopCatalogCategory.CONSULTATION;
        }
        if (skuCode != null) {
            String upper = skuCode.toUpperCase();
            if (upper.startsWith("ASSESS_") || upper.startsWith("TEST_") || upper.contains("_ASSESS")) {
                return ShopCatalogCategory.ASSESSMENT;
            }
        }
        return ShopCatalogCategory.CONSULTATION;
    }

    private static ShopCatalogSkuAdminItem toItem(ShopCatalogSku row) {
        return new ShopCatalogSkuAdminItem(
                row.getId(),
                row.getSkuCode(),
                row.getTitle(),
                row.getUnitPriceMinor(),
                row.getCurrency(),
                row.getCatalogCategory(),
                row.getThumbnailUrl(),
                Boolean.TRUE.equals(row.getCatalogVisible()),
                Boolean.TRUE.equals(row.getActive()),
                row.getSortOrder() != null ? row.getSortOrder() : 0,
                row.getUpdatedAt());
    }

    private static ShopCatalogSkuAdminDetail toDetail(ShopCatalogSku row) {
        return new ShopCatalogSkuAdminDetail(
                row.getId(),
                row.getSkuCode(),
                row.getTitle(),
                row.getDescriptionText(),
                row.getUnitPriceMinor(),
                row.getCurrency(),
                row.getCatalogCategory(),
                row.getThumbnailUrl(),
                Boolean.TRUE.equals(row.getCatalogVisible()),
                Boolean.TRUE.equals(row.getActive()),
                row.getSortOrder() != null ? row.getSortOrder() : 0);
    }

    private static ShopCatalogSkuPriceHistoryItem toPriceHistoryItem(ShopCatalogSkuPriceHistory row) {
        return new ShopCatalogSkuPriceHistoryItem(
                row.getId(),
                row.getSkuId(),
                row.getSkuCode(),
                row.getUnitPriceMinor(),
                row.getCurrency(),
                row.getChangedAt(),
                row.getChangedBy());
    }
}
