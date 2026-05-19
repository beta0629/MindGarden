package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ShopCatalogCategory;
import com.coresolution.consultation.dto.shop.ShopCatalogSkuResponse;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.ShopCatalogSkuRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link ClientShopCatalogServiceImpl} 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ClientShopCatalogServiceImpl")
class ClientShopCatalogServiceImplTest {

    private static final String TENANT = "tenant-client-shop";
    private static final String THUMB = "/api/v1/files/shop-catalog-thumbnails/demo.png";

    @Mock
    private ShopCatalogSkuRepository shopCatalogSkuRepository;

    @InjectMocks
    private ClientShopCatalogServiceImpl clientShopCatalogService;

    @Test
    @DisplayName("listVisibleSkus — thumbnailUrl 포함")
    void listVisibleSkus_includesThumbnailUrl() {
        ShopCatalogSku row = sampleSku();
        when(shopCatalogSkuRepository.findCatalogForTenant(TENANT)).thenReturn(List.of(row));

        List<ShopCatalogSkuResponse> list = clientShopCatalogService.listVisibleSkus(TENANT);

        assertEquals(1, list.size());
        assertEquals(THUMB, list.get(0).getThumbnailUrl());
        assertEquals("SKU-01", list.get(0).getSkuCode());
    }

    @Test
    @DisplayName("getVisibleSkuByCode — 노출 SKU 반환")
    void getVisibleSkuByCode_whenFound_returnsSku() {
        ShopCatalogSku row = sampleSku();
        when(shopCatalogSkuRepository.findVisibleByTenantAndSkuCode(TENANT, "SKU-01"))
                .thenReturn(Optional.of(row));

        ShopCatalogSkuResponse response = clientShopCatalogService.getVisibleSkuByCode(TENANT, "SKU-01");

        assertEquals(THUMB, response.getThumbnailUrl());
        assertEquals(ShopCatalogCategory.CONSULTATION, response.getCatalogCategory());
    }

    @Test
    @DisplayName("getVisibleSkuByCode — 없으면 EntityNotFoundException")
    void getVisibleSkuByCode_whenMissing_throws() {
        when(shopCatalogSkuRepository.findVisibleByTenantAndSkuCode(TENANT, "MISSING"))
                .thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class,
                () -> clientShopCatalogService.getVisibleSkuByCode(TENANT, "MISSING"));
    }

    private static ShopCatalogSku sampleSku() {
        ShopCatalogSku row = new ShopCatalogSku();
        row.setId(1L);
        row.setTenantId(TENANT);
        row.setSkuCode("SKU-01");
        row.setTitle("상품");
        row.setUnitPriceMinor(5000L);
        row.setCurrency("KRW");
        row.setCatalogCategory(ShopCatalogCategory.CONSULTATION);
        row.setThumbnailUrl(THUMB);
        row.setCatalogVisible(true);
        row.setActive(true);
        return row;
    }
}
