package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.ShopSessionCountConstants;
import com.coresolution.consultation.constant.SystemTimeConstants;
import com.coresolution.consultation.dto.publicapi.PublicConsultationProductResponse;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.repository.ShopCatalogSkuRepository;
import com.coresolution.consultation.service.PublicTenantConsultationProductService;
import com.coresolution.consultation.util.PublicTestProductFilter;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
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
        List<PublicConsultationProductResponse> out = new ArrayList<>(rows.size());
        for (ShopCatalogSku row : rows) {
            if (PublicTestProductFilter.isExcluded(row.getTitle(), row.getSkuCode(), Map.of())) {
                continue;
            }
            PublicConsultationProductResponse item = toPublicItem(row, today);
            if (item != null) {
                out.add(item);
            }
        }
        return out;
    }

    /**
     * 이벤트 기간 규칙에 따라 공개 항목을 만들거나 제외한다.
     *
     * @param row SKU
     * @param today Asia/Seoul 기준 오늘
     * @return 공개 항목. event-only 이고 기간 밖이면 null
     */
    static PublicConsultationProductResponse toPublicItem(ShopCatalogSku row, LocalDate today) {
        boolean eventOnly = Boolean.TRUE.equals(row.getEventOnly());
        boolean inPeriod = isInEventPeriod(row.getEventStartDate(), row.getEventEndDate(), today);
        if (eventOnly && !inPeriod) {
            return null;
        }
        Long eventPrice = null;
        LocalDate eventStart = null;
        LocalDate eventEnd = null;
        if (inPeriod) {
            eventPrice = row.getEventPriceMinor();
            eventStart = row.getEventStartDate();
            eventEnd = row.getEventEndDate();
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

    /**
     * 이벤트 기간(시작·종료 LocalDate 포함)에 속하는지.
     *
     * @param start 시작일
     * @param end 종료일
     * @param today 오늘
     * @return 양 끝이 있고 today 가 구간에 포함되면 true
     */
    static boolean isInEventPeriod(LocalDate start, LocalDate end, LocalDate today) {
        if (start == null || end == null || today == null) {
            return false;
        }
        return !today.isBefore(start) && !today.isAfter(end);
    }
}
