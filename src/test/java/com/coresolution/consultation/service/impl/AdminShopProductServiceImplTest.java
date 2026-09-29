package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ConsultationPackageCodeConstants;
import com.coresolution.consultation.constant.ShopAdminProductConstants;
import com.coresolution.consultation.dto.shop.admin.ShopAdminProductItem;
import com.coresolution.consultation.dto.shop.admin.ShopAdminProductListResponse;
import com.coresolution.consultation.dto.shop.admin.ShopAdminProductSaleStatusRequest;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.ShopCatalogSkuRepository;
import com.coresolution.consultation.service.ShopCatalogPackageOfferResolver;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminShopProductServiceImpl — 상품 통합 목록·판매 상태")
class AdminShopProductServiceImplTest {

    private static final String TENANT = "tenant-products";
    private static final String GROUP = ConsultationPackageCodeConstants.CODE_GROUP;

    @Mock
    private CommonCodeRepository commonCodeRepository;
    @Mock
    private ShopCatalogSkuRepository shopCatalogSkuRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private AdminShopProductServiceImpl service;

    @BeforeEach
    void setUp() {
        ShopCatalogPackageOfferResolver resolver = new ShopCatalogPackageOfferResolver(commonCodeRepository, objectMapper);
        service = new AdminShopProductServiceImpl(
                commonCodeRepository, shopCatalogSkuRepository, resolver, objectMapper);
        lenient().when(shopCatalogSkuRepository.save(any(ShopCatalogSku.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(commonCodeRepository.save(any(CommonCode.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private static CommonCode code(Long id, String value, String name, boolean active, String extra) {
        CommonCode c = new CommonCode();
        c.setId(id);
        c.setTenantId(TENANT);
        c.setCodeGroup(GROUP);
        c.setCodeValue(value);
        c.setKoreanName(name);
        c.setCodeLabel(name);
        c.setIsActive(active);
        c.setIsDeleted(false);
        c.setExtraData(extra);
        return c;
    }

    private static ShopCatalogSku sku(Long id, String skuCode, String packageCode, boolean visible) {
        ShopCatalogSku s = new ShopCatalogSku();
        s.setId(id);
        s.setTenantId(TENANT);
        s.setSkuCode(skuCode);
        s.setTitle(skuCode);
        s.setSourcePackageCode(packageCode);
        s.setCatalogVisible(visible);
        s.setActive(true);
        s.setIsDeleted(false);
        return s;
    }

    @Test
    @DisplayName("listProducts — 판매 중지 코드 포함 · 판매 중 먼저 · counts · 서버 page/size")
    void listProducts_includesStoppedAndPages() {
        CommonCode stopped = code(1L, "PACKAGE_001", "단회기", false, "{\"price\":90000,\"sessions\":1}");
        CommonCode onSale = code(2L, "PACKAGE_002", "10회기", true, "{\"price\":800000,\"sessions\":10}");
        CommonCode deleted = code(3L, "PACKAGE_003", "삭제", true, "{}");
        deleted.setIsDeleted(true);
        when(commonCodeRepository.findByTenantIdAndCodeGroupOrderBySortOrderAsc(TENANT, GROUP))
                .thenReturn(List.of(stopped, onSale, deleted));
        ShopCatalogSku linked = sku(10L, "SHOP-FEE-2", "PACKAGE_002", true);
        linked.setValidityMonths(6);
        when(shopCatalogSkuRepository.findByTenantIdAndIsDeletedFalseOrderBySortOrderAscIdAsc(TENANT))
                .thenReturn(List.of(linked, sku(11L, "LEGACY-1", null, false)));

        ShopAdminProductListResponse page0 = service.listProducts(TENANT, 0, 2, null, null);

        assertEquals(3L, page0.totalElements());
        assertEquals(2, page0.products().size());
        assertEquals("PACKAGE_002", page0.products().get(0).code());
        assertEquals(6, page0.products().get(0).fee().validityMonths());
        assertEquals(Map.of("ALL", 3L, "ON_SALE", 2L, "STOPPED", 1L), page0.counts());

        ShopAdminProductListResponse page1 = service.listProducts(TENANT, 1, 2, null, null);
        assertEquals(1, page1.products().size());
        assertEquals("PACKAGE_001", page1.products().get(0).code());
        assertFalse(page1.products().get(0).active());

        ShopAdminProductListResponse stoppedOnly = service.listProducts(
                TENANT, 0, 20, ShopAdminProductConstants.SEGMENT_STOPPED, "단회");
        assertEquals(1L, stoppedOnly.totalElements());
        assertEquals(Map.of("ALL", 1L, "ON_SALE", 0L, "STOPPED", 1L), stoppedOnly.counts());
    }

    @Test
    @DisplayName("updateSaleStatus 중지 — 판매 사용·홈 공개·몰 노출을 함께 끄고 extraData 다른 값은 보존")
    void stopPackage_turnsOffPublicAndMall() throws Exception {
        CommonCode row = code(2L, "PACKAGE_002", "10회기", true,
                "{\"price\":800000,\"sessions\":10,\"remark\":\"안내\",\"publicVisible\":true}");
        when(commonCodeRepository.findByTenantIdAndCodeGroupAndCodeValue(TENANT, GROUP, "PACKAGE_002"))
                .thenReturn(Optional.of(row));
        ShopCatalogSku linked = sku(10L, "SHOP-FEE-2", "PACKAGE_002", true);
        when(shopCatalogSkuRepository.findByTenantIdAndSourcePackageCodeAndIsDeletedFalseOrderByIdAsc(
                TENANT, "PACKAGE_002")).thenReturn(List.of(linked));

        ShopAdminProductItem item = service.updateSaleStatus(TENANT, new ShopAdminProductSaleStatusRequest(
                ShopAdminProductConstants.KIND_PACKAGE, "PACKAGE_002", null, false));

        assertFalse(row.getIsActive());
        Map<?, ?> extra = objectMapper.readValue(row.getExtraData(), Map.class);
        assertEquals(Boolean.FALSE, extra.get("publicVisible"));
        assertEquals("안내", extra.get("remark"));
        assertEquals(800000, extra.get("price"));
        assertFalse(linked.getCatalogVisible());
        assertFalse(item.active());
        assertFalse(item.fee().catalogVisible());
    }

    @Test
    @DisplayName("updateSaleStatus 재개 — 판매 사용만 켜고 공개·노출은 꺼진 채 유지")
    void resumePackage_onlyActivates() {
        String extra = "{\"price\":800000,\"sessions\":10,\"publicVisible\":false}";
        CommonCode row = code(2L, "PACKAGE_002", "10회기", false, extra);
        when(commonCodeRepository.findByTenantIdAndCodeGroupAndCodeValue(TENANT, GROUP, "PACKAGE_002"))
                .thenReturn(Optional.of(row));
        ShopCatalogSku linked = sku(10L, "SHOP-FEE-2", "PACKAGE_002", false);
        when(shopCatalogSkuRepository.findByTenantIdAndSourcePackageCodeAndIsDeletedFalseOrderByIdAsc(
                TENANT, "PACKAGE_002")).thenReturn(List.of(linked));

        ShopAdminProductItem item = service.updateSaleStatus(TENANT, new ShopAdminProductSaleStatusRequest(
                ShopAdminProductConstants.KIND_PACKAGE, "PACKAGE_002", null, true));

        assertTrue(row.getIsActive());
        assertEquals(extra, row.getExtraData());
        assertFalse(linked.getCatalogVisible());
        verify(shopCatalogSkuRepository, never()).save(any());
        assertTrue(item.active());
    }

    @Test
    @DisplayName("updateSaleStatus — 직접 등록 SKU 중지는 active·노출 off, 연결 SKU id 는 거절")
    void legacySaleStatus() {
        ShopCatalogSku legacy = sku(11L, "LEGACY-1", null, true);
        when(shopCatalogSkuRepository.findByIdAndTenantIdAndIsDeletedFalse(11L, TENANT))
                .thenReturn(Optional.of(legacy));
        ShopAdminProductItem item = service.updateSaleStatus(TENANT, new ShopAdminProductSaleStatusRequest(
                ShopAdminProductConstants.KIND_LEGACY, null, 11L, false));
        assertFalse(legacy.getActive());
        assertFalse(legacy.getCatalogVisible());
        assertFalse(item.active());

        ShopCatalogSku linked = sku(10L, "SHOP-FEE-2", "PACKAGE_002", true);
        when(shopCatalogSkuRepository.findByIdAndTenantIdAndIsDeletedFalse(10L, TENANT))
                .thenReturn(Optional.of(linked));
        assertThrows(IllegalArgumentException.class, () -> service.updateSaleStatus(TENANT,
                new ShopAdminProductSaleStatusRequest(ShopAdminProductConstants.KIND_LEGACY, null, 10L, false)));
        assertTrue(linked.getCatalogVisible());
    }

    @Test
    @DisplayName("updateSaleStatus — 다른 테넌트 코드는 찾지 못해 거절")
    void otherTenantCode_rejected() {
        when(commonCodeRepository.findByTenantIdAndCodeGroupAndCodeValue(TENANT, GROUP, "PACKAGE_009"))
                .thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> service.updateSaleStatus(TENANT,
                new ShopAdminProductSaleStatusRequest(ShopAdminProductConstants.KIND_PACKAGE, "PACKAGE_009", null,
                        false)));
        verify(commonCodeRepository, never()).save(any());
    }
}
