package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.BankTransferConstants;
import com.coresolution.consultation.constant.ShopAdminOrderConstants;
import com.coresolution.consultation.constant.ShopCatalogCategory;
import com.coresolution.consultation.constant.ShopCatalogSkuConstants;
import com.coresolution.consultation.constant.ShopSessionCountConstants;
import com.coresolution.consultation.dto.shop.ShopCatalogPackageIdentity;
import com.coresolution.consultation.dto.shop.admin.ShopCatalogLegacySkuItem;
import com.coresolution.consultation.dto.shop.admin.ShopCatalogPackageContentRequest;
import com.coresolution.consultation.dto.shop.admin.ShopCatalogPackageFeeItem;
import com.coresolution.consultation.dto.shop.admin.ShopCatalogPackageFeeListResponse;
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
import com.coresolution.consultation.service.ShopCatalogPackageOfferResolver;
import com.coresolution.consultation.service.ShopCatalogSkuCodeGenerator;
import com.coresolution.consultation.service.ShopCatalogSkuThumbnailService;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
    private final ShopCatalogPackageOfferResolver shopCatalogPackageOfferResolver;

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
    public ShopCatalogPackageFeeListResponse listPackageFees(String tenantId) {
        String tid = requireTenant(tenantId);
        List<ShopCatalogPackageIdentity> packages = shopCatalogPackageOfferResolver.listActivePackages(tid);
        Map<String, ShopCatalogSku> linked = linkedByPackageCode(tid);
        List<ShopCatalogPackageFeeItem> items = new ArrayList<>(packages.size());
        for (ShopCatalogPackageIdentity identity : packages) {
            items.add(toFeeItem(identity, linked.get(identity.packageCode())));
        }
        List<ShopCatalogSku> rows =
                shopCatalogSkuRepository.findByTenantIdAndIsDeletedFalseOrderBySortOrderAscIdAsc(tid);
        List<ShopCatalogLegacySkuItem> unlinked = new ArrayList<>();
        for (ShopCatalogSku row : rows) {
            if (StringUtils.hasText(row.getSourcePackageCode())) {
                continue;
            }
            unlinked.add(new ShopCatalogLegacySkuItem(
                    row.getId(),
                    row.getSkuCode(),
                    row.getTitle(),
                    row.getUnitPriceMinor() != null ? row.getUnitPriceMinor() : 0L,
                    Boolean.TRUE.equals(row.getCatalogVisible())));
        }
        return new ShopCatalogPackageFeeListResponse(items, unlinked);
    }

    @Override
    @Transactional(readOnly = true)
    public ShopCatalogPackageFeeItem getPackageFee(String tenantId, String packageCode) {
        String tid = requireTenant(tenantId);
        ShopCatalogPackageIdentity identity = shopCatalogPackageOfferResolver.requireIdentity(tid, packageCode);
        ShopCatalogSku linked = linkedByPackageCode(tid).get(identity.packageCode());
        return toFeeItem(identity, linked);
    }

    @Override
    @Transactional
    public ShopCatalogPackageFeeItem updatePackageContent(
            String tenantId,
            String packageCode,
            ShopCatalogPackageContentRequest request) {
        String tid = requireTenant(tenantId);
        ShopCatalogPackageIdentity identity = shopCatalogPackageOfferResolver.requireIdentity(tid, packageCode);
        if (request.catalogVisible()) {
            assertPackageSellable(identity);
        }
        ShopCatalogSku row = findOrCreateLinked(tid, identity);
        Long previousPrice = row.getId() == null ? null : row.getUnitPriceMinor();
        applyPackageIdentity(row, identity);
        row.setDescriptionText(
                StringUtils.hasText(request.descriptionText()) ? request.descriptionText().trim() : null);
        row.setSortOrder(request.sortOrder());
        row.setCatalogVisible(request.catalogVisible());
        if (request.catalogVisible()) {
            requireThumbnailUrl(row);
        }
        ShopCatalogSku saved = shopCatalogSkuRepository.save(row);
        recordPriceHistoryIfChanged(saved, previousPrice);
        return toFeeItem(identity, saved);
    }

    @Override
    @Transactional
    public void patchPackageCatalogVisible(String tenantId, String packageCode, boolean catalogVisible) {
        String tid = requireTenant(tenantId);
        ShopCatalogPackageIdentity identity = shopCatalogPackageOfferResolver.requireIdentity(tid, packageCode);
        if (catalogVisible) {
            assertPackageSellable(identity);
        }
        ShopCatalogSku row = findOrCreateLinked(tid, identity);
        Long previousPrice = row.getId() == null ? null : row.getUnitPriceMinor();
        applyPackageIdentity(row, identity);
        row.setCatalogVisible(catalogVisible);
        if (catalogVisible) {
            requireThumbnailUrl(row);
        }
        ShopCatalogSku saved = shopCatalogSkuRepository.save(row);
        recordPriceHistoryIfChanged(saved, previousPrice);
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
        if (catalogVisible) {
            requireThumbnailUrl(row);
        }
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

    private Map<String, ShopCatalogSku> linkedByPackageCode(String tenantId) {
        List<ShopCatalogSku> rows =
                shopCatalogSkuRepository.findByTenantIdAndIsDeletedFalseOrderBySortOrderAscIdAsc(tenantId);
        Map<String, ShopCatalogSku> linked = new HashMap<>();
        for (ShopCatalogSku row : rows) {
            if (!StringUtils.hasText(row.getSourcePackageCode())) {
                continue;
            }
            linked.putIfAbsent(row.getSourcePackageCode().trim(), row);
        }
        return linked;
    }

    private ShopCatalogSku findOrCreateLinked(String tenantId, ShopCatalogPackageIdentity identity) {
        List<ShopCatalogSku> existing = shopCatalogSkuRepository
                .findByTenantIdAndSourcePackageCodeAndIsDeletedFalseOrderByIdAsc(
                        tenantId, identity.packageCode());
        if (existing != null && !existing.isEmpty()) {
            return existing.get(0);
        }
        ShopCatalogSku row = new ShopCatalogSku();
        row.setTenantId(tenantId);
        row.setSkuCode(resolveSkuCodeForCreate(tenantId, null));
        row.setSourcePackageCode(identity.packageCode());
        row.setCurrency(BankTransferConstants.CURRENCY_KRW);
        row.setCatalogCategory(ShopCatalogCategory.CONSULTATION);
        row.setCatalogVisible(false);
        row.setActive(identity.active());
        row.setSortOrder(0);
        row.setSessionCount(identity.sessionCount() != null
                ? identity.sessionCount()
                : ShopSessionCountConstants.MIN_SESSION_COUNT);
        row.setUnitPriceMinor(identity.unitPriceMinor() != null ? identity.unitPriceMinor() : 0L);
        row.setTitle(identity.packageName());
        return row;
    }

    private static void applyPackageIdentity(ShopCatalogSku row, ShopCatalogPackageIdentity identity) {
        row.setSourcePackageCode(identity.packageCode());
        row.setTitle(identity.packageName());
        row.setCatalogCategory(ShopCatalogCategory.CONSULTATION);
        row.setActive(identity.active());
        row.setCurrency(BankTransferConstants.CURRENCY_KRW);
        if (identity.unitPriceMinor() != null) {
            row.setUnitPriceMinor(identity.unitPriceMinor());
        } else if (row.getUnitPriceMinor() == null) {
            row.setUnitPriceMinor(0L);
        }
        if (identity.sessionCount() != null) {
            row.setSessionCount(identity.sessionCount());
        } else if (row.getSessionCount() == null
                || row.getSessionCount() < ShopSessionCountConstants.MIN_SESSION_COUNT) {
            row.setSessionCount(ShopSessionCountConstants.MIN_SESSION_COUNT);
        }
    }

    private static void assertPackageSellable(ShopCatalogPackageIdentity identity) {
        if (!identity.active() || !identity.priceReady()) {
            throw new IllegalArgumentException(ShopCatalogSkuConstants.PACKAGE_NOT_SELLABLE_MESSAGE);
        }
    }

    private static ShopCatalogPackageFeeItem toFeeItem(
            ShopCatalogPackageIdentity identity,
            ShopCatalogSku row) {
        return new ShopCatalogPackageFeeItem(
                identity.packageCode(),
                identity.packageName(),
                identity.unitPriceMinor(),
                identity.sessionCount(),
                identity.active(),
                identity.priceReady(),
                row != null ? row.getId() : null,
                row != null ? row.getSkuCode() : null,
                row != null ? row.getDescriptionText() : null,
                row != null ? row.getThumbnailUrl() : null,
                row != null && Boolean.TRUE.equals(row.getCatalogVisible()),
                row != null && row.getSortOrder() != null ? row.getSortOrder() : 0);
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
