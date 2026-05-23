package com.coresolution.consultation.service.ai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.service.ai.dto.AiProviderHealth;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link AiProviderHealthService} 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-05-23
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AiProviderHealthService")
class AiProviderHealthServiceTest {

    private static final String TENANT_ID = "tenant-health-test";

    @Mock
    private AiProviderResolver providerResolver;

    @InjectMocks
    private AiProviderHealthService healthService;

    @Test
    @DisplayName("헬스 DTO 정합성 — openai 활성 + gemini 키 없음")
    void checkHealth_openaiActive_geminiKeyMissing() {
        when(providerResolver.resolveProvider(TENANT_ID)).thenReturn("openai");
        when(providerResolver.isProviderKeyRegistered(TENANT_ID, "OPENAI")).thenReturn(true);
        when(providerResolver.isProviderKeyRegistered(TENANT_ID, "GEMINI")).thenReturn(false);

        AiProviderHealth health = healthService.checkHealth(TENANT_ID);

        assertEquals(TENANT_ID, health.getTenantId());
        assertEquals("openai", health.getActiveProvider());
        assertTrue(health.isOpenaiKeyRegistered());
        assertFalse(health.isGeminiKeyRegistered());
        assertNotNull(health.getCheckedAt());
    }

    @Test
    @DisplayName("헬스 DTO — gemini 활성 + 양쪽 키 등록")
    void checkHealth_geminiActive_bothKeysRegistered() {
        when(providerResolver.resolveProvider(TENANT_ID)).thenReturn("gemini");
        when(providerResolver.isProviderKeyRegistered(TENANT_ID, "OPENAI")).thenReturn(true);
        when(providerResolver.isProviderKeyRegistered(TENANT_ID, "GEMINI")).thenReturn(true);

        AiProviderHealth health = healthService.checkHealth(TENANT_ID);

        assertEquals("gemini", health.getActiveProvider());
        assertTrue(health.isOpenaiKeyRegistered());
        assertTrue(health.isGeminiKeyRegistered());
    }

    @Test
    @DisplayName("헬스 DTO — 양쪽 키 미등록")
    void checkHealth_noKeysRegistered() {
        when(providerResolver.resolveProvider(TENANT_ID)).thenReturn("openai");
        when(providerResolver.isProviderKeyRegistered(TENANT_ID, "OPENAI")).thenReturn(false);
        when(providerResolver.isProviderKeyRegistered(TENANT_ID, "GEMINI")).thenReturn(false);

        AiProviderHealth health = healthService.checkHealth(TENANT_ID);

        assertFalse(health.isOpenaiKeyRegistered());
        assertFalse(health.isGeminiKeyRegistered());
    }

    @Test
    @DisplayName("checkedAt 타임스탬프 존재")
    void checkHealth_checkedAtPresent() {
        when(providerResolver.resolveProvider(TENANT_ID)).thenReturn("openai");
        when(providerResolver.isProviderKeyRegistered(TENANT_ID, "OPENAI")).thenReturn(false);
        when(providerResolver.isProviderKeyRegistered(TENANT_ID, "GEMINI")).thenReturn(false);

        AiProviderHealth health = healthService.checkHealth(TENANT_ID);
        assertNotNull(health.getCheckedAt());
    }

    @Test
    @DisplayName("tenantId 필드 반환")
    void checkHealth_tenantIdReturned() {
        when(providerResolver.resolveProvider(TENANT_ID)).thenReturn("openai");
        when(providerResolver.isProviderKeyRegistered(TENANT_ID, "OPENAI")).thenReturn(true);
        when(providerResolver.isProviderKeyRegistered(TENANT_ID, "GEMINI")).thenReturn(false);

        AiProviderHealth health = healthService.checkHealth(TENANT_ID);
        assertEquals(TENANT_ID, health.getTenantId());
    }
}
