package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import com.coresolution.consultation.constant.SessionSecurityFlagKeys;
import com.coresolution.consultation.entity.SystemConfig;
import com.coresolution.consultation.repository.SystemConfigRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * 테넌트별 중복 로그인 허용 플래그 조회 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-08-07
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SystemConfigServiceImpl — 중복 로그인 허용 테넌트 플래그")
class SystemConfigServiceImplDuplicateLoginAllowedTest {

    private static final String TENANT_A = "tenant-a";
    private static final String TENANT_B = "tenant-b";

    @Mock
    private SystemConfigRepository systemConfigRepository;

    @InjectMocks
    private SystemConfigServiceImpl systemConfigService;

    @BeforeEach
    void setEnvDefaultFalse() {
        ReflectionTestUtils.setField(systemConfigService, "duplicateLoginAllowedByDefault", false);
    }

    @Nested
    @DisplayName("isDuplicateLoginAllowedForTenant")
    class IsDuplicateLoginAllowed {

        @Test
        @DisplayName("행 없음 → env/기본 false")
        void returnsDefaultWhenRowMissing() {
            when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue(
                    TENANT_A, SessionSecurityFlagKeys.DUPLICATE_LOGIN_ALLOWED))
                    .thenReturn(Optional.empty());

            assertThat(systemConfigService.isDuplicateLoginAllowedForTenant(TENANT_A)).isFalse();
        }

        @Test
        @DisplayName("행 true → true (테넌트 오버라이드)")
        void returnsTrueWhenRowTrue() {
            when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue(
                    TENANT_A, SessionSecurityFlagKeys.DUPLICATE_LOGIN_ALLOWED))
                    .thenReturn(Optional.of(config("true")));

            assertThat(systemConfigService.isDuplicateLoginAllowedForTenant(TENANT_A)).isTrue();
        }

        @Test
        @DisplayName("행 false → false")
        void returnsFalseWhenRowFalse() {
            when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue(
                    TENANT_A, SessionSecurityFlagKeys.DUPLICATE_LOGIN_ALLOWED))
                    .thenReturn(Optional.of(config("false")));

            assertThat(systemConfigService.isDuplicateLoginAllowedForTenant(TENANT_A)).isFalse();
        }

        @Test
        @DisplayName("테넌트 격리 — A true / B 행 없음 → A만 true")
        void isolatesTenants() {
            when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue(
                    TENANT_A, SessionSecurityFlagKeys.DUPLICATE_LOGIN_ALLOWED))
                    .thenReturn(Optional.of(config("true")));
            when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue(
                    TENANT_B, SessionSecurityFlagKeys.DUPLICATE_LOGIN_ALLOWED))
                    .thenReturn(Optional.empty());

            assertThat(systemConfigService.isDuplicateLoginAllowedForTenant(TENANT_A)).isTrue();
            assertThat(systemConfigService.isDuplicateLoginAllowedForTenant(TENANT_B)).isFalse();
        }

        @Test
        @DisplayName("tenantId blank → env 기본")
        void blankTenantUsesEnvDefault() {
            assertThat(systemConfigService.isDuplicateLoginAllowedForTenant(null)).isFalse();
            assertThat(systemConfigService.isDuplicateLoginAllowedForTenant("  ")).isFalse();
        }

        @Test
        @DisplayName("env allowed-by-default=true + 행 없음 → true")
        void envDefaultTrueWhenRowMissing() {
            ReflectionTestUtils.setField(systemConfigService, "duplicateLoginAllowedByDefault", true);
            when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue(
                    TENANT_A, SessionSecurityFlagKeys.DUPLICATE_LOGIN_ALLOWED))
                    .thenReturn(Optional.empty());

            assertThat(systemConfigService.isDuplicateLoginAllowedForTenant(TENANT_A)).isTrue();
        }
    }

    @Nested
    @DisplayName("getBooleanForTenant")
    class GetBooleanForTenant {

        @Test
        @DisplayName("TenantContext 없이 tenantId 직접 조회")
        void readsByTenantIdDirectly() {
            when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue(
                    TENANT_A, SessionSecurityFlagKeys.DUPLICATE_LOGIN_ALLOWED))
                    .thenReturn(Optional.of(config("yes")));

            boolean value = systemConfigService.getBooleanForTenant(
                    TENANT_A, SessionSecurityFlagKeys.DUPLICATE_LOGIN_ALLOWED, false);

            assertThat(value).isTrue();
            verify(systemConfigRepository).findByTenantIdAndConfigKeyAndIsActiveTrue(
                    TENANT_A, SessionSecurityFlagKeys.DUPLICATE_LOGIN_ALLOWED);
        }
    }

    private static SystemConfig config(String value) {
        return SystemConfig.builder()
                .tenantId(TENANT_A)
                .configKey(SessionSecurityFlagKeys.DUPLICATE_LOGIN_ALLOWED)
                .configValue(value)
                .category(SessionSecurityFlagKeys.CATEGORY)
                .isActive(true)
                .isEncrypted(false)
                .build();
    }
}
