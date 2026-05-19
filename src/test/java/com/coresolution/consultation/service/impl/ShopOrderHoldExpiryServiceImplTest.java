package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.dto.shop.EffectivePointTenantPolicies;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.service.ClientShopCheckoutService;
import com.coresolution.consultation.service.PointTenantPolicyService;
import com.coresolution.core.service.TenantService;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link ShopOrderHoldExpiryServiceImpl} 단위 검증.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ShopOrderHoldExpiryServiceImpl")
class ShopOrderHoldExpiryServiceImplTest {

    private static final String TENANT = "tenant-hold-expiry";
    private static final String ORDER_ID = "order-expire-1";

    @Mock
    private ShopClientOrderRepository shopClientOrderRepository;
    @Mock
    private PointTenantPolicyService pointTenantPolicyService;
    @Mock
    private ClientShopCheckoutService clientShopCheckoutService;
    @Mock
    private TenantService tenantService;

    @InjectMocks
    private ShopOrderHoldExpiryServiceImpl service;

    @Test
    @DisplayName("만료 대상 주문을 expireOrderHold로 처리")
    void expireStaleHoldsForTenant_expiresTargets() {
        ShopClientOrder order = staleOrder();
        when(pointTenantPolicyService.getEffectivePoliciesTyped(TENANT))
                .thenReturn(policiesWithTtl(30));
        when(shopClientOrderRepository.findHoldExpiredOrders(
                        eq(TENANT),
                        eq(EnumSet.of(ShopClientOrderStatus.CREATED, ShopClientOrderStatus.PENDING_PAYMENT)),
                        any(LocalDateTime.class)))
                .thenReturn(List.of(order));
        when(clientShopCheckoutService.expireOrderHold(TENANT, ORDER_ID)).thenReturn(true);

        int count = service.expireStaleHoldsForTenant(TENANT);

        assertEquals(1, count);
        verify(clientShopCheckoutService).expireOrderHold(TENANT, ORDER_ID);
    }

    @Test
    @DisplayName("이미 종료된 주문은 expireOrderHold false로 카운트 제외")
    void expireStaleHoldsForTenant_idempotentSkip_notCounted() {
        ShopClientOrder order = staleOrder();
        when(pointTenantPolicyService.getEffectivePoliciesTyped(TENANT))
                .thenReturn(policiesWithTtl(30));
        when(shopClientOrderRepository.findHoldExpiredOrders(
                        eq(TENANT),
                        eq(EnumSet.of(ShopClientOrderStatus.CREATED, ShopClientOrderStatus.PENDING_PAYMENT)),
                        any(LocalDateTime.class)))
                .thenReturn(List.of(order));
        when(clientShopCheckoutService.expireOrderHold(TENANT, ORDER_ID)).thenReturn(false);

        assertEquals(0, service.expireStaleHoldsForTenant(TENANT));
    }

    @Test
    @DisplayName("hold_ttl_minutes=0이면 조회·만료 미실행")
    void expireStaleHoldsForTenant_zeroTtl_skips() {
        when(pointTenantPolicyService.getEffectivePoliciesTyped(TENANT))
                .thenReturn(policiesWithTtl(0));

        assertEquals(0, service.expireStaleHoldsForTenant(TENANT));

        verify(shopClientOrderRepository, never()).findHoldExpiredOrders(any(), any(), any());
        verify(clientShopCheckoutService, never()).expireOrderHold(any(), any());
    }

    @Test
    @DisplayName("PAID 등은 repository 조회 대상에서 제외(만료 0건)")
    void expireStaleHoldsForTenant_noStaleOrders_returnsZero() {
        when(pointTenantPolicyService.getEffectivePoliciesTyped(TENANT))
                .thenReturn(policiesWithTtl(30));
        when(shopClientOrderRepository.findHoldExpiredOrders(
                        eq(TENANT),
                        eq(EnumSet.of(ShopClientOrderStatus.CREATED, ShopClientOrderStatus.PENDING_PAYMENT)),
                        any(LocalDateTime.class)))
                .thenReturn(List.of());

        assertEquals(0, service.expireStaleHoldsForTenant(TENANT));
        verify(clientShopCheckoutService, never()).expireOrderHold(any(), any());
    }

    private static EffectivePointTenantPolicies policiesWithTtl(int minutes) {
        return new EffectivePointTenantPolicies(0L, 0L, true, true, 0, 0L, minutes);
    }

    private static ShopClientOrder staleOrder() {
        ShopClientOrder order = ShopClientOrder.builder()
                .publicId(ORDER_ID)
                .clientId(99L)
                .status(ShopClientOrderStatus.PENDING_PAYMENT)
                .subtotalMinor(10_000L)
                .pointsRedeemMinor(1_000L)
                .cashDueMinor(9_000L)
                .checkoutIdempotencyKey("idem-exp")
                .build();
        order.setTenantId(TENANT);
        return order;
    }
}
