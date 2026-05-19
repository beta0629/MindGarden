package com.coresolution.consultation.integration;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.constant.ShopRefundConstants;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminDetailResponse;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminSummaryItem;
import com.coresolution.consultation.dto.shop.admin.ShopOrderRefundResponse;
import com.coresolution.consultation.service.AdminShopOrderRefundService;
import com.coresolution.consultation.service.AdminShopOrderService;
import java.time.LocalDateTime;
import java.util.List;
import com.coresolution.core.constant.PlatformComponentCodes;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.TenantComponentActivationService;
import com.coresolution.integrationtest.shop.AdminShopOrderControllerMvcTestApplication;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * {@link com.coresolution.consultation.controller.AdminShopOrderController} slice MockMvc.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@SpringBootTest(classes = AdminShopOrderControllerMvcTestApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("AdminShopOrderController MockMvc")
class AdminShopOrderControllerMvcTest {

    private static final String ORDER_ID = "order-mvc-refund-1";
    private static final String LIST_PATH = "/api/v1/admin/shop/orders";

    private String tenantId;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AdminShopOrderService adminShopOrderService;

    @MockBean
    private AdminShopOrderRefundService adminShopOrderRefundService;

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
    @DisplayName("GET 목록 — ADMIN·컴포넌트 활성 시 200")
    @WithMockUser(roles = {"ADMIN"})
    void list_whenAdminAndComponentActive_returns200() throws Exception {
        when(tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.ADMIN_SHOP_CATALOG))
                .thenReturn(true);
        when(adminShopOrderService.listRecentOrders(tenantId, 50))
                .thenReturn(List.of(ShopOrderAdminSummaryItem.builder()
                        .orderPublicId(ORDER_ID)
                        .status(ShopClientOrderStatus.PAID)
                        .subtotalMinor(10_000L)
                        .pointsRedeemMinor(1_000L)
                        .cashDueMinor(9_000L)
                        .clientId(42L)
                        .createdAt(LocalDateTime.parse("2026-05-19T10:00:00"))
                        .build()));

        mockMvc.perform(get(LIST_PATH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].orderPublicId").value(ORDER_ID))
                .andExpect(jsonPath("$.data[0].status").value("PAID"));

        verify(adminShopOrderService).listRecentOrders(tenantId, 50);
    }

    @Test
    @DisplayName("GET 상세 — ADMIN·컴포넌트 활성 시 200")
    @WithMockUser(roles = {"ADMIN"})
    void get_whenAdminAndComponentActive_returns200() throws Exception {
        when(tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.ADMIN_SHOP_CATALOG))
                .thenReturn(true);
        when(adminShopOrderService.getOrderDetail(tenantId, ORDER_ID))
                .thenReturn(ShopOrderAdminDetailResponse.builder()
                        .orderPublicId(ORDER_ID)
                        .status(ShopClientOrderStatus.PAID)
                        .subtotalMinor(10_000L)
                        .pointsRedeemMinor(0L)
                        .cashDueMinor(10_000L)
                        .clientId(42L)
                        .createdAt(LocalDateTime.parse("2026-05-19T10:00:00"))
                        .lines(List.of())
                        .fulfillmentEvents(List.of())
                        .build());

        mockMvc.perform(get(LIST_PATH + "/{orderPublicId}", ORDER_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderPublicId").value(ORDER_ID));

        verify(adminShopOrderService).getOrderDetail(tenantId, ORDER_ID);
    }

    @Test
    @DisplayName("POST refund — ADMIN·컴포넌트 활성 시 200·REFUNDED")
    @WithMockUser(roles = {"ADMIN"})
    void refund_whenAdminAndComponentActive_returns200() throws Exception {
        when(tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.ADMIN_SHOP_CATALOG))
                .thenReturn(true);
        when(adminShopOrderRefundService.refundPaidOrder(
                        eq(tenantId), eq(ORDER_ID), eq(ShopRefundConstants.REASON_CUSTOMER_REQUEST)))
                .thenReturn(ShopOrderRefundResponse.builder()
                        .orderPublicId(ORDER_ID)
                        .status(ShopClientOrderStatus.REFUNDED)
                        .reasonCode(ShopRefundConstants.REASON_CUSTOMER_REQUEST)
                        .pointsRestoredMinor(1_000L)
                        .pointsClawedBackMinor(50L)
                        .pgRefundStatus(ShopRefundConstants.PG_REFUND_STATUS_COMPLETED)
                        .build());

        mockMvc.perform(post("/api/v1/admin/shop/orders/{orderPublicId}/refund", ORDER_ID)
                        .contentType(APPLICATION_JSON)
                        .content("{\"reasonCode\":\"" + ShopRefundConstants.REASON_CUSTOMER_REQUEST + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("REFUNDED"))
                .andExpect(jsonPath("$.data.pointsRestoredMinor").value(1000))
                .andExpect(jsonPath("$.data.pointsClawedBackMinor").value(50));

        verify(adminShopOrderRefundService).refundPaidOrder(
                tenantId, ORDER_ID, ShopRefundConstants.REASON_CUSTOMER_REQUEST);
    }
}
