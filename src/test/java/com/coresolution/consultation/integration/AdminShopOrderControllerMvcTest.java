package com.coresolution.consultation.integration;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.constant.ShopRefundConstants;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminDetailResponse;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminListQuery;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminListResponse;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminSummaryItem;
import com.coresolution.consultation.dto.shop.admin.ShopOrderExpiryExtendRequest;
import com.coresolution.consultation.dto.shop.admin.ShopOrderExpiryExtensionItem;
import com.coresolution.consultation.service.AdminShopOrderLedgerService;
import com.coresolution.consultation.dto.shop.admin.ShopOrderRefundResponse;
import com.coresolution.consultation.service.AdminShopOrderReconcileService;
import com.coresolution.consultation.service.AdminShopOrderRefundService;
import com.coresolution.consultation.service.AdminShopOrderService;
import java.time.LocalDate;
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
import org.mockito.ArgumentCaptor;
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
    private AdminShopOrderReconcileService adminShopOrderReconcileService;

    @MockBean
    private AdminShopOrderLedgerService adminShopOrderLedgerService;

    @MockBean
    private TenantComponentActivationService tenantComponentActivationService;

    @BeforeEach
    void setTenantContext() {
        tenantId = UUID.randomUUID().toString();
        TenantContextHolder.setTenantId(tenantId);
        when(adminShopOrderLedgerService.enrichDetail(any(), any())).thenAnswer(inv -> inv.getArgument(1));
    }

    @AfterEach
    void clearTenantContext() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("GET 목록 — ADMIN·컴포넌트 활성 시 200 · page/size/segment · counts")
    @WithMockUser(roles = {"ADMIN"})
    void list_whenAdminAndComponentActive_returns200() throws Exception {
        when(tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.ADMIN_SHOP_CATALOG))
                .thenReturn(true);
        when(adminShopOrderLedgerService.listOrders(eq(tenantId), any(ShopOrderAdminListQuery.class)))
                .thenReturn(ShopOrderAdminListResponse.builder()
                        .orders(List.of(ShopOrderAdminSummaryItem.builder()
                                .orderPublicId(ORDER_ID)
                                .status(ShopClientOrderStatus.PAID)
                                .subtotalMinor(10_000L)
                                .pointsRedeemMinor(1_000L)
                                .cashDueMinor(9_000L)
                                .clientId(42L)
                                .clientName("김내담")
                                .productTitle("10회기")
                                .sessionCount(10)
                                .ledgerState("EXPIRING_SOON")
                                .daysLeft(3L)
                                .createdAt(LocalDateTime.parse("2026-05-19T10:00:00"))
                                .paymentSource(com.coresolution.consultation.dto.PaymentSource.ONLINE)
                                .build()))
                        .totalElements(1L)
                        .page(0)
                        .size(20)
                        .build());

        mockMvc.perform(get(LIST_PATH).param("page", "0").param("size", "20")
                        .param("segment", "EXPIRING_SOON").param("from", "2026-05-01").param("q", "김"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orders[0].orderPublicId").value(ORDER_ID))
                .andExpect(jsonPath("$.data.orders[0].clientName").value("김내담"))
                .andExpect(jsonPath("$.data.orders[0].productTitle").value("10회기"))
                .andExpect(jsonPath("$.data.orders[0].sessionCount").value(10))
                .andExpect(jsonPath("$.data.orders[0].ledgerState").value("EXPIRING_SOON"))
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.page").value(0))
                .andExpect(jsonPath("$.data.size").value(20));

        ArgumentCaptor<ShopOrderAdminListQuery> captor = ArgumentCaptor.forClass(ShopOrderAdminListQuery.class);
        verify(adminShopOrderLedgerService).listOrders(eq(tenantId), captor.capture());
        org.junit.jupiter.api.Assertions.assertEquals("EXPIRING_SOON", captor.getValue().segment());
        org.junit.jupiter.api.Assertions.assertEquals(LocalDate.parse("2026-05-01"), captor.getValue().from());
        org.junit.jupiter.api.Assertions.assertEquals("김", captor.getValue().query());
        verify(adminShopOrderService, never()).listRecentOrders(any(), any());
    }

    @Test
    @DisplayName("GET 목록 — legacy limit 호환 (page=0, size=limit)")
    @WithMockUser(roles = {"ADMIN"})
    void list_whenLegacyLimit_returnsPagedEnvelope() throws Exception {
        when(tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.ADMIN_SHOP_CATALOG))
                .thenReturn(true);
        when(adminShopOrderLedgerService.listOrders(eq(tenantId), any(ShopOrderAdminListQuery.class)))
                .thenAnswer(inv -> {
                    ShopOrderAdminListQuery q = inv.getArgument(1);
                    return ShopOrderAdminListResponse.builder()
                            .orders(List.of())
                            .totalElements(0L)
                            .page(q.page())
                            .size(q.size())
                            .build();
                });

        mockMvc.perform(get(LIST_PATH).param("limit", "30"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orders").isArray())
                .andExpect(jsonPath("$.data.totalElements").value(0))
                .andExpect(jsonPath("$.data.page").value(0))
                .andExpect(jsonPath("$.data.size").value(30));
    }

    @Test
    @DisplayName("POST expiry-extensions — ADMIN 은 200·이력 반환")
    @WithMockUser(roles = {"ADMIN"})
    void extendExpiry_whenAdmin_returns200() throws Exception {
        when(tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.ADMIN_SHOP_CATALOG))
                .thenReturn(true);
        when(adminShopOrderLedgerService.extendExpiry(
                        eq(tenantId), eq(ORDER_ID), any(ShopOrderExpiryExtendRequest.class), any()))
                .thenReturn(List.of(ShopOrderExpiryExtensionItem.builder()
                        .id(1L)
                        .previousExpireDate(LocalDate.parse("2026-06-01"))
                        .newExpireDate(LocalDate.parse("2026-07-01"))
                        .reason("입원 치료")
                        .build()));

        mockMvc.perform(post(LIST_PATH + "/{orderPublicId}/expiry-extensions", ORDER_ID)
                        .contentType(APPLICATION_JSON)
                        .content("{\"newExpireDate\":\"2026-07-01\",\"reason\":\"입원 치료\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].newExpireDate").value("2026-07-01"))
                .andExpect(jsonPath("$.data[0].reason").value("입원 치료"));
    }

    @Test
    @DisplayName("POST expiry-extensions — 사유 누락 시 400·서비스 미호출")
    @WithMockUser(roles = {"ADMIN"})
    void extendExpiry_whenReasonBlank_returns400() throws Exception {
        when(tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.ADMIN_SHOP_CATALOG))
                .thenReturn(true);

        mockMvc.perform(post(LIST_PATH + "/{orderPublicId}/expiry-extensions", ORDER_ID)
                        .contentType(APPLICATION_JSON)
                        .content("{\"newExpireDate\":\"2026-07-01\",\"reason\":\" \"}"))
                .andExpect(status().isBadRequest());

        verify(adminShopOrderLedgerService, never()).extendExpiry(any(), any(), any(), any());
    }

    @Test
    @DisplayName("POST expiry-extensions — STAFF 는 403")
    @WithMockUser(roles = {"STAFF"})
    void extendExpiry_whenStaff_returns403() throws Exception {
        when(tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.ADMIN_SHOP_CATALOG))
                .thenReturn(true);

        mockMvc.perform(post(LIST_PATH + "/{orderPublicId}/expiry-extensions", ORDER_ID)
                        .contentType(APPLICATION_JSON)
                        .content("{\"newExpireDate\":\"2026-07-01\",\"reason\":\"입원 치료\"}"))
                .andExpect(status().isForbidden());

        verify(adminShopOrderLedgerService, never()).extendExpiry(any(), any(), any(), any());
    }

    @Test
    @DisplayName("GET expiry-extensions — STAFF 도 조회 200")
    @WithMockUser(roles = {"STAFF"})
    void listExpiryExtensions_whenStaff_returns200() throws Exception {
        when(tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.ADMIN_SHOP_CATALOG))
                .thenReturn(true);
        when(adminShopOrderLedgerService.listExpiryExtensions(tenantId, ORDER_ID)).thenReturn(List.of());

        mockMvc.perform(get(LIST_PATH + "/{orderPublicId}/expiry-extensions", ORDER_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
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

    @Test
    @DisplayName("DELETE 주문 — ADMIN·컴포넌트 활성 시 200·softDelete 호출")
    @WithMockUser(roles = {"ADMIN"})
    void softDelete_whenAdminAndComponentActive_returns200() throws Exception {
        when(tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.ADMIN_SHOP_CATALOG))
                .thenReturn(true);

        mockMvc.perform(delete(LIST_PATH + "/{orderPublicId}", ORDER_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(adminShopOrderService).softDeleteOrder(tenantId, ORDER_ID);
    }

    @Test
    @DisplayName("POST repair-deposit-income — ADMIN·컴포넌트 활성 시 200·repairDepositIncome 호출")
    @WithMockUser(roles = {"ADMIN"})
    void repairDepositIncome_whenAdminAndComponentActive_returns200() throws Exception {
        when(tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.ADMIN_SHOP_CATALOG))
                .thenReturn(true);
        when(adminShopOrderService.repairDepositIncome(tenantId, ORDER_ID))
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

        mockMvc.perform(post(LIST_PATH + "/{orderPublicId}/repair-deposit-income", ORDER_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderPublicId").value(ORDER_ID));

        verify(adminShopOrderService).repairDepositIncome(tenantId, ORDER_ID);
    }

    @Test
    @DisplayName("POST reconcile-refund — ADMIN·컴포넌트 활성 시 200 (force=false 기본)")
    @WithMockUser(roles = {"ADMIN"})
    void reconcileRefund_whenAdminAndComponentActive_returns200() throws Exception {
        when(tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.ADMIN_SHOP_CATALOG))
                .thenReturn(true);
        when(adminShopOrderReconcileService.reconcileRefund(eq(tenantId), eq(ORDER_ID), eq(false)))
                .thenReturn(com.coresolution.consultation.dto.shop.admin.ShopOrderReconcilePaymentResponse.builder()
                        .orderPublicId(ORDER_ID)
                        .paymentId("PAY_1789818725351_bc1211bf")
                        .orderStatus(ShopClientOrderStatus.REFUNDED)
                        .paymentStatus(com.coresolution.consultation.entity.Payment.PaymentStatus.REFUNDED)
                        .recovered(true)
                        .build());

        mockMvc.perform(post(LIST_PATH + "/{orderPublicId}/reconcile-refund", ORDER_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderStatus").value("REFUNDED"))
                .andExpect(jsonPath("$.data.paymentStatus").value("REFUNDED"))
                .andExpect(jsonPath("$.data.recovered").value(true));

        verify(adminShopOrderReconcileService).reconcileRefund(tenantId, ORDER_ID, false);
    }

    @Test
    @DisplayName("POST reconcile-refund?force=true — ADMIN·컴포넌트 활성 시 200")
    @WithMockUser(roles = {"ADMIN"})
    void reconcileRefund_forceTrue_whenAdminAndComponentActive_returns200() throws Exception {
        when(tenantComponentActivationService.isComponentActive(tenantId, PlatformComponentCodes.ADMIN_SHOP_CATALOG))
                .thenReturn(true);
        when(adminShopOrderReconcileService.reconcileRefund(eq(tenantId), eq(ORDER_ID), eq(true)))
                .thenReturn(com.coresolution.consultation.dto.shop.admin.ShopOrderReconcilePaymentResponse.builder()
                        .orderPublicId(ORDER_ID)
                        .paymentId("PAY_1789818725351_bc1211bf")
                        .orderStatus(ShopClientOrderStatus.REFUNDED)
                        .paymentStatus(com.coresolution.consultation.entity.Payment.PaymentStatus.REFUNDED)
                        .recovered(true)
                        .build());

        mockMvc.perform(post(LIST_PATH + "/{orderPublicId}/reconcile-refund", ORDER_ID)
                        .param("force", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderStatus").value("REFUNDED"))
                .andExpect(jsonPath("$.data.recovered").value(true));

        verify(adminShopOrderReconcileService).reconcileRefund(tenantId, ORDER_ID, true);
    }
}
