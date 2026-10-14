package com.coresolution.consultation.service;

import com.coresolution.consultation.constant.ConsultationPackageCodeConstants;
import com.coresolution.consultation.constant.ShopCatalogCategory;
import com.coresolution.consultation.constant.ShopClientOfferConstants;
import com.coresolution.consultation.constant.ShopPackageCompositionConstants;
import com.coresolution.consultation.dto.shop.ShopCatalogOffer;
import com.coresolution.consultation.dto.shop.admin.ShopCompositionCandidateItem;
import com.coresolution.consultation.dto.shop.admin.ShopCompositionCandidateListResponse;
import com.coresolution.consultation.dto.shop.admin.ShopPackageCompositionItemView;
import com.coresolution.consultation.dto.shop.admin.ShopPackageCompositionResponse;
import com.coresolution.consultation.dto.shop.admin.ShopPackageCompositionSaveRequest;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.entity.ShopPackageCompositionItem;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.ShopCatalogSkuRepository;
import com.coresolution.consultation.repository.ShopPackageCompositionItemRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * 상품 구성(조합 패키지) — 몰 카탈로그 SKU 기반 조회·저장·후보 검색.
 * 매출 분할·이행(fulfillment)은 다루지 않는다. 단가·회기는 저장 시점에 복사한다.
 *
 * @author MindGarden
 * @since 2026-10-12
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ShopPackageCompositionService {

    private static final TypeReference<Map<String, Object>> EXTRA_TYPE = new TypeReference<>() {
    };

    private final ShopPackageCompositionItemRepository compositionRepository;
    private final ShopCatalogSkuRepository skuRepository;
    private final CommonCodeRepository commonCodeRepository;
    private final ShopCatalogPackageOfferResolver offerResolver;
    private final ObjectMapper objectMapper;

    /**
     * 패키지 구성 조회. 스냅샷과 현재가를 비교해 가격 변경 여부를 표시한다(자동 재계산 없음).
     *
     * @param tenantId 테넌트 ID
     * @param packageCode 패키지 코드
     * @return 구성 응답
     * @throws IllegalArgumentException 패키지가 없을 때
     */
    @Transactional(readOnly = true)
    public ShopPackageCompositionResponse get(String tenantId, String packageCode) {
        String code = offerResolver.requireIdentity(tenantId, packageCode).packageCode();
        List<ShopPackageCompositionItem> rows =
                compositionRepository.findByTenantIdAndPackageCodeOrderBySortOrderAscIdAsc(tenantId, code);
        Map<Long, ShopCatalogSku> skus = loadSkus(tenantId, rows.stream()
                .map(ShopPackageCompositionItem::getItemSkuId).collect(Collectors.toSet()));
        List<ShopPackageCompositionItemView> views = new ArrayList<>(rows.size());
        long totalPrice = 0L;
        int totalSessions = 0;
        boolean anyChanged = false;
        for (ShopPackageCompositionItem row : rows) {
            ShopCatalogSku sku = skus.get(row.getItemSkuId());
            boolean available = sku != null && isSelectable(sku);
            Long current = available ? priceOf(tenantId, sku) : null;
            boolean changed = current != null && current.longValue() != row.getUnitPriceSnapshot();
            anyChanged |= changed;
            totalPrice += row.getUnitPriceSnapshot() * row.getQuantity();
            totalSessions += row.getSessionCountSnapshot() * row.getQuantity();
            views.add(new ShopPackageCompositionItemView(
                    row.getId(), row.getItemSkuId(),
                    sku != null ? sku.getSkuCode() : null,
                    sku != null ? sku.getTitle() : null,
                    sku != null ? sku.getCatalogCategory() : null,
                    row.getQuantity(), row.getSortOrder(),
                    row.getUnitPriceSnapshot(), row.getSessionCountSnapshot(),
                    current, changed, available));
        }
        int legacyCount = legacyItemCount(tenantId, code);
        return new ShopPackageCompositionResponse(
                code, views, totalPrice, totalSessions, anyChanged, legacyCount > 0, legacyCount);
    }

    /**
     * 패키지 구성 저장(전체 교체). 단가·회기는 현재 몰 판매가로 복사하고, 레거시 extraData.items 는 비운다.
     *
     * @param tenantId 테넌트 ID
     * @param packageCode 패키지 코드
     * @param request 구성 항목
     * @return 저장 후 구성
     * @throws IllegalArgumentException 다른 테넌트·비활성·삭제·OFFER_·자기참조·중첩·수량 오류일 때
     */
    @Transactional
    public ShopPackageCompositionResponse save(
            String tenantId, String packageCode, ShopPackageCompositionSaveRequest request) {
        String code = offerResolver.requireIdentity(tenantId, packageCode).packageCode();
        List<ShopPackageCompositionSaveRequest.Item> lines =
                request != null && request.items() != null ? request.items() : List.of();
        if (lines.isEmpty()) {
            throw new IllegalArgumentException(ShopPackageCompositionConstants.MSG_ITEMS_REQUIRED);
        }
        Set<Long> ids = new HashSet<>();
        for (ShopPackageCompositionSaveRequest.Item line : lines) {
            if (line == null || line.skuId() == null) {
                throw new IllegalArgumentException(ShopPackageCompositionConstants.MSG_ITEM_NOT_FOUND);
            }
            if (line.quantity() == null || line.quantity() < ShopPackageCompositionConstants.MIN_QUANTITY) {
                throw new IllegalArgumentException(ShopPackageCompositionConstants.MSG_QUANTITY_INVALID);
            }
            if (!ids.add(line.skuId())) {
                throw new IllegalArgumentException(ShopPackageCompositionConstants.MSG_ITEM_DUPLICATE);
            }
        }
        Map<Long, ShopCatalogSku> skus = loadSkus(tenantId, ids);
        Set<String> composed = composedPackageCodes(tenantId, skus.values());
        List<ShopPackageCompositionItem> toSave = new ArrayList<>(lines.size());
        int order = 0;
        for (ShopPackageCompositionSaveRequest.Item line : lines) {
            ShopCatalogSku sku = skus.get(line.skuId());
            requireAddable(code, sku, composed);
            ShopPackageCompositionItem row = new ShopPackageCompositionItem();
            row.setTenantId(tenantId);
            row.setPackageCode(code);
            row.setItemSkuId(sku.getId());
            row.setQuantity(line.quantity());
            row.setSortOrder(order++);
            row.setUnitPriceSnapshot(priceOf(tenantId, sku));
            row.setSessionCountSnapshot(sessionsOf(tenantId, sku));
            toSave.add(row);
        }
        compositionRepository.deleteByTenantAndPackageCode(tenantId, code);
        compositionRepository.saveAll(toSave);
        clearLegacyItems(tenantId, code);
        return get(tenantId, code);
    }

    /**
     * 구성 후보 몰 SKU 검색. 같은 테넌트의 활성·미삭제 SKU 중 OFFER_ 와 자기 자신(sourcePackageCode) 제외.
     *
     * @param tenantId 테넌트 ID
     * @param query 상품명·코드 검색어 (없으면 전체)
     * @param excludePackageCode 편집 중인 패키지 코드 (선택)
     * @return 후보와 검색어 무관 전체 수
     */
    @Transactional(readOnly = true)
    public ShopCompositionCandidateListResponse listCandidates(
            String tenantId, String query, String excludePackageCode) {
        String exclude = StringUtils.hasText(excludePackageCode) ? excludePackageCode.trim() : null;
        List<ShopCatalogSku> pool = skuRepository.findByTenantIdAndIsDeletedFalseOrderBySortOrderAscIdAsc(tenantId)
                .stream()
                .filter(this::isSelectable)
                .filter(sku -> exclude == null || !exclude.equals(trimOrNull(sku.getSourcePackageCode())))
                .toList();
        String q = StringUtils.hasText(query) ? query.trim().toLowerCase(Locale.ROOT) : null;
        Set<String> composed = composedPackageCodes(tenantId, pool);
        List<ShopCompositionCandidateItem> items = pool.stream()
                .filter(sku -> q == null || matches(sku, q))
                .map(sku -> new ShopCompositionCandidateItem(
                        sku.getId(), sku.getSkuCode(), sku.getTitle(), sku.getCatalogCategory(),
                        priceOf(tenantId, sku), sessionsOf(tenantId, sku),
                        isComposed(composed, sku)))
                .toList();
        return new ShopCompositionCandidateListResponse(items, pool.size());
    }

    /** 원본 패키지가 없는 SKU 는 구성 대상이 아니다(불변 Set 의 null 조회 NPE 방지). */
    private static boolean isComposed(Set<String> composed, ShopCatalogSku sku) {
        String source = trimOrNull(sku.getSourcePackageCode());
        return source != null && composed.contains(source);
    }

    private void requireAddable(String packageCode, ShopCatalogSku sku, Set<String> composed) {
        if (sku == null) {
            throw new IllegalArgumentException(ShopPackageCompositionConstants.MSG_ITEM_NOT_FOUND);
        }
        if (isOfferSku(sku)) {
            throw new IllegalArgumentException(ShopPackageCompositionConstants.MSG_ITEM_OFFER_SKU);
        }
        if (Boolean.TRUE.equals(sku.getIsDeleted()) || !Boolean.TRUE.equals(sku.getActive())) {
            throw new IllegalArgumentException(ShopPackageCompositionConstants.MSG_ITEM_INACTIVE);
        }
        String source = trimOrNull(sku.getSourcePackageCode());
        if (packageCode.equals(source)) {
            throw new IllegalArgumentException(ShopPackageCompositionConstants.MSG_ITEM_SELF);
        }
        if (source != null && composed.contains(source)) {
            throw new IllegalArgumentException(ShopPackageCompositionConstants.MSG_ITEM_NESTED);
        }
    }

    /** 같은 테넌트·미삭제 SKU 만 조회한다(다른 테넌트·삭제 SKU 는 없는 것으로 본다). */
    private Map<Long, ShopCatalogSku> loadSkus(String tenantId, Collection<Long> ids) {
        Map<Long, ShopCatalogSku> out = new LinkedHashMap<>();
        for (Long id : ids) {
            skuRepository.findByIdAndTenantIdAndIsDeletedFalse(id, tenantId)
                    .ifPresent(sku -> out.put(id, sku));
        }
        return out;
    }

    /** 새 구성 테이블 또는 레거시 extraData.items 에 구성이 있는 패키지 코드. */
    private Set<String> composedPackageCodes(String tenantId, Collection<ShopCatalogSku> skus) {
        Set<String> codes = skus.stream()
                .map(sku -> trimOrNull(sku.getSourcePackageCode()))
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (codes.isEmpty()) {
            return Set.of();
        }
        Set<String> out = new HashSet<>(compositionRepository.findComposedPackageCodes(tenantId, codes));
        for (String code : codes) {
            if (!out.contains(code) && legacyItemCount(tenantId, code) > 0) {
                out.add(code);
            }
        }
        return out;
    }

    private boolean isSelectable(ShopCatalogSku sku) {
        return !Boolean.TRUE.equals(sku.getIsDeleted())
                && Boolean.TRUE.equals(sku.getActive())
                && !isOfferSku(sku);
    }

    private static boolean isOfferSku(ShopCatalogSku sku) {
        return sku.getSkuCode() != null && sku.getSkuCode().startsWith(ShopClientOfferConstants.SKU_CODE_PREFIX);
    }

    private static boolean matches(ShopCatalogSku sku, String q) {
        return contains(sku.getTitle(), q) || contains(sku.getSkuCode(), q);
    }

    private static boolean contains(String value, String q) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(q);
    }

    /** 몰 판매가: 패키지 연결 SKU 는 패키지 단가, 아니면 SKU 단가 (몰 표시와 같은 공통 해석). */
    private long priceOf(String tenantId, ShopCatalogSku sku) {
        ShopCatalogOffer offer = offerResolver.resolveLinked(tenantId, sku);
        return offer.unitPriceMinor();
    }

    /** 상담 상품만 회기를 갖는다. 실물·검사 등은 0. */
    private int sessionsOf(String tenantId, ShopCatalogSku sku) {
        if (!ShopCatalogCategory.CONSULTATION.equals(sku.getCatalogCategory())) {
            return ShopPackageCompositionConstants.NON_SESSION_COUNT;
        }
        ShopCatalogOffer offer = offerResolver.resolveLinked(tenantId, sku);
        return offer.sessionCount();
    }

    private Optional<CommonCode> packageRow(String tenantId, String packageCode) {
        return commonCodeRepository.findByTenantIdAndCodeGroupAndCodeValue(
                tenantId, ConsultationPackageCodeConstants.CODE_GROUP, packageCode)
                .filter(row -> !Boolean.TRUE.equals(row.getIsDeleted()));
    }

    private int legacyItemCount(String tenantId, String packageCode) {
        Object items = packageRow(tenantId, packageCode)
                .map(row -> parseExtra(row.getExtraData()).get(ShopPackageCompositionConstants.LEGACY_EXTRA_ITEMS_KEY))
                .orElse(null);
        return items instanceof Collection<?> list ? list.size() : 0;
    }

    private void clearLegacyItems(String tenantId, String packageCode) {
        packageRow(tenantId, packageCode).ifPresent(row -> {
            Map<String, Object> extra = new LinkedHashMap<>(parseExtra(row.getExtraData()));
            if (extra.remove(ShopPackageCompositionConstants.LEGACY_EXTRA_ITEMS_KEY) == null) {
                return;
            }
            try {
                row.setExtraData(objectMapper.writeValueAsString(extra));
            } catch (Exception ex) {
                throw new IllegalStateException(ShopPackageCompositionConstants.MSG_LEGACY_CLEAR_FAILED, ex);
            }
            commonCodeRepository.save(row);
        });
    }

    private Map<String, Object> parseExtra(String extraData) {
        if (!StringUtils.hasText(extraData)) {
            return Map.of();
        }
        try {
            Map<String, Object> parsed = objectMapper.readValue(extraData, EXTRA_TYPE);
            return parsed != null ? parsed : Map.of();
        } catch (Exception ex) {
            log.warn("상품 구성 extraData 파싱 실패: {}", ex.getMessage());
            return Map.of();
        }
    }

    private static String trimOrNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
