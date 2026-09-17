package com.coresolution.consultation.service.portone;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

/**
 * {@link PortOneV2PaymentCancelService} 단위 테스트 (HTTP mock).
 *
 * @author CoreSolution
 * @since 2026-09-17
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PortOneV2PaymentCancelService")
class PortOneV2PaymentCancelServiceTest {

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
    @DisplayName("ACTIVE IAMPORT + 2xx 시 true·reason body")
    void cancelPayment_activeConfig_returnsTrue() {
        stubApprovedConfig();
        when(encryptionService.decrypt("enc-secret")).thenReturn("plain-secret");
        when(restTemplate.exchange(any(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>("{\"cancellation\":{}}", HttpStatus.OK));

        assertTrue(service.cancelPayment("t1", "pay-1", "고객 요청 취소"));

        ArgumentCaptor<HttpEntity> entityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(any(), eq(HttpMethod.POST), entityCaptor.capture(), eq(String.class));
        HttpEntity<?> entity = entityCaptor.getValue();
        assertTrue(String.valueOf(entity.getHeaders().getFirst("Authorization")).startsWith("PortOne "));
        assertTrue(String.valueOf(entity.getBody()).contains("고객 요청 취소"));
    }

    @Test
    @DisplayName("ACTIVE 설정 없으면 false")
    void cancelPayment_noConfig_returnsFalse() {
        when(tenantPgConfigurationRepository.findByTenantIdAndPgProviderAndStatusAndIsDeletedFalse(
                eq("t1"), eq(PgProvider.IAMPORT), eq(PgConfigurationStatus.ACTIVE)))
                .thenReturn(Optional.empty());

        assertFalse(service.cancelPayment("t1", "pay-1", "사유"));
    }

    @Test
    @DisplayName("reason 없으면 false")
    void cancelPayment_blankReason_returnsFalse() {
        assertFalse(service.cancelPayment("t1", "pay-1", "  "));
    }

    @Test
    @DisplayName("HTTP 비2xx 시 false")
    void cancelPayment_httpError_returnsFalse() {
        stubApprovedConfig();
        when(encryptionService.decrypt("enc-secret")).thenReturn("plain-secret");
        when(restTemplate.exchange(any(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>("err", HttpStatus.BAD_REQUEST));

        assertFalse(service.cancelPayment("t1", "pay-1", "사유"));
    }

    private void stubApprovedConfig() {
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
