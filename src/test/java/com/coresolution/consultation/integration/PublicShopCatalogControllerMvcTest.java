package com.coresolution.consultation.integration;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.coresolution.consultation.dto.shop.ShopCatalogSkuResponse;
import com.coresolution.consultation.service.ClientShopCatalogService;
import com.coresolution.core.constant.PlatformComponentCodes;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.TenantComponentActivationService;
import com.coresolution.integrationtest.shop.PublicShopCatalogControllerMvcTestApplication;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * {@link com.coresolution.consultation.controller.PublicShopCatalogController} MockMvc.
 *
 * @author MindGarden
 * @since 2026-09-16
 */
@SpringBootTest(classes = PublicShopCatalogControllerMvcTestApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("PublicShopCatalogController MockMvc")
class PublicShopCatalogControllerMvcTest {

    private static final String BASE = "/api/v1/shop/catalog";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ClientShopCatalogService clientShopCatalogService;

    @MockBean
    private TenantComponentActivationService tenantComponentActivationService;

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("GET catalog — 익명·테넌트·CLIENT_SHOP 활성 시 200")
    @WithAnonymousUser
    void listCatalog_anonymousWithTenant_returns200() throws Exception {
        String tenantId = UUID.randomUUID().toString();
        TenantContextHolder.setTenantId(tenantId);
        when(tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.CLIENT_SHOP))
                .thenReturn(true);
        when(clientShopCatalogService.listVisibleSkus(tenantId)).thenReturn(Collections.emptyList());

        mockMvc.perform(get(BASE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());

        verify(clientShopCatalogService).listVisibleSkus(tenantId);
    }

    @Test
    @DisplayName("GET catalog/{sku} — 익명·테넌트 시 200")
    @WithAnonymousUser
    void getSku_anonymousWithTenant_returns200() throws Exception {
        String tenantId = UUID.randomUUID().toString();
        TenantContextHolder.setTenantId(tenantId);
        when(tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.CLIENT_SHOP))
                .thenReturn(true);
        ShopCatalogSkuResponse sku = ShopCatalogSkuResponse.builder()
                .skuCode("DEV-CONSULT-DEMO-01")
                .title("데모")
                .unitPriceMinor(50000L)
                .currency("KRW")
                .catalogCategory("CONSULTATION")
                .thumbnailUrl("/api/v1/files/shop-catalog-thumbnails/pdp.png")
                .build();
        when(clientShopCatalogService.getVisibleSkuByCode(tenantId, "DEV-CONSULT-DEMO-01")).thenReturn(sku);

        mockMvc.perform(get(BASE + "/DEV-CONSULT-DEMO-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.skuCode").value("DEV-CONSULT-DEMO-01"));
    }

    @Test
    @DisplayName("GET catalog — 테넌트 없으면 403")
    @WithAnonymousUser
    void listCatalog_withoutTenant_returns403() throws Exception {
        mockMvc.perform(get(BASE))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));

        verify(clientShopCatalogService, never()).listVisibleSkus(org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    @DisplayName("GET catalog — CLIENT_SHOP 비활성 시 403")
    @WithAnonymousUser
    void listCatalog_shopDisabled_returns403() throws Exception {
        String tenantId = UUID.randomUUID().toString();
        TenantContextHolder.setTenantId(tenantId);
        when(tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.CLIENT_SHOP))
                .thenReturn(false);

        mockMvc.perform(get(BASE))
                .andExpect(status().isForbidden());

        verify(clientShopCatalogService, never()).listVisibleSkus(tenantId);
    }

    @Test
    @DisplayName("GET catalog — 활성 SKU 목록 반환")
    @WithAnonymousUser
    void listCatalog_withSkus_returnsRows() throws Exception {
        String tenantId = UUID.randomUUID().toString();
        TenantContextHolder.setTenantId(tenantId);
        when(tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.CLIENT_SHOP))
                .thenReturn(true);
        when(clientShopCatalogService.listVisibleSkus(tenantId)).thenReturn(List.of(
                ShopCatalogSkuResponse.builder()
                        .skuCode("SKU-A")
                        .title("A")
                        .unitPriceMinor(1000L)
                        .currency("KRW")
                        .catalogCategory("CONSULTATION")
                        .build()));

        mockMvc.perform(get(BASE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].skuCode").value("SKU-A"));
    }
}
