package com.coresolution.consultation.service.impl;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ShopClientOrderLineRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.MobilePushDispatchService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link ShopNotificationHelperImpl} 단위 검증.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ShopNotificationHelperImpl")
class ShopNotificationHelperImplTest {

    private static final String TENANT = "tenant-shop";
    private static final String ORDER_ID = "ord-pub-1";
    private static final Long CLIENT_ID = 10L;
    private static final Long CONSULTANT_ID = 20L;

    @Mock
    private MobilePushDispatchService mobilePushDispatchService;
    @Mock
    private ConsultationMessageService consultationMessageService;
    @Mock
    private CommonCodeService commonCodeService;
    @Mock
    private ShopClientOrderLineRepository shopClientOrderLineRepository;
    @Mock
    private ConsultantClientMappingRepository consultantClientMappingRepository;

    @InjectMocks
    private ShopNotificationHelperImpl helper;

    @Test
    @DisplayName("notifyOrderPaid — 푸시 1회")
    void notifyOrderPaid_dispatchesPush() {
        ShopClientOrder order = order(50_000L);
        helper.notifyOrderPaid(TENANT, order);
        verify(mobilePushDispatchService)
                .dispatchShopOrderPaid(TENANT, CLIENT_ID, ORDER_ID, 50_000L);
    }

    @Test
    @DisplayName("notifyPointEarned — earn>0일 때만 푸시")
    void notifyPointEarned_dispatchesWhenPositive() {
        helper.notifyPointEarned(TENANT, order(10_000L), 500L);
        verify(mobilePushDispatchService).dispatchPointEarned(TENANT, CLIENT_ID, ORDER_ID, 500L);
        verify(mobilePushDispatchService, never()).dispatchPointEarned(eq(TENANT), eq(CLIENT_ID), eq(ORDER_ID), eq(0L));
    }

    @Test
    @DisplayName("notifyPointEarned — 0이면 스킵")
    void notifyPointEarned_skipsZero() {
        helper.notifyPointEarned(TENANT, order(10_000L), 0L);
        verify(mobilePushDispatchService, never()).dispatchPointEarned(any(), any(), any(), any(Long.class));
    }

    @Test
    @DisplayName("notifyFulfillmentCompleted — 상담사 푸시 포함")
    void notifyFulfillmentCompleted_includesConsultant() {
        ShopClientOrder order = order(10_000L);
        helper.notifyFulfillmentCompleted(TENANT, order, CONSULTANT_ID, "SKU-1");
        verify(mobilePushDispatchService)
                .dispatchShopFulfillmentCompleted(TENANT, CLIENT_ID, CONSULTANT_ID, ORDER_ID, "SKU-1");
    }

    @Test
    @DisplayName("notifyPaymentFailed — S2 푸시 1회")
    void notifyPaymentFailed_dispatchesPush() {
        helper.notifyPaymentFailed(TENANT, order(10_000L));
        verify(mobilePushDispatchService).dispatchShopPaymentFailed(TENANT, CLIENT_ID, ORDER_ID);
    }

    @Test
    @DisplayName("notifyOrderHoldExpired — S4 푸시 1회")
    void notifyOrderHoldExpired_dispatchesPush() {
        helper.notifyOrderHoldExpired(TENANT, order(10_000L));
        verify(mobilePushDispatchService).dispatchShopOrderHoldExpired(TENANT, CLIENT_ID, ORDER_ID);
    }

    @Test
    @DisplayName("notifyOrderRefunded — S5 푸시·환불액")
    void notifyOrderRefunded_dispatchesPush() {
        ShopClientOrder order = order(25_000L);
        helper.notifyOrderRefunded(TENANT, order);
        verify(mobilePushDispatchService)
                .dispatchShopOrderRefunded(TENANT, CLIENT_ID, ORDER_ID, 25_000L);
    }

    private static ShopClientOrder order(long subtotal) {
        ShopClientOrder o = new ShopClientOrder();
        o.setTenantId(TENANT);
        o.setPublicId(ORDER_ID);
        o.setClientId(CLIENT_ID);
        o.setSubtotalMinor(subtotal);
        return o;
    }
}
