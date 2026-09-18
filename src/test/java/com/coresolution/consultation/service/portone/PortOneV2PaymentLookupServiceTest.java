package com.coresolution.consultation.service.portone;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;
import com.coresolution.consultation.service.PersonalDataEncryptionService;
import com.coresolution.core.domain.TenantPgConfiguration;
import com.coresolution.core.domain.enums.ApprovalStatus;
import com.coresolution.core.domain.enums.PgConfigurationStatus;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.repository.TenantPgConfigurationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

/**
 * {@link PortOneV2PaymentLookupService} 단위 테스트 (HTTP mock).
 *
 * @author CoreSolution
 * @since 2026-09-17
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PortOneV2PaymentLookupService")
class PortOneV2PaymentLookupServiceTest {

    private static final String TENANT = "tenant-lookup-fixture";
    private static final String ORDER_ID = "order-lookup-fixture-001";
    private static final String APPROVAL = "APPROVAL-FIXTURE-001";
    private static final String PAYMENT_ID = "portone-pay-lookup-001";
    private static final BigDecimal AMOUNT = new BigDecimal("15000");

    @Mock
    private TenantPgConfigurationRepository tenantPgConfigurationRepository;
    @Mock
    private PersonalDataEncryptionService encryptionService;
    @Mock
    private RestTemplate restTemplate;

    private PortOneV2PaymentLookupService service;

    @BeforeEach
    void setUp() {
        service = new PortOneV2PaymentLookupService(
                tenantPgConfigurationRepository, encryptionService, new ObjectMapper());
        ReflectionTestUtils.setField(service, "restTemplate", restTemplate);
    }

    @Test
    @DisplayName("PAID + 금액 일치 + customData 주문 매칭 시 paymentId 반환")
    void findPaidPaymentId_happyPath_returnsId() {
        stubActiveApprovedConfig();
        when(encryptionService.decrypt("enc-secret")).thenReturn("plain-secret");
        String body = "{\"items\":[{"
                + "\"id\":\"" + PAYMENT_ID + "\","
                + "\"status\":\"PAID\","
                + "\"amount\":{\"total\":15000},"
                + "\"customData\":{\"orderPublicId\":\"" + ORDER_ID + "\"}"
                + "}],\"page\":{\"number\":0,\"size\":10,\"totalElements\":1}}";
        when(restTemplate.exchange(any(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>(body, HttpStatus.OK));

        Optional<String> result = service.findPaidPaymentIdByCardApprovalNumber(
                TENANT, APPROVAL, AMOUNT, ORDER_ID);

        assertTrue(result.isPresent());
        assertEquals(PAYMENT_ID, result.get());
    }

    @Test
    @DisplayName("금액 불일치 시 empty")
    void findPaidPaymentId_amountMismatch_returnsEmpty() {
        stubActiveApprovedConfig();
        when(encryptionService.decrypt("enc-secret")).thenReturn("plain-secret");
        String body = "{\"items\":[{"
                + "\"id\":\"" + PAYMENT_ID + "\","
                + "\"status\":\"PAID\","
                + "\"amount\":{\"total\":999},"
                + "\"customData\":{\"orderPublicId\":\"" + ORDER_ID + "\"}"
                + "}],\"page\":{}}";
        when(restTemplate.exchange(any(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>(body, HttpStatus.OK));

        assertTrue(service.findPaidPaymentIdByCardApprovalNumber(
                TENANT, APPROVAL, AMOUNT, ORDER_ID).isEmpty());
    }

    @Test
    @DisplayName("승인번호 blank 시 empty")
    void findPaidPaymentId_blankApproval_returnsEmpty() {
        assertTrue(service.findPaidPaymentIdByCardApprovalNumber(
                TENANT, "  ", AMOUNT, ORDER_ID).isEmpty());
    }

    @Test
    @DisplayName("PAID+금액 다건이면 fail-closed empty")
    void findPaidPaymentId_multiplePaidAmount_returnsEmpty() {
        stubActiveApprovedConfig();
        when(encryptionService.decrypt("enc-secret")).thenReturn("plain-secret");
        String body = "{\"items\":["
                + "{\"id\":\"pay-a\",\"status\":\"PAID\",\"amount\":{\"total\":15000}},"
                + "{\"id\":\"pay-b\",\"status\":\"PAID\",\"amount\":{\"total\":15000}}"
                + "],\"page\":{}}";
        when(restTemplate.exchange(any(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>(body, HttpStatus.OK));

        assertTrue(service.findPaidPaymentIdByCardApprovalNumber(
                TENANT, APPROVAL, AMOUNT, ORDER_ID).isEmpty());
    }

    @Test
    @DisplayName("customData 없고 PAID+금액 단건이면 paymentId 반환")
    void findPaidPaymentId_missingCustomData_singleMatch_returnsId() {
        stubActiveApprovedConfig();
        when(encryptionService.decrypt("enc-secret")).thenReturn("plain-secret");
        String body = "{\"items\":[{"
                + "\"id\":\"" + PAYMENT_ID + "\","
                + "\"status\":\"PAID\","
                + "\"amount\":{\"total\":15000}"
                + "}],\"page\":{}}";
        when(restTemplate.exchange(any(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>(body, HttpStatus.OK));

        Optional<String> result = service.findPaidPaymentIdByCardApprovalNumber(
                TENANT, APPROVAL, AMOUNT, ORDER_ID);

        assertTrue(result.isPresent());
        assertEquals(PAYMENT_ID, result.get());
    }

    private void stubActiveApprovedConfig() {
        TenantPgConfiguration config = TenantPgConfiguration.builder()
                .configId("cfg-lookup-1")
                .tenantId(TENANT)
                .pgProvider(PgProvider.IAMPORT)
                .status(PgConfigurationStatus.ACTIVE)
                .approvalStatus(ApprovalStatus.APPROVED)
                .secretKeyEncrypted("enc-secret")
                .storeId("store-fixture-001")
                .testMode(true)
                .build();
        when(tenantPgConfigurationRepository.findByTenantIdAndPgProviderAndStatusAndIsDeletedFalse(
                eq(TENANT), eq(PgProvider.IAMPORT), eq(PgConfigurationStatus.ACTIVE)))
                .thenReturn(Optional.of(config));
    }
}
