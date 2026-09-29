package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.ConsultationPackageCodeConstants;
import com.coresolution.consultation.constant.ShopAdminProductConstants;
import com.coresolution.consultation.dto.shop.ShopCatalogPackageIdentity;
import com.coresolution.consultation.dto.shop.admin.ShopAdminProductCodeRow;
import com.coresolution.consultation.dto.shop.admin.ShopAdminProductItem;
import com.coresolution.consultation.dto.shop.admin.ShopAdminProductLegacySku;
import com.coresolution.consultation.dto.shop.admin.ShopAdminProductListResponse;
import com.coresolution.consultation.dto.shop.admin.ShopAdminProductSaleStatusRequest;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.ShopCatalogSkuRepository;
import com.coresolution.consultation.service.AdminShopProductService;
import com.coresolution.consultation.service.ShopCatalogPackageOfferResolver;
import com.coresolution.core.util.PaginationUtils;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * 어드민 「상품」 통합 목록·판매 상태.
 *
 * <p>판매 중지 = 공통코드 isActive·extraData.publicVisible·연결 SKU catalogVisible 을 한 번에 끈다.
 * 판매 재개 = isActive 만 켠다 (공개·노출은 꺼진 채 유지). 주문·결제·환불·ERP 행은 조회·수정하지 않는다.</p>
 *
 * @author MindGarden
 * @since 2026-09-29
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminShopProductServiceImpl implements AdminShopProductService {

    private static final TypeReference<LinkedHashMap<String, Object>> EXTRA_TYPE = new TypeReference<>() {
    };

    private final CommonCodeRepository commonCodeRepository;
    private final ShopCatalogSkuRepository shopCatalogSkuRepository;
    private final ShopCatalogPackageOfferResolver shopCatalogPackageOfferResolver;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public ShopAdminProductListResponse listProducts(
            String tenantId,
            int page,
            int size,
            String segment,
            String query) {
        String tid = requireTenant(tenantId);
        Pageable pageable = PaginationUtils.createPageable(page, size);
        List<ShopAdminProductItem> all = loadAll(tid);
        String q = StringUtils.hasText(query) ? query.trim().toLowerCase(Locale.ROOT) : null;
        List<ShopAdminProductItem> searched = new ArrayList<>();
        for (ShopAdminProductItem item : all) {
            if (q == null || matchesQuery(item, q)) {
                searched.add(item);
            }
        }
        Map<String, Long> counts = countSegments(searched);
        String seg = normalizeSegment(segment);
        List<ShopAdminProductItem> filtered = new ArrayList<>();
        List<ShopAdminProductItem> stopped = new ArrayList<>();
        for (ShopAdminProductItem item : searched) {
            if (!matchesSegment(item, seg)) {
                continue;
            }
            if (item.active()) {
                filtered.add(item);
            } else {
                stopped.add(item);
            }
        }
        filtered.addAll(stopped);
        int pageSize = pageable.getPageSize();
        int pageNumber = pageable.getPageNumber();
        int from = Math.min(pageNumber * pageSize, filtered.size());
        int to = Math.min(from + pageSize, filtered.size());
        return new ShopAdminProductListResponse(
                new ArrayList<>(filtered.subList(from, to)),
                filtered.size(),
                pageNumber,
                pageSize,
                counts);
    }

    @Override
    @Transactional
    public ShopAdminProductItem updateSaleStatus(String tenantId, ShopAdminProductSaleStatusRequest request) {
        String tid = requireTenant(tenantId);
        if (request == null || request.onSale() == null) {
            throw new IllegalArgumentException(ShopAdminProductConstants.MSG_SALE_STATUS_TARGET_REQUIRED);
        }
        boolean onSale = request.onSale();
        if (ShopAdminProductConstants.KIND_PACKAGE.equals(request.kind())) {
            return updatePackageSaleStatus(tid, request.packageCode(), onSale);
        }
        if (ShopAdminProductConstants.KIND_LEGACY.equals(request.kind())) {
            return updateLegacySaleStatus(tid, request.skuId(), onSale);
        }
        throw new IllegalArgumentException(ShopAdminProductConstants.MSG_SALE_STATUS_KIND_INVALID);
    }

    private ShopAdminProductItem updatePackageSaleStatus(String tenantId, String packageCode, boolean onSale) {
        if (!StringUtils.hasText(packageCode)) {
            throw new IllegalArgumentException(ShopAdminProductConstants.MSG_SALE_STATUS_TARGET_REQUIRED);
        }
        String code = shopCatalogPackageOfferResolver.requirePackageCode(packageCode);
        CommonCode row = commonCodeRepository
                .findByTenantIdAndCodeGroupAndCodeValue(tenantId, ConsultationPackageCodeConstants.CODE_GROUP, code)
                .filter(item -> !Boolean.TRUE.equals(item.getIsDeleted()))
                .orElseThrow(() -> new IllegalArgumentException(
                        ShopAdminProductConstants.MSG_SALE_STATUS_TARGET_REQUIRED));
        List<ShopCatalogSku> linked = shopCatalogSkuRepository
                .findByTenantIdAndSourcePackageCodeAndIsDeletedFalseOrderByIdAsc(tenantId, code);
        row.setIsActive(onSale);
        if (!onSale) {
            row.setExtraData(withPublicVisibleOff(row.getExtraData()));
            for (ShopCatalogSku sku : linked) {
                sku.setCatalogVisible(false);
                shopCatalogSkuRepository.save(sku);
            }
        }
        CommonCode saved = commonCodeRepository.save(row);
        ShopCatalogSku first = linked.isEmpty() ? null : linked.get(0);
        return toPackageItem(saved, first);
    }

    private ShopAdminProductItem updateLegacySaleStatus(String tenantId, Long skuId, boolean onSale) {
        if (skuId == null) {
            throw new IllegalArgumentException(ShopAdminProductConstants.MSG_SALE_STATUS_TARGET_REQUIRED);
        }
        ShopCatalogSku sku = shopCatalogSkuRepository.findByIdAndTenantIdAndIsDeletedFalse(skuId, tenantId)
                .filter(row -> !StringUtils.hasText(row.getSourcePackageCode()))
                .orElseThrow(() -> new IllegalArgumentException(
                        ShopAdminProductConstants.MSG_SALE_STATUS_TARGET_REQUIRED));
        sku.setActive(onSale);
        if (!onSale) {
            sku.setCatalogVisible(false);
        }
        return toLegacyItem(shopCatalogSkuRepository.save(sku));
    }

    private List<ShopAdminProductItem> loadAll(String tenantId) {
        List<ShopCatalogSku> skus =
                shopCatalogSkuRepository.findByTenantIdAndIsDeletedFalseOrderBySortOrderAscIdAsc(tenantId);
        Map<String, ShopCatalogSku> linkedByCode = new HashMap<>();
        List<ShopCatalogSku> legacy = new ArrayList<>();
        for (ShopCatalogSku sku : skus) {
            if (StringUtils.hasText(sku.getSourcePackageCode())) {
                linkedByCode.putIfAbsent(sku.getSourcePackageCode().trim(), sku);
            } else {
                legacy.add(sku);
            }
        }
        List<CommonCode> codes = commonCodeRepository.findByTenantIdAndCodeGroupOrderBySortOrderAsc(
                tenantId, ConsultationPackageCodeConstants.CODE_GROUP);
        List<ShopAdminProductItem> items = new ArrayList<>();
        if (codes != null) {
            for (CommonCode code : codes) {
                if (code == null
                        || Boolean.TRUE.equals(code.getIsDeleted())
                        || !StringUtils.hasText(code.getCodeValue())) {
                    continue;
                }
                items.add(toPackageItem(code, linkedByCode.get(code.getCodeValue().trim())));
            }
        }
        for (ShopCatalogSku sku : legacy) {
            items.add(toLegacyItem(sku));
        }
        return items;
    }

    private ShopAdminProductItem toPackageItem(CommonCode code, ShopCatalogSku linked) {
        ShopCatalogPackageIdentity identity = shopCatalogPackageOfferResolver.identityOf(code);
        ShopAdminProductCodeRow codeRow = new ShopAdminProductCodeRow(
                code.getId(),
                code.getCodeValue(),
                code.getCodeLabel(),
                code.getKoreanName(),
                code.getCodeDescription(),
                code.getIsActive(),
                code.getExtraData(),
                code.getSortOrder());
        return new ShopAdminProductItem(
                ShopAdminProductConstants.KIND_PACKAGE,
                identity.packageCode(),
                identity.packageName(),
                identity.active(),
                codeRow,
                AdminShopCatalogSkuServiceImpl.toFeeItem(identity, linked),
                null);
    }

    private static ShopAdminProductItem toLegacyItem(ShopCatalogSku sku) {
        ShopAdminProductLegacySku legacy = new ShopAdminProductLegacySku(
                sku.getId(),
                sku.getSkuCode(),
                sku.getTitle(),
                sku.getUnitPriceMinor() != null ? sku.getUnitPriceMinor() : 0L,
                Boolean.TRUE.equals(sku.getCatalogVisible()),
                !Boolean.FALSE.equals(sku.getActive()),
                sku.getCatalogCategory(),
                sku.getThumbnailUrl(),
                sku.getDescriptionText(),
                sku.getSortOrder(),
                sku.getValidityMonths());
        String name = StringUtils.hasText(sku.getTitle()) ? sku.getTitle() : sku.getSkuCode();
        return new ShopAdminProductItem(
                ShopAdminProductConstants.KIND_LEGACY,
                sku.getSkuCode(),
                name,
                legacy.active(),
                null,
                null,
                legacy);
    }

    private String withPublicVisibleOff(String extraData) {
        Map<String, Object> parsed = new LinkedHashMap<>();
        if (StringUtils.hasText(extraData)) {
            try {
                LinkedHashMap<String, Object> read = objectMapper.readValue(extraData, EXTRA_TYPE);
                if (read != null) {
                    parsed = read;
                }
            } catch (Exception ex) {
                log.warn("상품 extraData 파싱 실패 — 홈 공개만 기록: {}", ex.getMessage());
            }
        }
        parsed.put(ShopAdminProductConstants.EXTRA_PUBLIC_VISIBLE, Boolean.FALSE);
        try {
            return objectMapper.writeValueAsString(parsed);
        } catch (Exception ex) {
            throw new IllegalArgumentException(ShopAdminProductConstants.MSG_EXTRA_DATA_INVALID, ex);
        }
    }

    static boolean matchesQuery(ShopAdminProductItem item, String lowerQuery) {
        String name = item.name() != null ? item.name().toLowerCase(Locale.ROOT) : "";
        String code = item.code() != null ? item.code().toLowerCase(Locale.ROOT) : "";
        return name.contains(lowerQuery) || code.contains(lowerQuery);
    }

    static boolean matchesSegment(ShopAdminProductItem item, String segment) {
        if (ShopAdminProductConstants.SEGMENT_ON_SALE.equals(segment)) {
            return item.active();
        }
        if (ShopAdminProductConstants.SEGMENT_STOPPED.equals(segment)) {
            return !item.active();
        }
        return true;
    }

    private static Map<String, Long> countSegments(List<ShopAdminProductItem> items) {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (String seg : ShopAdminProductConstants.SEGMENTS) {
            counts.put(seg, 0L);
        }
        for (ShopAdminProductItem item : items) {
            counts.merge(ShopAdminProductConstants.SEGMENT_ALL, 1L, Long::sum);
            String seg = item.active()
                    ? ShopAdminProductConstants.SEGMENT_ON_SALE
                    : ShopAdminProductConstants.SEGMENT_STOPPED;
            counts.merge(seg, 1L, Long::sum);
        }
        return Collections.unmodifiableMap(counts);
    }

    private static String normalizeSegment(String segment) {
        if (!StringUtils.hasText(segment)) {
            return ShopAdminProductConstants.SEGMENT_ALL;
        }
        String upper = segment.trim().toUpperCase(Locale.ROOT);
        return ShopAdminProductConstants.SEGMENTS.contains(upper) ? upper : ShopAdminProductConstants.SEGMENT_ALL;
    }

    private static String requireTenant(String tenantId) {
        if (!StringUtils.hasText(tenantId)) {
            throw new IllegalArgumentException("tenantId가 필요합니다.");
        }
        return tenantId.trim();
    }
}
