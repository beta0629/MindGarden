package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.ShopSessionCountConstants;
import com.coresolution.consultation.constant.SystemTimeConstants;
import com.coresolution.consultation.dto.publicapi.PublicConsultationProductResponse;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.entity.ShopCatalogSkuEventPrice;
import com.coresolution.consultation.repository.ShopCatalogSkuEventPriceRepository;
import com.coresolution.consultation.repository.ShopCatalogSkuRepository;
import com.coresolution.consultation.service.PublicTenantConsultationProductService;
import com.coresolution.consultation.util.PublicTestProductFilter;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * 센터 홈페이지용 공개 상담 상품 조회 구현.
 *
 * @author MindGarden
 * @since 2026-11-11
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PublicTenantConsultationProductServiceImpl implements PublicTenantConsultationProductService {

    private final TenantRepository tenantRepository;
    private final ShopCatalogSkuRepository shopCatalogSkuRepository;
    private final ShopCatalogSkuEventPriceRepository shopCatalogSkuEventPriceRepository;

    private Clock clock = Clock.system(SystemTimeConstants.ZONE);

    /**
     * 테스트용 고정 Clock.
     *
     * @param clock 고정 시각
     */
    void useClock(Clock clock) {
        this.clock = clock != null ? clock : Clock.system(SystemTimeConstants.ZONE);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PublicConsultationProductResponse> listByTenantSlug(String tenantSlug) {
        if (!StringUtils.hasText(tenantSlug)) {
            return List.of();
        }
        Tenant tenant = tenantRepository.findBySubdomainIgnoreCase(tenantSlug.trim()).orElse(null);
        if (tenant == null || !tenant.isActive() || !StringUtils.hasText(tenant.getTenantId())) {
            log.debug("공개 상담 상품: 테넌트 없음 또는 비활성 slug={}", tenantSlug);
            return List.of();
        }
        String tenantId = tenant.getTenantId().trim();
        LocalDate today = LocalDate.now(clock.withZone(SystemTimeConstants.ZONE));
        List<ShopCatalogSku> rows = shopCatalogSkuRepository.findCatalogForTenant(tenantId);
        List<Long> skuIds = new ArrayList<>(rows.size());
        for (ShopCatalogSku row : rows) {
            if (row.getId() != null) {
                skuIds.add(row.getId());
            }
        }
        Map<Long, ShopCatalogSkuEventPrice> activeBySkuId = loadActiveEventPrices(tenantId, skuIds, today);
        List<PublicConsultationProductResponse> out = new ArrayList<>(rows.size());
        for (ShopCatalogSku row : rows) {
            if (PublicTestProductFilter.isExcluded(row.getTitle(), row.getSkuCode(), Map.of())) {
                continue;
            }
            ShopCatalogSkuEventPrice active = row.getId() != null ? activeBySkuId.get(row.getId()) : null;
            PublicConsultationProductResponse item = toPublicItem(row, active);
            if (item != null) {
                out.add(item);
            }
        }
        return out;
    }

    /**
     * 오늘 활성 이벤트 가격을 SKU id 기준으로 배치 조회한다.
     *
     * @param tenantId 테넌트 ID
     * @param skuIds SKU ID 목록
     * @param today Asia/Seoul 기준 오늘
     * @return skuId → 활성 이벤트 행
     */
    private Map<Long, ShopCatalogSkuEventPrice> loadActiveEventPrices(
            String tenantId,
            List<Long> skuIds,
            LocalDate today) {
        Map<Long, ShopCatalogSkuEventPrice> map = new HashMap<>();
        if (skuIds == null || skuIds.isEmpty()) {
            return map;
        }
        List<ShopCatalogSkuEventPrice> activeRows = shopCatalogSkuEventPriceRepository
                .findActiveOnDateForSkuIds(tenantId, skuIds, today);
        for (ShopCatalogSkuEventPrice row : activeRows) {
            if (row.getSkuId() == null) {
                continue;
            }
            map.putIfAbsent(row.getSkuId(), row);
        }
        return map;
    }

    /**
     * 이벤트 기간 규칙에 따라 공개 항목을 만들거나 제외한다.
     *
     * @param row SKU
     * @param activeToday 오늘 활성 이벤트 가격(없으면 null)
     * @return 공개 항목. event-only 이고 활성 이벤트가 없으면 null
     */
    static PublicConsultationProductResponse toPublicItem(
            ShopCatalogSku row,
            ShopCatalogSkuEventPrice activeToday) {
        boolean eventOnly = Boolean.TRUE.equals(row.getEventOnly());
        if (eventOnly && activeToday == null) {
            return null;
        }
        Long eventPrice = null;
        LocalDate eventStart = null;
        LocalDate eventEnd = null;
        if (activeToday != null) {
            eventPrice = activeToday.getEventPriceMinor();
            eventStart = activeToday.getStartDate();
            eventEnd = activeToday.getEndDate();
        }
        int sessionCount = row.getSessionCount() != null
                && row.getSessionCount() >= ShopSessionCountConstants.MIN_SESSION_COUNT
                ? row.getSessionCount()
                : ShopSessionCountConstants.MIN_SESSION_COUNT;
        long price = row.getUnitPriceMinor() != null ? row.getUnitPriceMinor() : 0L;
        int displayOrder = row.getSortOrder() != null ? row.getSortOrder() : 0;
        return new PublicConsultationProductResponse(
                row.getSkuCode(),
                row.getTitle(),
                price,
                eventPrice,
                eventStart,
                eventEnd,
                sessionCount,
                row.getSessionMinutes(),
                displayOrder,
                row.getUpdatedAt());
    }
}
