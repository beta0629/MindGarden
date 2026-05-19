package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ShopCatalogCategory;
import com.coresolution.consultation.dto.shop.admin.ShopCatalogSkuAdminDetail;
import com.coresolution.consultation.dto.shop.admin.ShopCatalogSkuUpsertRequest;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.entity.ShopCatalogSkuPriceHistory;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.ShopCatalogSkuPriceHistoryRepository;
import com.coresolution.consultation.repository.ShopCatalogSkuRepository;
import com.coresolution.consultation.service.ShopCatalogSkuCodeGenerator;
import com.coresolution.consultation.service.ShopCatalogSkuThumbnailService;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link AdminShopCatalogSkuServiceImpl} 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminShopCatalogSkuServiceImpl")
class AdminShopCatalogSkuServiceImplTest {

    private static final String TENANT = "tenant-admin-shop";
    private static final String THUMB = "/api/v1/files/shop-catalog-thumbnails/test.png";

    @Mock
    private ShopCatalogSkuRepository shopCatalogSkuRepository;

    @Mock
    private ShopCatalogSkuPriceHistoryRepository shopCatalogSkuPriceHistoryRepository;

    @Mock
    private ShopCatalogSkuCodeGenerator shopCatalogSkuCodeGenerator;

    @Mock
    private ShopCatalogSkuThumbnailService shopCatalogSkuThumbnailService;

    @InjectMocks
    private AdminShopCatalogSkuServiceImpl adminShopCatalogSkuService;

    private static ShopCatalogSkuUpsertRequest upsert(
            String skuCode,
            long unitPriceMinor) {
        return new ShopCatalogSkuUpsertRequest(
                skuCode,
                "패키지",
                null,
                unitPriceMinor,
                "KRW",
                ShopCatalogCategory.CONSULTATION,
                THUMB,
                true,
                true,
                0);
    }

    @Test
    @DisplayName("patchCatalogVisible — 존재하지 않으면 EntityNotFoundException")
    void patchCatalogVisible_whenMissing_throwsNotFound() {
        when(shopCatalogSkuRepository.findByIdAndTenantIdAndIsDeletedFalse(eq(9L), eq(TENANT)))
                .thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class,
                () -> adminShopCatalogSkuService.patchCatalogVisible(TENANT, 9L, true));
    }

    @Test
    @DisplayName("create — skuCode 중복이면 IllegalArgumentException")
    void create_whenDuplicateSkuCode_throws() {
        when(shopCatalogSkuRepository.existsByTenantIdAndSkuCodeAndIsDeletedFalse(TENANT, "PKG-01"))
                .thenReturn(true);

        ShopCatalogSkuUpsertRequest request = upsert("PKG-01", 10000L);

        assertThrows(IllegalArgumentException.class,
                () -> adminShopCatalogSkuService.create(TENANT, request));
    }

    @Test
    @DisplayName("create — skuCode 생략 시 서버 자동 발급")
    void create_whenSkuCodeAbsent_generatesCode() {
        when(shopCatalogSkuCodeGenerator.generateNextCode(TENANT)).thenReturn("SHOP-20260523-001");
        when(shopCatalogSkuRepository.existsByTenantIdAndSkuCodeAndIsDeletedFalse(TENANT, "SHOP-20260523-001"))
                .thenReturn(false);
        when(shopCatalogSkuRepository.save(any(ShopCatalogSku.class))).thenAnswer(inv -> {
            ShopCatalogSku row = inv.getArgument(0);
            row.setId(11L);
            return row;
        });
        when(shopCatalogSkuPriceHistoryRepository.save(any(ShopCatalogSkuPriceHistory.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        ShopCatalogSkuUpsertRequest request = upsert(null, 10000L);
        ShopCatalogSkuAdminDetail detail = adminShopCatalogSkuService.create(TENANT, request);

        assertEquals("SHOP-20260523-001", detail.skuCode());
        ArgumentCaptor<ShopCatalogSku> captor = ArgumentCaptor.forClass(ShopCatalogSku.class);
        verify(shopCatalogSkuRepository).save(captor.capture());
        assertEquals("SHOP-20260523-001", captor.getValue().getSkuCode());
        assertEquals(THUMB, captor.getValue().getThumbnailUrl());
    }

    @Test
    @DisplayName("create — thumbnailUrl 없어도 저장 성공(이후 multipart 업로드)")
    void create_whenThumbnailMissing_succeeds() {
        when(shopCatalogSkuRepository.existsByTenantIdAndSkuCodeAndIsDeletedFalse(TENANT, "PKG-99"))
                .thenReturn(false);
        when(shopCatalogSkuRepository.save(any(ShopCatalogSku.class))).thenAnswer(inv -> {
            ShopCatalogSku row = inv.getArgument(0);
            row.setId(12L);
            return row;
        });
        when(shopCatalogSkuPriceHistoryRepository.save(any(ShopCatalogSkuPriceHistory.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        ShopCatalogSkuUpsertRequest request = new ShopCatalogSkuUpsertRequest(
                "PKG-99", "패키지", null, 10000L, "KRW", ShopCatalogCategory.CONSULTATION,
                null, false, true, 0);

        ShopCatalogSkuAdminDetail detail = adminShopCatalogSkuService.create(TENANT, request);

        assertEquals("PKG-99", detail.skuCode());
        ArgumentCaptor<ShopCatalogSku> captor = ArgumentCaptor.forClass(ShopCatalogSku.class);
        verify(shopCatalogSkuRepository).save(captor.capture());
        assertNull(captor.getValue().getThumbnailUrl());
    }

    @Test
    @DisplayName("update — unit_price_minor 변경 시 이력 1건 저장")
    void update_whenUnitPriceChanges_recordsPriceHistory() {
        ShopCatalogSku row = new ShopCatalogSku();
        row.setId(7L);
        row.setTenantId(TENANT);
        row.setSkuCode("PKG-01");
        row.setTitle("패키지");
        row.setUnitPriceMinor(10000L);
        row.setCurrency("KRW");
        row.setCatalogVisible(true);
        row.setActive(true);
        row.setSortOrder(0);
        row.setThumbnailUrl(THUMB);

        when(shopCatalogSkuRepository.findByIdAndTenantIdAndIsDeletedFalse(7L, TENANT))
                .thenReturn(Optional.of(row));
        when(shopCatalogSkuRepository.save(any(ShopCatalogSku.class))).thenAnswer(inv -> inv.getArgument(0));
        when(shopCatalogSkuPriceHistoryRepository.save(any(ShopCatalogSkuPriceHistory.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        ShopCatalogSkuUpsertRequest request = upsert("OTHER-CODE", 12000L);

        adminShopCatalogSkuService.update(TENANT, 7L, request);

        ArgumentCaptor<ShopCatalogSkuPriceHistory> captor = ArgumentCaptor.forClass(ShopCatalogSkuPriceHistory.class);
        verify(shopCatalogSkuPriceHistoryRepository).save(captor.capture());
        assertEquals(7L, captor.getValue().getSkuId());
        assertEquals("PKG-01", captor.getValue().getSkuCode());
        assertEquals(12000L, captor.getValue().getUnitPriceMinor());
        assertEquals("PKG-01", row.getSkuCode());
    }

    @Test
    @DisplayName("update — unit_price_minor 동일하면 이력 skip")
    void update_whenUnitPriceUnchanged_skipsPriceHistory() {
        ShopCatalogSku row = new ShopCatalogSku();
        row.setId(8L);
        row.setTenantId(TENANT);
        row.setSkuCode("PKG-02");
        row.setTitle("패키지2");
        row.setUnitPriceMinor(5000L);
        row.setCurrency("KRW");
        row.setCatalogVisible(true);
        row.setActive(true);
        row.setSortOrder(0);
        row.setThumbnailUrl(THUMB);

        when(shopCatalogSkuRepository.findByIdAndTenantIdAndIsDeletedFalse(8L, TENANT))
                .thenReturn(Optional.of(row));
        when(shopCatalogSkuRepository.save(any(ShopCatalogSku.class))).thenAnswer(inv -> inv.getArgument(0));

        ShopCatalogSkuUpsertRequest request = upsert("PKG-02", 5000L);

        adminShopCatalogSkuService.update(TENANT, 8L, request);

        verify(shopCatalogSkuPriceHistoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("patchCatalogVisible — 노출 true인데 thumbnail 없으면 IllegalArgumentException")
    void patchCatalogVisible_whenVisibleWithoutThumbnail_throws() {
        ShopCatalogSku row = new ShopCatalogSku();
        row.setId(5L);
        row.setTenantId(TENANT);
        row.setCatalogVisible(false);
        when(shopCatalogSkuRepository.findByIdAndTenantIdAndIsDeletedFalse(5L, TENANT))
                .thenReturn(Optional.of(row));

        assertThrows(IllegalArgumentException.class,
                () -> adminShopCatalogSkuService.patchCatalogVisible(TENANT, 5L, true));
        verify(shopCatalogSkuRepository, never()).save(any());
    }

    @Test
    @DisplayName("patchCatalogVisible — catalogVisible 반영")
    void patchCatalogVisible_updatesFlag() {
        ShopCatalogSku row = new ShopCatalogSku();
        row.setId(3L);
        row.setTenantId(TENANT);
        row.setCatalogVisible(false);
        row.setThumbnailUrl(THUMB);
        when(shopCatalogSkuRepository.findByIdAndTenantIdAndIsDeletedFalse(3L, TENANT))
                .thenReturn(Optional.of(row));
        when(shopCatalogSkuRepository.save(any(ShopCatalogSku.class))).thenAnswer(inv -> inv.getArgument(0));

        adminShopCatalogSkuService.patchCatalogVisible(TENANT, 3L, true);

        ArgumentCaptor<ShopCatalogSku> captor = ArgumentCaptor.forClass(ShopCatalogSku.class);
        verify(shopCatalogSkuRepository).save(captor.capture());
        assertEquals(true, captor.getValue().getCatalogVisible());
    }

    @Test
    @DisplayName("uploadThumbnail — 저장 URL 반영")
    void uploadThumbnail_setsThumbnailUrl() {
        ShopCatalogSku row = new ShopCatalogSku();
        row.setId(4L);
        row.setTenantId(TENANT);
        row.setSkuCode("PKG-04");
        row.setTitle("상품");
        row.setUnitPriceMinor(1000L);
        row.setCurrency("KRW");
        row.setCatalogVisible(true);
        row.setActive(true);
        row.setSortOrder(0);

        when(shopCatalogSkuRepository.findByIdAndTenantIdAndIsDeletedFalse(4L, TENANT))
                .thenReturn(Optional.of(row));
        when(shopCatalogSkuThumbnailService.storeThumbnail(eq(TENANT), eq(4L), any()))
                .thenReturn(THUMB);
        when(shopCatalogSkuRepository.save(any(ShopCatalogSku.class))).thenAnswer(inv -> inv.getArgument(0));

        ShopCatalogSkuAdminDetail detail = adminShopCatalogSkuService.uploadThumbnail(TENANT, 4L, null);

        assertEquals(THUMB, detail.thumbnailUrl());
        assertEquals(THUMB, row.getThumbnailUrl());
    }
}
