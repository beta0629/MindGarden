package com.coresolution.consultation.service.portone;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
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
 * {@link PortOneV2PaymentVerifyService} 단위 테스트 (HTTP mock).
 *
 * @author CoreSolution
 * @since 2026-09-16
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PortOneV2PaymentVerifyService")
class PortOneV2PaymentVerifyServiceTest {

    @Mock
    private TenantPgConfigurationRepository tenantPgConfigurationRepository;
    @Mock
    private PersonalDataEncryptionService encryptionService;
    @Mock
    private RestTemplate restTemplate;

    private PortOneV2PaymentVerifyService service;

    @BeforeEach
    void setUp() {
        service = new PortOneV2PaymentVerifyService(
                tenantPgConfigurationRepository, encryptionService, new ObjectMapper());
        ReflectionTestUtils.setField(service, "restTemplate", restTemplate);
        // 단위 테스트에서 Thread.sleep 제거
        ReflectionTestUtils.setField(service, "transientStatusBaseDelayMs", 0L);
        ReflectionTestUtils.setField(service, "transientStatusDelayStepMs", 0L);
    }

    @Test
    @DisplayName("PAID + 금액 일치 시 true")
    void verifyPaidAmount_paidMatchingAmount_returnsTrue() {
        stubActiveApprovedConfig();
        when(encryptionService.decrypt("enc-secret")).thenReturn("plain-secret");
        when(restTemplate.exchange(any(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>("{\"status\":\"PAID\",\"amount\":{\"total\":1000}}", HttpStatus.OK));

        assertTrue(service.verifyPaidAmount("t1", "pay-1", new BigDecimal("1000")));
        verify(restTemplate, times(1)).exchange(any(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class));
    }

    @Test
    @DisplayName("PAID + 금액 일치 시 body Optional 반환")
    void verifyPaidAmountBody_paidMatchingAmount_returnsBody() {
        stubActiveApprovedConfig();
        when(encryptionService.decrypt("enc-secret")).thenReturn("plain-secret");
        String body = "{\"status\":\"PAID\",\"amount\":{\"total\":1000}}";
        when(restTemplate.exchange(any(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>(body, HttpStatus.OK));

        Optional<String> result = service.verifyPaidAmountBody("t1", "pay-1", new BigDecimal("1000"));
        assertTrue(result.isPresent());
        assertTrue(result.get().contains("PAID"));
    }

    @Test
    @DisplayName("최종까지 PAID 아니면 empty (재조회 후 fail-closed)")
    void verifyPaidAmount_notPaid_returnsFalse() {
        stubActiveApprovedConfig();
        when(encryptionService.decrypt("enc-secret")).thenReturn("plain-secret");
        when(restTemplate.exchange(any(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>("{\"status\":\"FAILED\",\"amount\":{\"total\":1000}}", HttpStatus.OK));

        assertFalse(service.verifyPaidAmount("t1", "pay-1", new BigDecimal("1000")));
        assertTrue(service.verifyPaidAmountBody("t1", "pay-1", new BigDecimal("1000")).isEmpty());
        verify(restTemplate, times(6)).exchange(any(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class));
    }

    @Test
    @DisplayName("첫 REST status≠PAID → 재조회 PAID+금액일치 → present")
    void verifyPaidAmountBody_transientNonPaidThenPaid_returnsBody() {
        stubActiveApprovedConfig();
        when(encryptionService.decrypt("enc-secret")).thenReturn("plain-secret");
        when(restTemplate.exchange(any(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>(
                        "{\"status\":\"READY\",\"amount\":{\"total\":1000}}", HttpStatus.OK))
                .thenReturn(new ResponseEntity<>(
                        "{\"status\":\"PAID\",\"amount\":{\"total\":1000}}", HttpStatus.OK));

        Optional<String> result = service.verifyPaidAmountBody("t1", "pay-1", new BigDecimal("1000"));
        assertTrue(result.isPresent());
        assertTrue(result.get().contains("PAID"));
        verify(restTemplate, times(2)).exchange(any(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class));
    }

    @Test
    @DisplayName("금액 불일치는 재시도 없이 즉시 empty (1회 조회)")
    void verifyPaidAmountBody_amountMismatch_emptyWithoutRetry() {
        stubActiveApprovedConfig();
        when(encryptionService.decrypt("enc-secret")).thenReturn("plain-secret");
        when(restTemplate.exchange(any(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>(
                        "{\"status\":\"PAID\",\"amount\":{\"total\":999}}", HttpStatus.OK));

        assertTrue(service.verifyPaidAmountBody("t1", "pay-1", new BigDecimal("1000")).isEmpty());
        verify(restTemplate, times(1)).exchange(any(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class));
    }

    private void stubActiveApprovedConfig() {
        TenantPgConfiguration config = TenantPgConfiguration.builder()
                .configId("cfg-1")
                .tenantId("t1")
                .pgProvider(PgProvider.IAMPORT)
                .status(PgConfigurationStatus.ACTIVE)
                .approvalStatus(ApprovalStatus.APPROVED)
                .secretKeyEncrypted("enc-secret")
                .testMode(true)
                .build();
        when(tenantPgConfigurationRepository.findByTenantIdAndPgProviderAndStatusAndIsDeletedFalse(
                eq("t1"), eq(PgProvider.IAMPORT), eq(PgConfigurationStatus.ACTIVE)))
                .thenReturn(Optional.of(config));
    }
}
