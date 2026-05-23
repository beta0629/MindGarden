package com.coresolution.consultation.service.ai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.entity.SystemConfig;
import com.coresolution.consultation.repository.SystemConfigRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link AiProviderResolver} 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-05-23
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AiProviderResolver")
class AiProviderResolverTest {

    private static final String TENANT_A = "tenant-aaa";
    private static final String TENANT_B = "tenant-bbb";

    @Mock
    private SystemConfigRepository systemConfigRepository;

    private AiProviderResolver resolver;

    @BeforeEach
    void setUp() {
        resolver = new AiProviderResolver(systemConfigRepository);
    }

    @Test
    @DisplayName("테넌트별 프로바이더 조회 — gemini")
    void resolveProvider_tenantSpecific() {
        SystemConfig config = SystemConfig.builder()
                .tenantId(TENANT_A)
                .configKey("AI_DEFAULT_PROVIDER")
                .configValue("gemini")
                .build();
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue(TENANT_A, "AI_DEFAULT_PROVIDER"))
                .thenReturn(Optional.of(config));

        assertEquals("gemini", resolver.resolveProvider(TENANT_A));
    }

    @Test
    @DisplayName("설정 없으면 기본값 openai")
    void resolveProvider_defaultOpenai() {
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue(TENANT_A, "AI_DEFAULT_PROVIDER"))
                .thenReturn(Optional.empty());

        assertEquals("openai", resolver.resolveProvider(TENANT_A));
    }

    @Test
    @DisplayName("캐시 동작 — 두 번째 호출은 DB 미조회")
    void resolveProvider_cacheHit() {
        SystemConfig config = SystemConfig.builder()
                .tenantId(TENANT_A)
                .configKey("AI_DEFAULT_PROVIDER")
                .configValue("openai")
                .build();
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue(TENANT_A, "AI_DEFAULT_PROVIDER"))
                .thenReturn(Optional.of(config));

        resolver.resolveProvider(TENANT_A);
        resolver.resolveProvider(TENANT_A);

        verify(systemConfigRepository, times(1))
                .findByTenantIdAndConfigKeyAndIsActiveTrue(TENANT_A, "AI_DEFAULT_PROVIDER");
    }

    @Test
    @DisplayName("멀티테넌트 격리 — 테넌트별 다른 프로바이더")
    void resolveProvider_multiTenantIsolation() {
        SystemConfig configA = SystemConfig.builder()
                .tenantId(TENANT_A).configKey("AI_DEFAULT_PROVIDER").configValue("openai").build();
        SystemConfig configB = SystemConfig.builder()
                .tenantId(TENANT_B).configKey("AI_DEFAULT_PROVIDER").configValue("gemini").build();
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue(TENANT_A, "AI_DEFAULT_PROVIDER"))
                .thenReturn(Optional.of(configA));
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue(TENANT_B, "AI_DEFAULT_PROVIDER"))
                .thenReturn(Optional.of(configB));

        assertEquals("openai", resolver.resolveProvider(TENANT_A));
        assertEquals("gemini", resolver.resolveProvider(TENANT_B));
    }

    @Test
    @DisplayName("null tenantId → IllegalArgumentException")
    void resolveProvider_nullTenantId() {
        assertThrows(IllegalArgumentException.class, () -> resolver.resolveProvider(null));
        assertThrows(IllegalArgumentException.class, () -> resolver.resolveProvider(""));
    }

    @Test
    @DisplayName("키 등록 검증 — OPENAI 키 있음")
    void isProviderKeyRegistered_openaiPresent() {
        SystemConfig keyConfig = SystemConfig.builder()
                .tenantId(TENANT_A)
                .configKey("OPENAI_API_KEY")
                .configValue("sk-test-key")
                .build();
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue(TENANT_A, "OPENAI_API_KEY"))
                .thenReturn(Optional.of(keyConfig));

        assertTrue(resolver.isProviderKeyRegistered(TENANT_A, "OPENAI"));
    }

    @Test
    @DisplayName("키 등록 검증 — GEMINI 키 없음")
    void isProviderKeyRegistered_geminiAbsent() {
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue(TENANT_A, "GEMINI_API_KEY"))
                .thenReturn(Optional.empty());

        assertFalse(resolver.isProviderKeyRegistered(TENANT_A, "GEMINI"));
    }

    @Test
    @DisplayName("invalidate 후 재조회")
    void invalidate_clearsCache() {
        SystemConfig config = SystemConfig.builder()
                .tenantId(TENANT_A)
                .configKey("AI_DEFAULT_PROVIDER")
                .configValue("openai")
                .build();
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue(TENANT_A, "AI_DEFAULT_PROVIDER"))
                .thenReturn(Optional.of(config));

        resolver.resolveProvider(TENANT_A);
        resolver.invalidate(TENANT_A);
        resolver.resolveProvider(TENANT_A);

        verify(systemConfigRepository, times(2))
                .findByTenantIdAndConfigKeyAndIsActiveTrue(eq(TENANT_A), eq("AI_DEFAULT_PROVIDER"));
    }
}
