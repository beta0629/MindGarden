package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import com.coresolution.consultation.config.SmsProperties;
import com.coresolution.consultation.dto.TenantSmsEffectiveCredentials;
import com.coresolution.consultation.dto.TenantSmsSettingsResponse;
import com.coresolution.consultation.dto.TenantSmsSettingsUpdateRequest;
import com.coresolution.consultation.entity.TenantSmsSettings;
import com.coresolution.consultation.repository.TenantSmsSettingsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;

/**
 * 테넌트 SMS 설정 — 자격 증명 폴백·참조 해석·테넌트 격리.
 *
 * @author CoreSolution
 * @since 2026-04-25
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("TenantSmsSettingsServiceImpl")
class TenantSmsSettingsServiceImplTest {

    private static final String TENANT_A = "tenant-a-uuid";

    @Mock
    private TenantSmsSettingsRepository repository;

    @Mock
    private Environment environment;

    private TenantSmsSettingsServiceImpl service;

    @BeforeEach
    void setUp() {
        SmsProperties smsProperties = new SmsProperties();
        smsProperties.setEnabled(true);
        smsProperties.setProvider("nhn");
        smsProperties.setApiKey("global-service-id");
        smsProperties.setApiSecret("global-secret");
        smsProperties.setSenderNumber("01000000000");
        service = new TenantSmsSettingsServiceImpl(repository, smsProperties, environment);
    }

    @Test
    @DisplayName("tenantId null이면 전역 sms.auth 값만 사용")
    void getEffectiveCredentials_nullTenant_usesGlobalOnly() {
        TenantSmsEffectiveCredentials c = service.getEffectiveCredentials(null);

        assertThat(c.provider()).isEqualTo("nhn");
        assertThat(c.apiKey()).isEqualTo("global-service-id");
        assertThat(c.apiSecret()).isEqualTo("global-secret");
        assertThat(c.senderNumber()).isEqualTo("01000000000");
    }

    @Test
    @DisplayName("DB 행 없으면 전역 폴백")
    void getEffectiveCredentials_noRow_usesGlobal() {
        when(repository.findByTenantIdAndIsDeletedFalse(TENANT_A)).thenReturn(Optional.empty());

        TenantSmsEffectiveCredentials c = service.getEffectiveCredentials(TENANT_A);

        assertThat(c.apiKey()).isEqualTo("global-service-id");
    }

    @Test
    @DisplayName("api_key_ref가 있으면 Environment 값 우선")
    void getEffectiveCredentials_resolvesRefFromEnvironment() {
        TenantSmsSettings row = new TenantSmsSettings();
        row.setTenantId(TENANT_A);
        row.setSmsEnabled(true);
        row.setApiKeyRef("TENANT_A_SMS_KEY");
        when(repository.findByTenantIdAndIsDeletedFalse(TENANT_A)).thenReturn(Optional.of(row));
        when(environment.resolvePlaceholders("TENANT_A_SMS_KEY")).thenReturn("TENANT_A_SMS_KEY");
        when(environment.getProperty("TENANT_A_SMS_KEY")).thenReturn("resolved-service-id");

        TenantSmsEffectiveCredentials c = service.getEffectiveCredentials(TENANT_A);

        assertThat(c.apiKey()).isEqualTo("resolved-service-id");
    }

    @Test
    @DisplayName("테넌트 sms_enabled false면 isSmsEnabledForTenant false")
    void isSmsEnabledForTenant_whenRowFalse() {
        TenantSmsSettings row = new TenantSmsSettings();
        row.setSmsEnabled(false);
        when(repository.findByTenantIdAndIsDeletedFalse(TENANT_A)).thenReturn(Optional.of(row));

        assertThat(service.isSmsEnabledForTenant(TENANT_A)).isFalse();
    }

    @Test
    @DisplayName("tenantId null이면 SMS 채널 true(전역만 적용)")
    void isSmsEnabledForTenant_nullTenant_returnsTrue() {
        assertThat(service.isSmsEnabledForTenant(null)).isTrue();
    }

    @Test
    @DisplayName("upsert 신규 시 tenant_id 저장")
    void upsert_setsTenantIdOnCreate() {
        when(repository.findByTenantIdAndIsDeletedFalse(TENANT_A)).thenReturn(Optional.empty());
        when(repository.save(any(TenantSmsSettings.class))).thenAnswer(invocation -> {
            TenantSmsSettings e = invocation.getArgument(0);
            e.setId(1L);
            return e;
        });

        TenantSmsSettingsUpdateRequest req = TenantSmsSettingsUpdateRequest.builder()
            .smsEnabled(true)
            .provider("nhn")
            .apiKeyRef("ref-key")
            .build();

        TenantSmsSettingsResponse res = service.upsert(TENANT_A, req);

        ArgumentCaptor<TenantSmsSettings> captor = ArgumentCaptor.forClass(TenantSmsSettings.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getTenantId()).isEqualTo(TENANT_A);
        assertThat(res.getTenantId()).isEqualTo(TENANT_A);
        assertThat(res.getApiKeyRef()).isEqualTo("ref-key");
    }
}
