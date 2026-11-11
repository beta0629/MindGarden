package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.dto.publicapi.PublicConsultationProductResponse;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.repository.ShopCatalogSkuRepository;
import com.coresolution.consultation.util.PublicTestProductFilter;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link PublicTenantConsultationProductServiceImpl} 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-11-11
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PublicTenantConsultationProductServiceImpl")
class PublicTenantConsultationProductServiceImplTest {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final String SLUG = "mindgarden";
    private static final String TENANT_ID = "tenant-home-1";
    private static final String FIXTURE_TITLE = "첫 마음산책(검사 1종 + 상담 30분)";
    private static final String FIXTURE_SKU = "HOME-EVENT-001";

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private ShopCatalogSkuRepository shopCatalogSkuRepository;

    private PublicTenantConsultationProductServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new PublicTenantConsultationProductServiceImpl(tenantRepository, shopCatalogSkuRepository);
    }

    @Test
    @DisplayName("event-only SKU — 기간 안이면 이벤트 필드와 함께 포함")
    void eventOnly_insidePeriod_includedWithEventFields() {
        stubActiveTenant();
        ShopCatalogSku sku = eventOnlyFixture();
        when(shopCatalogSkuRepository.findCatalogForTenant(TENANT_ID)).thenReturn(List.of(sku));
        service.useClock(fixedKst("2026-11-11T12:00:00Z"));

        List<PublicConsultationProductResponse> items = service.listByTenantSlug(SLUG);

        assertThat(items).hasSize(1);
        PublicConsultationProductResponse item = items.get(0);
        assertThat(item.skuCode()).isEqualTo(FIXTURE_SKU);
        assertThat(item.name()).isEqualTo(FIXTURE_TITLE);
        assertThat(item.price()).isEqualTo(60000L);
        assertThat(item.eventPrice()).isEqualTo(45000L);
        assertThat(item.eventStartDate()).isEqualTo(LocalDate.of(2026, 11, 1));
        assertThat(item.eventEndDate()).isEqualTo(LocalDate.of(2026, 12, 31));
        assertThat(item.sessionMinutes()).isEqualTo(30);
        assertThat(item.displayOrder()).isEqualTo(1);
    }

    @Test
    @DisplayName("event-only SKU — 기간 후면 제외")
    void eventOnly_afterPeriod_excluded() {
        stubActiveTenant();
        when(shopCatalogSkuRepository.findCatalogForTenant(TENANT_ID))
                .thenReturn(List.of(eventOnlyFixture()));
        service.useClock(fixedKst("2027-01-01T00:00:00Z"));

        assertThat(service.listByTenantSlug(SLUG)).isEmpty();
    }

    @Test
    @DisplayName("event-only SKU — 기간 전이면 제외")
    void eventOnly_beforePeriod_excluded() {
        stubActiveTenant();
        when(shopCatalogSkuRepository.findCatalogForTenant(TENANT_ID))
                .thenReturn(List.of(eventOnlyFixture()));
        // 2026-10-31 KST = 2026-10-30T15:00:00Z
        service.useClock(fixedKst("2026-10-30T15:00:00Z"));

        assertThat(service.listByTenantSlug(SLUG)).isEmpty();
    }

    @Test
    @DisplayName("일반 SKU — 종료된 이벤트는 정상가만, 이벤트 필드는 null")
    void normalSku_endedEvent_listsAtNormalPrice() {
        stubActiveTenant();
        ShopCatalogSku sku = baseSku("NORMAL-001", "일반 상담", 80000L);
        sku.setEventOnly(false);
        sku.setEventPriceMinor(50000L);
        sku.setEventStartDate(LocalDate.of(2026, 1, 1));
        sku.setEventEndDate(LocalDate.of(2026, 1, 31));
        when(shopCatalogSkuRepository.findCatalogForTenant(TENANT_ID)).thenReturn(List.of(sku));
        service.useClock(fixedKst("2026-11-11T12:00:00Z"));

        List<PublicConsultationProductResponse> items = service.listByTenantSlug(SLUG);

        assertThat(items).hasSize(1);
        assertThat(items.get(0).price()).isEqualTo(80000L);
        assertThat(items.get(0).eventPrice()).isNull();
        assertThat(items.get(0).eventStartDate()).isNull();
        assertThat(items.get(0).eventEndDate()).isNull();
    }

    @Test
    @DisplayName("비노출·비활성·테스트 SKU 제외 — findCatalog 결과 중 테스트 라벨만 추가 필터")
    void excludesTestLabeledSku() {
        stubActiveTenant();
        ShopCatalogSku testSku = baseSku(PublicTestProductFilter.BLOCKED_PUBLIC_SKU, "테스트 상품", 1000L);
        ShopCatalogSku ok = baseSku("OK-001", "정상 상품", 20000L);
        when(shopCatalogSkuRepository.findCatalogForTenant(TENANT_ID)).thenReturn(List.of(testSku, ok));
        service.useClock(fixedKst("2026-11-11T12:00:00Z"));

        List<PublicConsultationProductResponse> items = service.listByTenantSlug(SLUG);

        assertThat(items).extracting(PublicConsultationProductResponse::skuCode).containsExactly("OK-001");
    }

    @Test
    @DisplayName("다른 테넌트 SKU는 조회하지 않음 — 슬러그 테넌트만 findCatalog")
    void otherTenantNeverQueried() {
        stubActiveTenant();
        when(shopCatalogSkuRepository.findCatalogForTenant(TENANT_ID)).thenReturn(List.of());
        service.useClock(fixedKst("2026-11-11T12:00:00Z"));

        service.listByTenantSlug(SLUG);

        verify(shopCatalogSkuRepository).findCatalogForTenant(eq(TENANT_ID));
        verify(shopCatalogSkuRepository, never()).findCatalogForTenant(eq("other-tenant"));
    }

    @Test
    @DisplayName("테넌트 없음·비활성 → 빈 목록")
    void missingOrInactiveTenant_returnsEmpty() {
        when(tenantRepository.findBySubdomainIgnoreCase(SLUG)).thenReturn(Optional.empty());
        assertThat(service.listByTenantSlug(SLUG)).isEmpty();
        verify(shopCatalogSkuRepository, never()).findCatalogForTenant(org.mockito.ArgumentMatchers.any());
    }

    @Test
    @DisplayName("응답 레코드에 id 필드 없음")
    void responseHasNoIdAccessor() {
        assertThat(PublicConsultationProductResponse.class.getRecordComponents())
                .extracting(rc -> rc.getName())
                .doesNotContain("id", "consultantId", "tenantId");
    }

    private void stubActiveTenant() {
        Tenant tenant = new Tenant();
        tenant.setTenantId(TENANT_ID);
        tenant.setSubdomain(SLUG);
        tenant.setStatus(Tenant.TenantStatus.ACTIVE);
        when(tenantRepository.findBySubdomainIgnoreCase(SLUG)).thenReturn(Optional.of(tenant));
    }

    private static ShopCatalogSku eventOnlyFixture() {
        ShopCatalogSku sku = baseSku(FIXTURE_SKU, FIXTURE_TITLE, 60000L);
        sku.setEventOnly(true);
        sku.setEventPriceMinor(45000L);
        sku.setEventStartDate(LocalDate.of(2026, 11, 1));
        sku.setEventEndDate(LocalDate.of(2026, 12, 31));
        sku.setSessionMinutes(30);
        return sku;
    }

    private static ShopCatalogSku baseSku(String code, String title, long price) {
        ShopCatalogSku sku = new ShopCatalogSku();
        sku.setId(99L);
        sku.setTenantId(TENANT_ID);
        sku.setSkuCode(code);
        sku.setTitle(title);
        sku.setUnitPriceMinor(price);
        sku.setActive(true);
        sku.setCatalogVisible(true);
        sku.setSortOrder(1);
        sku.setSessionCount(1);
        sku.setUpdatedAt(LocalDateTime.of(2026, 11, 1, 10, 0));
        return sku;
    }

    private static Clock fixedKst(String instant) {
        return Clock.fixed(Instant.parse(instant), KST);
    }
}
