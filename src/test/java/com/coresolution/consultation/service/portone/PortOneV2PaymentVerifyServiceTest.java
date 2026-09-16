package com.coresolution.consultation.service.portone;

import static org.junit.jupiter.api.Assertions.assertFalse;
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
    }

    @Test
    @DisplayName("PAID + 금액 일치 시 true")
    void verifyPaidAmount_paidMatchingAmount_returnsTrue() {
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
        when(encryptionService.decrypt("enc-secret")).thenReturn("plain-secret");
        when(restTemplate.exchange(any(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>("{\"status\":\"PAID\",\"amount\":{\"total\":1000}}", HttpStatus.OK));

        assertTrue(service.verifyPaidAmount("t1", "pay-1", new BigDecimal("1000")));
    }

    @Test
    @DisplayName("PAID 아니면 false")
    void verifyPaidAmount_notPaid_returnsFalse() {
        TenantPgConfiguration config = TenantPgConfiguration.builder()
                .configId("cfg-1")
                .tenantId("t1")
                .pgProvider(PgProvider.IAMPORT)
                .status(PgConfigurationStatus.ACTIVE)
                .approvalStatus(ApprovalStatus.APPROVED)
                .secretKeyEncrypted("enc-secret")
                .build();
        when(tenantPgConfigurationRepository.findByTenantIdAndPgProviderAndStatusAndIsDeletedFalse(
                eq("t1"), eq(PgProvider.IAMPORT), eq(PgConfigurationStatus.ACTIVE)))
                .thenReturn(Optional.of(config));
        when(encryptionService.decrypt("enc-secret")).thenReturn("plain-secret");
        when(restTemplate.exchange(any(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>("{\"status\":\"FAILED\",\"amount\":{\"total\":1000}}", HttpStatus.OK));

        assertFalse(service.verifyPaidAmount("t1", "pay-1", new BigDecimal("1000")));
    }
}
