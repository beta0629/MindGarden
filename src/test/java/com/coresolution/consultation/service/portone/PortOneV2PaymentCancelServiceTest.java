package com.coresolution.consultation.service.portone;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.service.PersonalDataEncryptionService;
import com.coresolution.core.domain.TenantPgConfiguration;
import com.coresolution.core.domain.enums.ApprovalStatus;
import com.coresolution.core.domain.enums.PgConfigurationStatus;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.repository.TenantPgConfigurationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Optional;
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
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

/**
 * {@link PortOneV2PaymentCancelService} 단위 검증.
 *
 * @author MindGarden
 * @since 2026-09-17
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PortOneV2PaymentCancelService")
class PortOneV2PaymentCancelServiceTest {

    private static final String TENANT = "tenant-portone-cancel";
    private static final String PAYMENT_ID = "pay_portone_1";

    @Mock
    private TenantPgConfigurationRepository tenantPgConfigurationRepository;

    @Mock
    private PersonalDataEncryptionService encryptionService;

    @Mock
    private RestTemplate restTemplate;

    private PortOneV2PaymentCancelService service;

    @BeforeEach
    void setUp() {
        service = new PortOneV2PaymentCancelService(
                tenantPgConfigurationRepository, encryptionService, new ObjectMapper());
        ReflectionTestUtils.setField(service, "restTemplate", restTemplate);
    }

    @Test
    @DisplayName("ACTIVE APPROVED IAMPORT — cancel 2xx 성공")
    void cancelPayment_success() {
        stubActiveConfig();
        when(restTemplate.exchange(any(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>("{\"status\":\"PAID\"}", HttpStatus.OK));
        when(restTemplate.exchange(any(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>("{}", HttpStatus.OK));

        assertTrue(service.cancelPayment(TENANT, PAYMENT_ID, "admin refund"));
        verify(restTemplate, times(1)).exchange(any(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class));
    }

    @Test
    @DisplayName("PortOne 이미 CANCELLED — cancel POST 없이 멱등 성공")
    void cancelPayment_alreadyCancelled_idempotentSuccess() {
        stubActiveConfig();
        when(restTemplate.exchange(any(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>("{\"status\":\"CANCELLED\"}", HttpStatus.OK));

        assertTrue(service.cancelPayment(TENANT, PAYMENT_ID, "admin refund"));
        verify(restTemplate, never()).exchange(any(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class));
    }

    @Test
    @DisplayName("PortOne 이미 PARTIAL_CANCELLED — 멱등 성공")
    void cancelPayment_alreadyPartialCancelled_idempotentSuccess() {
        stubActiveConfig();
        when(restTemplate.exchange(any(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>("{\"status\":\"PARTIAL_CANCELLED\"}", HttpStatus.OK));

        assertTrue(service.cancelPayment(TENANT, PAYMENT_ID, "admin refund"));
        verify(restTemplate, never()).exchange(any(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class));
    }

    @Test
    @DisplayName("cancel POST 실패 후 GET 이 CANCELLED 이면 멱등 성공")
    void cancelPayment_postFailsButAlreadyCancelled_success() {
        stubActiveConfig();
        when(restTemplate.exchange(any(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>("{\"status\":\"PAID\"}", HttpStatus.OK))
                .thenReturn(new ResponseEntity<>("{\"status\":\"CANCELLED\"}", HttpStatus.OK));
        when(restTemplate.exchange(any(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new RestClientException("already cancelled"));

        assertTrue(service.cancelPayment(TENANT, PAYMENT_ID, "admin refund"));
    }

    @Test
    @DisplayName("cancel 실패 + 여전히 PAID 이면 false")
    void cancelPayment_postFailsStillPaid_false() {
        stubActiveConfig();
        when(restTemplate.exchange(any(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>("{\"status\":\"PAID\"}", HttpStatus.OK));
        when(restTemplate.exchange(any(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new RestClientException("pg error"));

        assertFalse(service.cancelPayment(TENANT, PAYMENT_ID, "admin refund"));
    }

    @Test
    @DisplayName("설정 없으면 false")
    void cancelPayment_noConfig_false() {
        when(tenantPgConfigurationRepository.findByTenantIdAndPgProviderAndStatusAndIsDeletedFalse(
                        TENANT, PgProvider.IAMPORT, PgConfigurationStatus.ACTIVE))
                .thenReturn(Optional.empty());

        assertFalse(service.cancelPayment(TENANT, PAYMENT_ID, "reason"));
    }

    @Test
    @DisplayName("빈 paymentId 이면 false")
    void cancelPayment_blankPaymentId_false() {
        assertFalse(service.cancelPayment(TENANT, " ", "reason"));
        assertFalse(service.cancelPayment(TENANT, null, "reason"));
    }

    private void stubActiveConfig() {
        TenantPgConfiguration config = TenantPgConfiguration.builder()
                .configId("cfg-1")
                .tenantId(TENANT)
                .pgProvider(PgProvider.IAMPORT)
                .status(PgConfigurationStatus.ACTIVE)
                .approvalStatus(ApprovalStatus.APPROVED)
                .secretKeyEncrypted("enc")
                .build();
        when(tenantPgConfigurationRepository.findByTenantIdAndPgProviderAndStatusAndIsDeletedFalse(
                        TENANT, PgProvider.IAMPORT, PgConfigurationStatus.ACTIVE))
                .thenReturn(Optional.of(config));
        when(encryptionService.decrypt("enc")).thenReturn("secret");
    }
}
