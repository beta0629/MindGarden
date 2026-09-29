package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ShopAdminOrderLedgerConstants;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.constant.ShopOrderExpiryConstants;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminListQuery;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminListResponse;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminSummaryItem;
import com.coresolution.consultation.dto.shop.admin.ShopOrderExpiryExtendRequest;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.entity.ShopClientOrderLine;
import com.coresolution.consultation.entity.ShopOrderExpiryExtension;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopClientOrderLineRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.repository.ShopOrderExpiryExtensionRepository;
import com.coresolution.consultation.repository.ShopOrderFulfillmentEventRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminShopOrderLedgerServiceImpl — 주문 장부·사용 기한·연장")
class AdminShopOrderLedgerServiceImplTest {

    private static final String TENANT = "tenant-ledger";
    private static final ZoneId ZONE = ZoneId.systemDefault();
    private static final LocalDate TODAY = LocalDate.of(2026, 12, 24);

    @Mock
    private ShopClientOrderRepository shopClientOrderRepository;
    @Mock
    private ShopClientOrderLineRepository shopClientOrderLineRepository;
    @Mock
    private ShopOrderFulfillmentEventRepository shopOrderFulfillmentEventRepository;
    @Mock
    private ShopOrderExpiryExtensionRepository shopOrderExpiryExtensionRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PersonalDataEncryptionUtil personalDataEncryptionUtil;

    @InjectMocks
    private AdminShopOrderLedgerServiceImpl service;

    @BeforeEach
    void setUp() {
        service.setClock(Clock.fixed(TODAY.atStartOfDay(ZONE).toInstant(), ZONE));
        lenient().when(userRepository.findAllById(any())).thenReturn(List.of());
    }

    private static ShopClientOrder order(Long id, String publicId, ShopClientOrderStatus status, long amount) {
        ShopClientOrder o = ShopClientOrder.builder()
                .publicId(publicId)
                .clientId(7L)
                .status(status)
                .subtotalMinor(amount)
                .pointsRedeemMinor(0L)
                .cashDueMinor(amount)
                .build();
        o.setId(id);
        o.setTenantId(TENANT);
        o.setCreatedAt(LocalDateTime.of(2026, 9, 28, 10, 0));
        return o;
    }

    private static ShopClientOrderLine line(ShopClientOrder o, int sessions, Integer months) {
        ShopClientOrderLine l = ShopClientOrderLine.builder()
                .clientOrder(o)
                .lineNo(1)
                .titleSnapshot("10회기")
                .sessionCountSnapshot(sessions)
                .validityMonthsSnapshot(months)
                .quantity(1)
                .build();
        l.setTenantId(TENANT);
        return l;
    }

    private static Payment payment(String orderId, LocalDateTime approvedAt) {
        Payment p = Payment.builder()
                .orderId(orderId)
                .amount(BigDecimal.valueOf(100_000L))
                .status(Payment.PaymentStatus.APPROVED)
                .approvedAt(approvedAt)
                .build();
        p.setTenantId(TENANT);
        return p;
    }

    @Test
    @DisplayName("resolveLedgerState — 결제 완료·만료 임박·기한 만료·정합 필요·환불·미결제·대기를 한 상태로 나눈다")
    void resolveLedgerState_partitions() {
        assertEquals(ShopAdminOrderLedgerConstants.STATE_PAID, AdminShopOrderLedgerServiceImpl.resolveLedgerState(
                ShopClientOrderStatus.PAID, null, false, ShopOrderExpiryConstants.STATE_ACTIVE));
        assertEquals(ShopAdminOrderLedgerConstants.STATE_EXPIRING_SOON,
                AdminShopOrderLedgerServiceImpl.resolveLedgerState(
                        ShopClientOrderStatus.PAID, null, false, ShopOrderExpiryConstants.STATE_EXPIRING_SOON));
        assertEquals(ShopAdminOrderLedgerConstants.STATE_EXPIRED, AdminShopOrderLedgerServiceImpl.resolveLedgerState(
                ShopClientOrderStatus.PAID, null, false, ShopOrderExpiryConstants.STATE_EXPIRED));
        assertEquals(ShopAdminOrderLedgerConstants.STATE_RECONCILE,
                AdminShopOrderLedgerServiceImpl.resolveLedgerState(
                        ShopClientOrderStatus.PAID, null, true, ShopOrderExpiryConstants.STATE_EXPIRED));
        assertEquals(ShopAdminOrderLedgerConstants.STATE_REFUNDED, AdminShopOrderLedgerServiceImpl.resolveLedgerState(
                ShopClientOrderStatus.REFUNDED, null, false, ShopOrderExpiryConstants.STATE_NONE));
        assertEquals(ShopAdminOrderLedgerConstants.STATE_UNPAID, AdminShopOrderLedgerServiceImpl.resolveLedgerState(
                ShopClientOrderStatus.EXPIRED, null, false, ShopOrderExpiryConstants.STATE_NONE));
        assertEquals(ShopAdminOrderLedgerConstants.STATE_PENDING, AdminShopOrderLedgerServiceImpl.resolveLedgerState(
                ShopClientOrderStatus.PENDING_PAYMENT, null, false, ShopOrderExpiryConstants.STATE_NONE));
    }

    @Test
    @DisplayName("summarize — 돈은 만료 포함, 회기는 활성만 · 만료 회기는 별도")
    void summarize_followsLedgerRules() {
        List<ShopOrderAdminSummaryItem> items = List.of(
                summary(ShopAdminOrderLedgerConstants.STATE_PAID, 100_000L, 10),
                summary(ShopAdminOrderLedgerConstants.STATE_EXPIRING_SOON, 90_000L, 1),
                summary(ShopAdminOrderLedgerConstants.STATE_EXPIRED, 90_000L, 1),
                summary(ShopAdminOrderLedgerConstants.STATE_REFUNDED, 50_000L, 1),
                summary(ShopAdminOrderLedgerConstants.STATE_PENDING, 70_000L, 5),
                summary(ShopAdminOrderLedgerConstants.STATE_UNPAID, 70_000L, 5));

        var s = AdminShopOrderLedgerServiceImpl.summarize(items);

        assertEquals(280_000L, s.getInAmount());
        assertEquals(3L, s.getInCount());
        assertEquals(11L, s.getInSessions());
        assertEquals(1L, s.getExpiredSessions());
        assertEquals(50_000L, s.getOutAmount());
        assertEquals(1L, s.getOutSessions());
        assertEquals(1L, s.getPendingCount());
        assertEquals(1L, s.getExpiringSoonCount());
        assertEquals(230_000L, s.getNetAmount());
    }

    private static ShopOrderAdminSummaryItem summary(String state, long amount, int sessions) {
        return ShopOrderAdminSummaryItem.builder()
                .ledgerState(state)
                .amountMinor(amount)
                .sessionCount(sessions)
                .pointsRedeemMinor(0L)
                .build();
    }

    @Test
    @DisplayName("listOrders — 배치 조회·세그먼트 필터·counts·page/size (행별 상세 조회 없음)")
    void listOrders_batchesAndSegments() {
        ShopClientOrder soon = order(1L, "order-soon", ShopClientOrderStatus.PAID, 100_000L);
        ShopClientOrder legacy = order(2L, "order-legacy", ShopClientOrderStatus.PAID, 90_000L);
        when(shopClientOrderRepository.findLedgerByTenantInRange(eq(TENANT), any(), any()))
                .thenReturn(List.of(soon, legacy));
        when(shopClientOrderLineRepository.findByTenantIdAndClientOrderPublicIdInAndIsDeletedFalseOrderByIdDesc(
                eq(TENANT), anyList()))
                .thenReturn(List.of(line(soon, 10, 3), line(legacy, 1, null)));
        when(paymentRepository.findByTenantIdAndOrderIdInAndIsDeletedFalse(eq(TENANT), anyList()))
                .thenReturn(List.of(payment("order-soon", LocalDateTime.of(2026, 9, 28, 10, 5))));
        when(shopOrderFulfillmentEventRepository.findByTenantIdAndOrderPublicIdInAndIsDeletedFalse(
                eq(TENANT), anyCollection())).thenReturn(List.of());
        when(shopOrderExpiryExtensionRepository.findByTenantIdAndOrderPublicIdInAndIsDeletedFalse(
                eq(TENANT), anyCollection())).thenReturn(List.of());

        ShopOrderAdminListResponse res = service.listOrders(TENANT, new ShopOrderAdminListQuery(
                0, 20, ShopAdminOrderLedgerConstants.STATE_EXPIRING_SOON, null, null, null));

        assertEquals(1L, res.getTotalElements());
        ShopOrderAdminSummaryItem item = res.getOrders().get(0);
        assertEquals("order-soon", item.getOrderPublicId());
        assertEquals(LocalDate.of(2026, 12, 28), item.getExpireDate());
        assertEquals(4L, item.getDaysLeft());
        assertEquals(10, item.getSessionCount());
        assertEquals("10회기", item.getProductTitle());
        assertEquals(2L, res.getCounts().get(ShopAdminOrderLedgerConstants.SEGMENT_ALL));
        assertEquals(1L, res.getCounts().get(ShopAdminOrderLedgerConstants.STATE_PAID));
        assertEquals(1L, res.getCounts().get(ShopAdminOrderLedgerConstants.STATE_EXPIRING_SOON));
        verify(shopClientOrderRepository, never()).findByTenantIdAndPublicId(any(), any());
    }

    @Test
    @DisplayName("extendExpiry — 사유·새 만료일 검증 후 이력 INSERT 만 (주문·결제 저장 없음)")
    void extendExpiry_insertsHistoryOnly() {
        ShopClientOrder o = order(1L, "order-x", ShopClientOrderStatus.PAID, 100_000L);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, "order-x")).thenReturn(Optional.of(o));
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(1L))
                .thenReturn(List.of(line(o, 10, 3)));
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, "order-x"))
                .thenReturn(List.of(payment("order-x", LocalDateTime.of(2026, 9, 28, 10, 5))));
        when(shopOrderExpiryExtensionRepository
                .findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderByCreatedAtDescIdDesc(TENANT, "order-x"))
                .thenReturn(List.of());

        service.extendExpiry(TENANT, "order-x",
                new ShopOrderExpiryExtendRequest(LocalDate.of(2027, 1, 28), " 입원 치료 "), 99L);

        ArgumentCaptor<ShopOrderExpiryExtension> captor = ArgumentCaptor.forClass(ShopOrderExpiryExtension.class);
        verify(shopOrderExpiryExtensionRepository).save(captor.capture());
        ShopOrderExpiryExtension saved = captor.getValue();
        assertEquals(LocalDate.of(2026, 12, 28), saved.getPreviousExpireDate());
        assertEquals(LocalDate.of(2027, 1, 28), saved.getNewExpireDate());
        assertEquals("입원 치료", saved.getReason());
        assertEquals(99L, saved.getExtendedByUserId());
        assertEquals(TENANT, saved.getTenantId());
        verify(shopClientOrderRepository, never()).save(any());
        verify(paymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("extendExpiry — 새 만료일이 현재 만료일 이하면 거절")
    void extendExpiry_rejectsNotAfterCurrent() {
        ShopClientOrder o = order(1L, "order-x", ShopClientOrderStatus.PAID, 100_000L);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, "order-x")).thenReturn(Optional.of(o));
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(1L))
                .thenReturn(List.of(line(o, 10, 3)));
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, "order-x"))
                .thenReturn(List.of(payment("order-x", LocalDateTime.of(2026, 9, 28, 10, 5))));
        when(shopOrderExpiryExtensionRepository
                .findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderByCreatedAtDescIdDesc(TENANT, "order-x"))
                .thenReturn(List.of());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.extendExpiry(
                TENANT, "order-x", new ShopOrderExpiryExtendRequest(LocalDate.of(2026, 12, 28), "사유"), 1L));
        assertEquals(ShopOrderExpiryConstants.MSG_EXTEND_DATE_NOT_AFTER_CURRENT, ex.getMessage());
        verify(shopOrderExpiryExtensionRepository, never()).save(any());
    }

    @Test
    @DisplayName("extendExpiry — 사유 공백·기한 없는 주문·미결제 주문은 거절")
    void extendExpiry_rejectsInvalid() {
        ShopClientOrder noSnapshot = order(1L, "order-old", ShopClientOrderStatus.PAID, 100_000L);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, "order-old"))
                .thenReturn(Optional.of(noSnapshot));
        assertEquals(ShopOrderExpiryConstants.MSG_EXTEND_REASON_REQUIRED, assertThrows(
                IllegalArgumentException.class, () -> service.extendExpiry(TENANT, "order-old",
                        new ShopOrderExpiryExtendRequest(LocalDate.of(2027, 1, 1), "  "), 1L)).getMessage());

        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(1L))
                .thenReturn(List.of(line(noSnapshot, 10, null)));
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, "order-old")).thenReturn(List.of());
        when(shopOrderExpiryExtensionRepository
                .findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderByCreatedAtDescIdDesc(TENANT, "order-old"))
                .thenReturn(List.of());
        assertEquals(ShopOrderExpiryConstants.MSG_EXTEND_NO_EXPIRY, assertThrows(
                IllegalArgumentException.class, () -> service.extendExpiry(TENANT, "order-old",
                        new ShopOrderExpiryExtendRequest(LocalDate.of(2027, 1, 1), "사유"), 1L)).getMessage());

        ShopClientOrder refunded = order(2L, "order-ref", ShopClientOrderStatus.REFUNDED, 100_000L);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, "order-ref"))
                .thenReturn(Optional.of(refunded));
        assertEquals(ShopOrderExpiryConstants.MSG_EXTEND_NOT_PAID, assertThrows(
                IllegalArgumentException.class, () -> service.extendExpiry(TENANT, "order-ref",
                        new ShopOrderExpiryExtendRequest(LocalDate.of(2027, 1, 1), "사유"), 1L)).getMessage());
        verify(shopOrderExpiryExtensionRepository, never()).save(any());
    }

    @Test
    @DisplayName("extendExpiry — 기한 만료 주문은 오늘 이후 날짜로 연장하면 다시 사용 가능")
    void extendExpiry_expiredOrder_afterToday() {
        ShopClientOrder o = order(1L, "order-exp", ShopClientOrderStatus.PAID, 100_000L);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, "order-exp")).thenReturn(Optional.of(o));
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(1L))
                .thenReturn(List.of(line(o, 10, 1)));
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, "order-exp"))
                .thenReturn(List.of(payment("order-exp", LocalDateTime.of(2026, 9, 28, 10, 5))));
        when(shopOrderExpiryExtensionRepository
                .findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderByCreatedAtDescIdDesc(TENANT, "order-exp"))
                .thenReturn(List.of());

        assertEquals(ShopOrderExpiryConstants.MSG_EXTEND_DATE_NOT_AFTER_TODAY, assertThrows(
                IllegalArgumentException.class, () -> service.extendExpiry(TENANT, "order-exp",
                        new ShopOrderExpiryExtendRequest(TODAY, "사유"), 1L)).getMessage());

        service.extendExpiry(TENANT, "order-exp", new ShopOrderExpiryExtendRequest(TODAY.plusDays(1), "사유"), 1L);
        ArgumentCaptor<ShopOrderExpiryExtension> captor = ArgumentCaptor.forClass(ShopOrderExpiryExtension.class);
        verify(shopOrderExpiryExtensionRepository).save(captor.capture());
        assertTrue(captor.getValue().getNewExpireDate().isAfter(TODAY));
        assertEquals(LocalDate.of(2026, 10, 28), captor.getValue().getPreviousExpireDate());
    }
}
