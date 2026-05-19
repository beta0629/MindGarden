package com.coresolution.consultation.integration;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;

import com.coresolution.consultation.dto.shop.admin.CatalogVisiblePatchRequest;
import com.coresolution.consultation.dto.shop.admin.ShopCatalogSkuAdminItem;
import com.coresolution.consultation.service.AdminShopCatalogSkuService;
import com.coresolution.core.constant.PlatformComponentCodes;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.TenantComponentActivationService;
import com.coresolution.integrationtest.shop.AdminShopCatalogSkuControllerMvcTestApplication;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * {@link com.coresolution.consultation.controller.AdminShopCatalogSkuController} slice MockMvc.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@SpringBootTest(classes = AdminShopCatalogSkuControllerMvcTestApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("AdminShopCatalogSkuController MockMvc")
class AdminShopCatalogSkuControllerMvcTest {

    private static final String LIST_PATH = "/api/v1/admin/shop/catalog-skus";

    private String tenantId;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AdminShopCatalogSkuService adminShopCatalogSkuService;

    @MockBean
    private TenantComponentActivationService tenantComponentActivationService;

    @BeforeEach
    void setTenantContext() {
        tenantId = UUID.randomUUID().toString();
        TenantContextHolder.setTenantId(tenantId);
    }

    @AfterEach
    void clearTenantContext() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("GET 목록 — ADMIN·컴포넌트 활성 시 200·success")
    @WithMockUser(roles = {"ADMIN"})
    void list_whenAdminAndComponentActive_returns200() throws Exception {
        when(tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.ADMIN_SHOP_CATALOG))
                .thenReturn(true);
        when(adminShopCatalogSkuService.listAllForTenant(tenantId)).thenReturn(List.of());

        mockMvc.perform(get(LIST_PATH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("GET 목록 — TenantContext tenantId로만 서비스 조회")
    @WithMockUser(roles = {"ADMIN"})
    void list_scopedToTenantContext() throws Exception {
        String otherTenantId = UUID.randomUUID().toString();
        ShopCatalogSkuAdminItem item = new ShopCatalogSkuAdminItem(
                1L,
                "SKU-UT",
                "단위테스트 상품",
                5000L,
                "KRW",
                true,
                true,
                0,
                LocalDateTime.now());

        when(tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.ADMIN_SHOP_CATALOG))
                .thenReturn(true);
        when(adminShopCatalogSkuService.listAllForTenant(tenantId)).thenReturn(List.of(item));

        mockMvc.perform(get(LIST_PATH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].skuCode").value("SKU-UT"));

        verify(adminShopCatalogSkuService).listAllForTenant(tenantId);
        verify(adminShopCatalogSkuService, never()).listAllForTenant(eq(otherTenantId));
    }

    @Test
    @DisplayName("GET 목록 — 인증 없음 시 401 또는 403")
    void list_withoutAuth_returnsUnauthorizedOrForbidden() throws Exception {
        when(tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.ADMIN_SHOP_CATALOG))
                .thenReturn(true);

        var result = mockMvc.perform(get(LIST_PATH)).andReturn();
        int status = result.getResponse().getStatus();
        org.junit.jupiter.api.Assertions.assertTrue(
                status == 401 || status == 403, "expected 401 or 403, got " + status);
    }

    @Test
    @DisplayName("GET 목록 — CLIENT 역할 시 403")
    @WithMockUser(roles = {"CLIENT"})
    void list_whenClientRole_returnsForbidden() throws Exception {
        when(tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.ADMIN_SHOP_CATALOG))
                .thenReturn(true);

        mockMvc.perform(get(LIST_PATH)).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PATCH catalog-visible — ADMIN·컴포넌트 활성 시 200")
    @WithMockUser(roles = {"ADMIN"})
    void patchCatalogVisible_whenAdmin_returns200() throws Exception {
        long skuId = 99L;
        when(tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.ADMIN_SHOP_CATALOG))
                .thenReturn(true);

        String body = objectMapper.writeValueAsString(new CatalogVisiblePatchRequest(false));

        mockMvc.perform(
                        patch(LIST_PATH + "/" + skuId + "/catalog-visible")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(adminShopCatalogSkuService).patchCatalogVisible(tenantId, skuId, false);
    }
}
