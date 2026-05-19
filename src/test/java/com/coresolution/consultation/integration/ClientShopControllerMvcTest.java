package com.coresolution.consultation.integration;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.shop.ShopCatalogSkuResponse;
import com.coresolution.consultation.dto.shop.ShopPointLedgerEntryResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.ClientPointWalletService;
import com.coresolution.consultation.service.ClientShopCartService;
import com.coresolution.consultation.service.ClientShopCatalogService;
import com.coresolution.consultation.service.ClientShopCheckoutService;
import com.coresolution.core.constant.PlatformComponentCodes;
import com.coresolution.core.service.TenantComponentActivationService;
import com.coresolution.integrationtest.shop.ClientShopControllerMvcTestApplication;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * {@link com.coresolution.consultation.controller.ClientShopController} slice MockMvc.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@SpringBootTest(classes = ClientShopControllerMvcTestApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("ClientShopController MockMvc")
class ClientShopControllerMvcTest {

    private static final String BASE = "/api/v1/clients/me/shop";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ClientShopCatalogService clientShopCatalogService;

    @MockBean
    private ClientShopCartService clientShopCartService;

    @MockBean
    private ClientShopCheckoutService clientShopCheckoutService;

    @MockBean
    private ClientPointWalletService clientPointWalletService;

    @MockBean
    private TenantComponentActivationService tenantComponentActivationService;

    private MockHttpSession clientSession(String tenantId, long clientId) {
        User user = new User();
        user.setId(clientId);
        user.setUserId("client-" + clientId);
        user.setTenantId(tenantId);
        user.setRole(UserRole.CLIENT);

        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionConstants.USER_OBJECT, user);
        session.setAttribute(SessionConstants.TENANT_ID, tenantId);
        return session;
    }

    @Test
    @DisplayName("GET catalog — 컴포넌트 활성·SKU 없음 시 200·빈 배열")
    @WithMockUser
    void getCatalog_whenEmpty_returns200() throws Exception {
        String tenantId = UUID.randomUUID().toString();
        when(tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.CLIENT_SHOP))
                .thenReturn(true);
        when(clientShopCatalogService.listVisibleSkus(tenantId)).thenReturn(Collections.emptyList());

        mockMvc.perform(get(BASE + "/catalog").session(clientSession(tenantId, 1L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data").isEmpty());
    }

    @Test
    @DisplayName("GET catalog — SKU 1건 시 200·skuCode")
    @WithMockUser
    void getCatalog_whenHasSkus_returns200() throws Exception {
        String tenantId = UUID.randomUUID().toString();
        ShopCatalogSkuResponse sku = ShopCatalogSkuResponse.builder()
                .skuCode("SKU-P3")
                .title("P3 상품")
                .unitPriceMinor(12_000L)
                .currency("KRW")
                .catalogCategory("CONSULTATION")
                .build();

        when(tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.CLIENT_SHOP))
                .thenReturn(true);
        when(clientShopCatalogService.listVisibleSkus(tenantId)).thenReturn(List.of(sku));

        mockMvc.perform(get(BASE + "/catalog").session(clientSession(tenantId, 2L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].skuCode").value("SKU-P3"))
                .andExpect(jsonPath("$.data[0].unitPriceMinor").value(12_000));
    }

    @Test
    @DisplayName("GET points/ledger — REWARD 활성 시 200")
    @WithMockUser
    void getPointLedger_returns200() throws Exception {
        String tenantId = UUID.randomUUID().toString();
        long clientId = 42L;
        ShopPointLedgerEntryResponse entry = ShopPointLedgerEntryResponse.builder()
                .amountMinor(500L)
                .orderPublicId("ord-ledger-1")
                .build();

        when(tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.CLIENT_REWARD))
                .thenReturn(true);
        when(clientPointWalletService.listRecentLedger(tenantId, clientId, 20)).thenReturn(List.of(entry));

        mockMvc.perform(get(BASE + "/points/ledger").session(clientSession(tenantId, clientId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].amountMinor").value(500))
                .andExpect(jsonPath("$.data[0].orderPublicId").value("ord-ledger-1"));

        verify(clientPointWalletService).listRecentLedger(eq(tenantId), eq(clientId), eq(20));
    }

    @Test
    @DisplayName("GET orders/{id} — 타 tenant 주문 없음 시 400")
    @WithMockUser
    void getOrder_crossTenant_returnsBadRequest() throws Exception {
        String tenantId = UUID.randomUUID().toString();
        long clientId = 7L;
        String orderPublicId = "order-other-tenant";

        when(clientShopCheckoutService.getOrder(tenantId, clientId, orderPublicId))
                .thenThrow(new IllegalArgumentException("주문을 찾을 수 없습니다."));

        mockMvc.perform(
                        get(BASE + "/orders/{orderPublicId}", orderPublicId)
                                .session(clientSession(tenantId, clientId)))
                .andExpect(status().isBadRequest());
    }
}
