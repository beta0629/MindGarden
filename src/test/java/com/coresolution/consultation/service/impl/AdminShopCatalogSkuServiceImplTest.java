package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.dto.shop.admin.ShopCatalogSkuUpsertRequest;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.ShopCatalogSkuRepository;
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

    @Mock
    private ShopCatalogSkuRepository shopCatalogSkuRepository;

    @InjectMocks
    private AdminShopCatalogSkuServiceImpl adminShopCatalogSkuService;

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

        ShopCatalogSkuUpsertRequest request = new ShopCatalogSkuUpsertRequest(
                "PKG-01", "패키지", null, 10000L, "KRW", true, true, 0);

        assertThrows(IllegalArgumentException.class,
                () -> adminShopCatalogSkuService.create(TENANT, request));
    }

    @Test
    @DisplayName("patchCatalogVisible — catalogVisible 반영")
    void patchCatalogVisible_updatesFlag() {
        ShopCatalogSku row = new ShopCatalogSku();
        row.setId(3L);
        row.setTenantId(TENANT);
        row.setCatalogVisible(false);
        when(shopCatalogSkuRepository.findByIdAndTenantIdAndIsDeletedFalse(3L, TENANT))
                .thenReturn(Optional.of(row));
        when(shopCatalogSkuRepository.save(any(ShopCatalogSku.class))).thenAnswer(inv -> inv.getArgument(0));

        adminShopCatalogSkuService.patchCatalogVisible(TENANT, 3L, true);

        ArgumentCaptor<ShopCatalogSku> captor = ArgumentCaptor.forClass(ShopCatalogSku.class);
        verify(shopCatalogSkuRepository).save(captor.capture());
        assertEquals(true, captor.getValue().getCatalogVisible());
    }
}
