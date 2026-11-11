package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.ShopCatalogSkuConstants;
import com.coresolution.consultation.dto.shop.admin.ShopCatalogSkuEventPriceItem;
import com.coresolution.consultation.dto.shop.admin.ShopCatalogSkuEventPriceUpsertRequest;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.entity.ShopCatalogSkuEventPrice;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.exception.ShopCatalogSkuEventPriceConflictException;
import com.coresolution.consultation.repository.ShopCatalogSkuEventPriceRepository;
import com.coresolution.consultation.repository.ShopCatalogSkuRepository;
import com.coresolution.consultation.service.AdminShopCatalogSkuEventPriceService;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * 어드민 SKU 이벤트 가격 기간 CRUD 구현.
 *
 * @author MindGarden
 * @since 2026-11-11
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminShopCatalogSkuEventPriceServiceImpl implements AdminShopCatalogSkuEventPriceService {

    private static final String SKU_ENTITY = "ShopCatalogSku";
    private static final String EVENT_PRICE_ENTITY = "ShopCatalogSkuEventPrice";

    private final ShopCatalogSkuRepository shopCatalogSkuRepository;
    private final ShopCatalogSkuEventPriceRepository shopCatalogSkuEventPriceRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ShopCatalogSkuEventPriceItem> list(String tenantId, Long skuId) {
        String tid = requireTenant(tenantId);
        requireSku(tid, skuId);
        List<ShopCatalogSkuEventPrice> rows = shopCatalogSkuEventPriceRepository
                .findByTenantIdAndSkuIdAndIsDeletedFalseOrderByStartDateAsc(tid, skuId);
        List<ShopCatalogSkuEventPriceItem> out = new ArrayList<>(rows.size());
        for (ShopCatalogSkuEventPrice row : rows) {
            out.add(toItem(row));
        }
        return out;
    }

    @Override
    @Transactional
    public ShopCatalogSkuEventPriceItem create(
            String tenantId,
            Long skuId,
            ShopCatalogSkuEventPriceUpsertRequest request) {
        String tid = requireTenant(tenantId);
        ShopCatalogSku sku = requireSku(tid, skuId);
        validateRequest(sku.getUnitPriceMinor(), request, null, tid, skuId);
        ShopCatalogSkuEventPrice row = ShopCatalogSkuEventPrice.builder()
                .skuId(skuId)
                .eventPriceMinor(request.eventPriceMinor())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .build();
        row.setTenantId(tid);
        ShopCatalogSkuEventPrice saved = shopCatalogSkuEventPriceRepository.save(row);
        log.info("SKU 이벤트 가격 생성 tenantId={} skuId={} eventPriceId={}", tid, skuId, saved.getId());
        return toItem(saved);
    }

    @Override
    @Transactional
    public ShopCatalogSkuEventPriceItem update(
            String tenantId,
            Long skuId,
            Long eventPriceId,
            ShopCatalogSkuEventPriceUpsertRequest request) {
        String tid = requireTenant(tenantId);
        ShopCatalogSku sku = requireSku(tid, skuId);
        ShopCatalogSkuEventPrice row = shopCatalogSkuEventPriceRepository
                .findByIdAndTenantIdAndSkuIdAndIsDeletedFalse(eventPriceId, tid, skuId)
                .orElseThrow(() -> new EntityNotFoundException(EVENT_PRICE_ENTITY, eventPriceId));
        validateRequest(sku.getUnitPriceMinor(), request, eventPriceId, tid, skuId);
        row.setEventPriceMinor(request.eventPriceMinor());
        row.setStartDate(request.startDate());
        row.setEndDate(request.endDate());
        ShopCatalogSkuEventPrice saved = shopCatalogSkuEventPriceRepository.save(row);
        log.info("SKU 이벤트 가격 수정 tenantId={} skuId={} eventPriceId={}", tid, skuId, eventPriceId);
        return toItem(saved);
    }

    @Override
    @Transactional
    public void softDelete(String tenantId, Long skuId, Long eventPriceId) {
        String tid = requireTenant(tenantId);
        requireSku(tid, skuId);
        ShopCatalogSkuEventPrice row = shopCatalogSkuEventPriceRepository
                .findByIdAndTenantIdAndSkuIdAndIsDeletedFalse(eventPriceId, tid, skuId)
                .orElseThrow(() -> new EntityNotFoundException(EVENT_PRICE_ENTITY, eventPriceId));
        row.delete();
        shopCatalogSkuEventPriceRepository.save(row);
        log.info("SKU 이벤트 가격 soft-delete tenantId={} skuId={} eventPriceId={}", tid, skuId, eventPriceId);
    }

    /**
     * 시작≤종료·정상가보다 낮은 단가·동일 SKU 기간 비겹침을 검증한다.
     *
     * @param unitPriceMinor SKU 정상 단가
     * @param request 요청
     * @param excludeId 수정 시 자기 자신 제외(생성 null)
     * @param tenantId 테넌트 ID
     * @param skuId SKU ID
     */
    void validateRequest(
            Long unitPriceMinor,
            ShopCatalogSkuEventPriceUpsertRequest request,
            Long excludeId,
            String tenantId,
            Long skuId) {
        LocalDate start = request.startDate();
        LocalDate end = request.endDate();
        if (start == null || end == null) {
            throw new IllegalArgumentException(ShopCatalogSkuConstants.EVENT_DATE_RANGE_INVALID_MESSAGE);
        }
        if (start.isAfter(end)) {
            throw new IllegalArgumentException(ShopCatalogSkuConstants.EVENT_DATE_RANGE_INVALID_MESSAGE);
        }
        long price = unitPriceMinor != null ? unitPriceMinor : 0L;
        if (request.eventPriceMinor() == null || request.eventPriceMinor() >= price) {
            throw new IllegalArgumentException(ShopCatalogSkuConstants.EVENT_PRICE_MUST_BE_LESS_THAN_PRICE_MESSAGE);
        }
        List<ShopCatalogSkuEventPrice> overlaps = shopCatalogSkuEventPriceRepository.findOverlappingPeriods(
                tenantId, skuId, start, end, excludeId);
        if (overlaps != null && !overlaps.isEmpty()) {
            throw new ShopCatalogSkuEventPriceConflictException(
                    ShopCatalogSkuConstants.EVENT_PRICE_PERIOD_OVERLAP_MESSAGE);
        }
    }

    private ShopCatalogSku requireSku(String tenantId, Long skuId) {
        return shopCatalogSkuRepository.findByIdAndTenantIdAndIsDeletedFalse(skuId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException(SKU_ENTITY, skuId));
    }

    private static String requireTenant(String tenantId) {
        if (!StringUtils.hasText(tenantId)) {
            throw new IllegalArgumentException("tenantId가 필요합니다.");
        }
        return tenantId.trim();
    }

    private static ShopCatalogSkuEventPriceItem toItem(ShopCatalogSkuEventPrice row) {
        return new ShopCatalogSkuEventPriceItem(
                row.getId(),
                row.getEventPriceMinor() != null ? row.getEventPriceMinor() : 0L,
                row.getStartDate(),
                row.getEndDate(),
                row.getUpdatedAt());
    }
}
