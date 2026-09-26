package com.coresolution.consultation.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.util.Optional;

import com.coresolution.consultation.constant.SessionSecurityFlagKeys;
import com.coresolution.consultation.dto.response.SessionSecurityFlagsResponse;
import com.coresolution.consultation.entity.SystemConfig;
import com.coresolution.consultation.repository.SystemConfigRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * SessionSecurityPolicyService — 기본값·테넌트 오버라이드·캐시.
 *
 * @author MindGarden
 * @since 2026-09-26
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SessionSecurityPolicyService")
class SessionSecurityPolicyServiceTest {

    private static final String TENANT = "tenant-sec-flags";

    @Mock
    private SystemConfigRepository systemConfigRepository;

    @InjectMocks
    private SessionSecurityPolicyService service;

    @BeforeEach
    void clearCache() {
        service.invalidateCache(null);
    }

    @Test
    @DisplayName("행 없으면 DEFAULT: requireVerify=true, keepUser=false, softFail=true")
    void defaultsWhenNoRows() {
        when(systemConfigRepository.findGlobalByConfigKey(
                SessionSecurityFlagKeys.OAUTH_REQUIRE_SERVER_VERIFY))
                .thenReturn(Optional.empty());
        when(systemConfigRepository.findGlobalByConfigKey(
                SessionSecurityFlagKeys.BACKGROUND_401_KEEP_USER))
                .thenReturn(Optional.empty());
        when(systemConfigRepository.findGlobalByConfigKey(
                SessionSecurityFlagKeys.SOFT_FAIL_ENABLED))
                .thenReturn(Optional.empty());

        SessionSecurityFlagsResponse flags = service.resolveFlags(TENANT);

        assertThat(flags.isOauthRequireServerVerify()).isTrue();
        assertThat(flags.isBackground401KeepUser()).isFalse();
        assertThat(flags.isSoftFailEnabled()).isTrue();
        assertThat(flags.getCacheTtlMs()).isEqualTo(SessionSecurityFlagKeys.CACHE_TTL_MS);
    }

    @Test
    @DisplayName("테넌트 행이 전역보다 우선")
    void tenantOverridesGlobal() {
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue(
                eq(TENANT), eq(SessionSecurityFlagKeys.BACKGROUND_401_KEEP_USER)))
                .thenReturn(Optional.of(SystemConfig.builder()
                        .tenantId(TENANT)
                        .configKey(SessionSecurityFlagKeys.BACKGROUND_401_KEEP_USER)
                        .configValue("true")
                        .isActive(true)
                        .build()));
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue(
                eq(TENANT), eq(SessionSecurityFlagKeys.OAUTH_REQUIRE_SERVER_VERIFY)))
                .thenReturn(Optional.empty());
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue(
                eq(TENANT), eq(SessionSecurityFlagKeys.SOFT_FAIL_ENABLED)))
                .thenReturn(Optional.empty());
        when(systemConfigRepository.findGlobalByConfigKey(
                SessionSecurityFlagKeys.OAUTH_REQUIRE_SERVER_VERIFY))
                .thenReturn(Optional.empty());
        when(systemConfigRepository.findGlobalByConfigKey(
                SessionSecurityFlagKeys.SOFT_FAIL_ENABLED))
                .thenReturn(Optional.empty());

        SessionSecurityFlagsResponse flags = service.resolveFlags(TENANT);

        assertThat(flags.isBackground401KeepUser()).isTrue();
        assertThat(flags.isOauthRequireServerVerify()).isTrue();
    }

    @Test
    @DisplayName("isSessionSecurityConfigKey")
    void recognizesSessionSecurityKeys() {
        assertThat(service.isSessionSecurityConfigKey(
                SessionSecurityFlagKeys.OAUTH_REQUIRE_SERVER_VERIFY)).isTrue();
        assertThat(service.isSessionSecurityConfigKey("other.key")).isFalse();
    }
}
