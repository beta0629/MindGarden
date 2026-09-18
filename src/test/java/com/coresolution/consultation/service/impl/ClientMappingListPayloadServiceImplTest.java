package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.entity.Consultant;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.entity.ShopClientOrderLine;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopClientOrderLineRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * ClientMappingListPayloadServiceImpl — money-path SSOT 보강 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-09-17
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ClientMappingListPayloadService — mappings/client money-path 보강")
class ClientMappingListPayloadServiceImplTest {

    private static final String TENANT_ID = "tenant-client-mapping-payload-" + UUID.randomUUID();

    @Mock
    private ShopClientOrderLineRepository shopClientOrderLineRepository;
    @Mock
    private ShopClientOrderRepository shopClientOrderRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private UserPersonalDataCacheService userPersonalDataCacheService;

    @InjectMocks
    private ClientMappingListPayloadServiceImpl service;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("productTitle/lineTotal/pgAmount/effectivePaymentStatus 보강 + CREDIT_CARD 유지")
    void enrichsMoneyPathFields_andKeepsCanonicalCreditCardMethod() {
        Long mappingId = 101L;
        String orderId = "shop-order-public-" + UUID.randomUUID();

        Consultant consultant = new Consultant();
        consultant.setId(55L);
        consultant.setName("encrypted-name");
        consultant.setSpecialization("상담");

        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .packageName("무료1회")
                .packagePrice(10_000L)
                .paymentAmount(100_000L)
                .paymentStatus(ConsultantClientMapping.PaymentStatus.CONFIRMED)
                .paymentMethod("CREDIT_CARD")
                .paymentReference(orderId)
                .totalSessions(1)
                .usedSessions(0)
                .remainingSessions(1)
                .consultant(consultant)
                .build();
        mapping.setId(mappingId);
        mapping.setTenantId(TENANT_ID);

        ShopClientOrder order = ShopClientOrder.builder()
                .publicId(orderId)
                .clientId(20L)
                .status(ShopClientOrderStatus.REFUNDED)
                .subtotalMinor(100_000L)
                .cashDueMinor(100_000L)
                .checkoutIdempotencyKey("key-" + orderId)
                .build();
        order.setTenantId(TENANT_ID);

        ShopClientOrderLine line = ShopClientOrderLine.builder()
                .clientOrder(order)
                .titleSnapshot("Welcome 패키지")
                .lineTotalMinor(100_000L)
                .consultantClientMappingId(mappingId)
                .lineNo(1)
                .skuCodeSnapshot("SKU-1")
                .unitPriceMinor(100_000L)
                .quantity(1)
                .build();
        line.setId(9001L);
        line.setTenantId(TENANT_ID);

        Payment payment = Payment.builder()
                .orderId(orderId)
                .amount(BigDecimal.valueOf(100_000L))
                .status(Payment.PaymentStatus.REFUNDED)
                .provider(Payment.PaymentProvider.IAMPORT)
                .build();
        payment.setId(1L);
        payment.setTenantId(TENANT_ID);

        when(shopClientOrderLineRepository
                .findByTenantIdAndConsultantClientMappingIdInAndIsDeletedFalseOrderByIdDesc(
                        eq(TENANT_ID), anyCollection()))
                .thenReturn(List.of(line));
        when(shopClientOrderLineRepository
                .findByTenantIdAndClientOrderPublicIdInAndIsDeletedFalseOrderByIdDesc(
                        eq(TENANT_ID), anyCollection()))
                .thenReturn(List.of(line));
        when(shopClientOrderRepository.findByTenantIdAndPublicIdIn(eq(TENANT_ID), anyCollection()))
                .thenReturn(List.of(order));
        when(paymentRepository.findByTenantIdAndOrderIdInAndIsDeletedFalse(
                eq(TENANT_ID), anyCollection()))
                .thenReturn(List.of(payment));
        when(userPersonalDataCacheService.getDecryptedUserData(consultant))
                .thenReturn(Map.of("name", "김상담"));

        List<Map<String, Object>> payloads = service.buildPayloads(List.of(mapping));

        assertThat(payloads).hasSize(1);
        Map<String, Object> row = payloads.get(0);
        assertThat(row.get("paymentAmount")).isEqualTo(100_000L);
        assertThat(row.get("pgAmount")).isEqualTo(100_000L);
        assertThat(row.get("cashDueMinor")).isEqualTo(100_000L);
        assertThat(row.get("productTitle")).isEqualTo("Welcome 패키지");
        assertThat(row.get("lineTotalMinor")).isEqualTo(100_000L);
        assertThat(row.get("paymentProvider")).isEqualTo("IAMPORT");
        assertThat(row.get("pgPaymentStatus")).isEqualTo("REFUNDED");
        assertThat(row.get("orderStatus")).isEqualTo("REFUNDED");
        assertThat(row.get("effectivePaymentStatus")).isEqualTo("REFUNDED");
        assertThat(row.get("paymentStatus")).isEqualTo(ConsultantClientMapping.PaymentStatus.CONFIRMED);
        assertThat(row.get("paymentMethod")).isEqualTo("CREDIT_CARD");
        assertThat(row.get("packageName")).isEqualTo("무료1회");
        assertThat(row.get("packagePrice")).isEqualTo(10_000L);
        @SuppressWarnings("unchecked")
        Map<String, Object> consultantInfo = (Map<String, Object>) row.get("consultant");
        assertThat(consultantInfo.get("consultantName")).isEqualTo("김상담");
    }

    @Test
    @DisplayName("mappingId 조인 미스 시 paymentReference→order 라인 벨트로 productTitle 보강")
    void enrichesLineViaPaymentReferenceWhenMappingIdJoinMisses() {
        String orderId = "belt-order-" + UUID.randomUUID();
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .packageName("무료1회")
                .packagePrice(10_000L)
                .paymentAmount(100_000L)
                .paymentStatus(ConsultantClientMapping.PaymentStatus.CONFIRMED)
                .paymentMethod("CREDIT_CARD")
                .paymentReference(orderId)
                .totalSessions(1)
                .usedSessions(0)
                .remainingSessions(0)
                .build();
        mapping.setId(272L);
        mapping.setTenantId(TENANT_ID);

        ShopClientOrder order = ShopClientOrder.builder()
                .publicId(orderId)
                .clientId(20L)
                .status(ShopClientOrderStatus.REFUNDED)
                .subtotalMinor(100_000L)
                .cashDueMinor(100_000L)
                .checkoutIdempotencyKey("key-" + orderId)
                .build();

        ShopClientOrderLine line = ShopClientOrderLine.builder()
                .clientOrder(order)
                .titleSnapshot("Welcome 패키지")
                .lineTotalMinor(100_000L)
                .consultantClientMappingId(null)
                .lineNo(1)
                .skuCodeSnapshot("SKU-W")
                .unitPriceMinor(100_000L)
                .quantity(1)
                .build();
        line.setId(1L);

        Payment payment = Payment.builder()
                .orderId(orderId)
                .amount(BigDecimal.valueOf(100_000L))
                .status(Payment.PaymentStatus.REFUNDED)
                .provider(Payment.PaymentProvider.IAMPORT)
                .build();
        payment.setId(9L);

        when(shopClientOrderLineRepository
                .findByTenantIdAndConsultantClientMappingIdInAndIsDeletedFalseOrderByIdDesc(
                        eq(TENANT_ID), anyCollection()))
                .thenReturn(Collections.emptyList());
        when(shopClientOrderLineRepository
                .findByTenantIdAndClientOrderPublicIdInAndIsDeletedFalseOrderByIdDesc(
                        eq(TENANT_ID), anyCollection()))
                .thenReturn(List.of(line));
        when(shopClientOrderRepository.findByTenantIdAndPublicIdIn(eq(TENANT_ID), anyCollection()))
                .thenReturn(List.of(order));
        when(paymentRepository.findByTenantIdAndOrderIdInAndIsDeletedFalse(
                eq(TENANT_ID), anyCollection()))
                .thenReturn(List.of(payment));

        Map<String, Object> row = service.buildPayloads(List.of(mapping)).get(0);

        assertThat(row.get("productTitle")).isEqualTo("Welcome 패키지");
        assertThat(row.get("lineTotalMinor")).isEqualTo(100_000L);
        assertThat(row.get("effectivePaymentStatus")).isEqualTo("REFUNDED");
        assertThat(row.get("pgAmount")).isEqualTo(100_000L);
    }

    @Test
    @DisplayName("주문라인·Payment 없으면 productTitle/lineTotal/paymentProvider 는 null (발명 금지)")
    void missingLineAndPayment_exposesNullsFailClosed() {
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .packageName("기본패키지")
                .packagePrice(100000L)
                .paymentAmount(null)
                .paymentMethod("BANK_TRANSFER")
                .paymentReference(null)
                .totalSessions(10)
                .usedSessions(0)
                .remainingSessions(10)
                .build();
        mapping.setId(202L);
        mapping.setTenantId(TENANT_ID);

        when(shopClientOrderLineRepository
                .findByTenantIdAndConsultantClientMappingIdInAndIsDeletedFalseOrderByIdDesc(
                        eq(TENANT_ID), anyCollection()))
                .thenReturn(Collections.emptyList());

        List<Map<String, Object>> payloads = service.buildPayloads(List.of(mapping));

        assertThat(payloads).hasSize(1);
        Map<String, Object> row = payloads.get(0);
        assertThat(row.get("paymentAmount")).isNull();
        assertThat(row.get("productTitle")).isNull();
        assertThat(row.get("lineTotalMinor")).isNull();
        assertThat(row.get("paymentProvider")).isNull();
        assertThat(row.get("pgAmount")).isNull();
        assertThat(row.get("orderStatus")).isNull();
        assertThat(row.get("effectivePaymentStatus")).isNull();
        assertThat(row.get("paymentMethod")).isEqualTo("BANK_TRANSFER");
        verify(paymentRepository, never())
                .findByTenantIdAndOrderIdInAndIsDeletedFalse(eq(TENANT_ID), anyCollection());
        verify(shopClientOrderRepository, never())
                .findByTenantIdAndPublicIdIn(eq(TENANT_ID), anyCollection());
    }

    @Test
    @DisplayName("paymentReference 있으나 Payment 미존재 시 paymentProvider/pg null, effective=매핑상태")
    void paymentReferenceWithoutPayment_providerNull() {
        String orderId = "orphan-ref-" + UUID.randomUUID();
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .paymentMethod("CREDIT_CARD")
                .paymentReference(orderId)
                .paymentAmount(12000L)
                .paymentStatus(ConsultantClientMapping.PaymentStatus.CONFIRMED)
                .totalSessions(1)
                .usedSessions(0)
                .remainingSessions(1)
                .build();
        mapping.setId(303L);
        mapping.setTenantId(TENANT_ID);

        when(shopClientOrderLineRepository
                .findByTenantIdAndConsultantClientMappingIdInAndIsDeletedFalseOrderByIdDesc(
                        eq(TENANT_ID), anyCollection()))
                .thenReturn(Collections.emptyList());
        when(shopClientOrderLineRepository
                .findByTenantIdAndClientOrderPublicIdInAndIsDeletedFalseOrderByIdDesc(
                        eq(TENANT_ID), anyCollection()))
                .thenReturn(Collections.emptyList());
        when(shopClientOrderRepository.findByTenantIdAndPublicIdIn(eq(TENANT_ID), anyCollection()))
                .thenReturn(Collections.emptyList());
        when(paymentRepository.findByTenantIdAndOrderIdInAndIsDeletedFalse(
                eq(TENANT_ID), anyCollection()))
                .thenReturn(Collections.emptyList());

        Map<String, Object> row = service.buildPayloads(List.of(mapping)).get(0);

        assertThat(row.get("paymentProvider")).isNull();
        assertThat(row.get("pgAmount")).isNull();
        assertThat(row.get("paymentAmount")).isEqualTo(12000L);
        assertThat(row.get("effectivePaymentStatus")).isEqualTo("CONFIRMED");
        assertThat(row.get("paymentMethod")).isEqualTo("CREDIT_CARD");
    }

    @Test
    @DisplayName("빈 목록·tenantId 없음은 빈 결과 / 조회 스킵 (fail-closed)")
    void emptyMappings_andMissingTenant_failClosed() {
        assertThat(service.buildPayloads(Collections.emptyList())).isEmpty();
        assertThat(service.buildPayloads(null)).isEmpty();

        TenantContextHolder.clear();
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .paymentMethod("CREDIT_CARD")
                .paymentReference("ref-x")
                .totalSessions(1)
                .usedSessions(0)
                .remainingSessions(1)
                .build();
        mapping.setId(404L);

        Map<String, Object> row = service.buildPayloads(List.of(mapping)).get(0);
        assertThat(row.get("productTitle")).isNull();
        assertThat(row.get("lineTotalMinor")).isNull();
        assertThat(row.get("paymentProvider")).isNull();
        assertThat(row.get("paymentMethod")).isEqualTo("CREDIT_CARD");
        verify(shopClientOrderLineRepository, never())
                .findByTenantIdAndConsultantClientMappingIdInAndIsDeletedFalseOrderByIdDesc(
                        eq(TENANT_ID), anyCollection());
    }
}
