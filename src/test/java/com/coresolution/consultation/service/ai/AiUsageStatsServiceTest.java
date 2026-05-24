package com.coresolution.consultation.service.ai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.entity.AiUsageLog;
import com.coresolution.consultation.repository.AiUsageLogRepository;
import com.coresolution.consultation.service.ai.dto.AiUsageLogDetailResponse;
import com.coresolution.consultation.service.ai.dto.AiUsageLogResponse;
import com.coresolution.consultation.service.ai.dto.AiUsageStatsResponse;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

/**
 * {@link AiUsageStatsService} 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-05-24
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AiUsageStatsService")
class AiUsageStatsServiceTest {

    private static final String TENANT_ID = "tenant-stats";

    @Mock
    private AiUsageLogRepository usageLogRepository;

    @InjectMocks
    private AiUsageStatsService service;

    // ---- provider 추정 ----

    @Test
    @DisplayName("inferProviderFromModel — gpt-* / o1-* → OPENAI")
    void infer_openaiPrefixes() {
        assertEquals("OPENAI", AiUsageStatsService.inferProviderFromModel("gpt-4o-mini"));
        assertEquals("OPENAI", AiUsageStatsService.inferProviderFromModel("GPT-3.5-TURBO"));
        assertEquals("OPENAI", AiUsageStatsService.inferProviderFromModel("o1-preview"));
    }

    @Test
    @DisplayName("inferProviderFromModel — gemini-* → GEMINI")
    void infer_geminiPrefix() {
        assertEquals("GEMINI", AiUsageStatsService.inferProviderFromModel("gemini-2.5-flash"));
        assertEquals("GEMINI", AiUsageStatsService.inferProviderFromModel("GEMINI-3.1-PRO"));
    }

    @Test
    @DisplayName("inferProviderFromModel — claude-* → CLAUDE")
    void infer_claudePrefix() {
        assertEquals("CLAUDE", AiUsageStatsService.inferProviderFromModel("claude-3-5-sonnet-20241022"));
    }

    @Test
    @DisplayName("inferProviderFromModel — replicate (path) → REPLICATE")
    void infer_replicatePrefix() {
        assertEquals("REPLICATE", AiUsageStatsService.inferProviderFromModel("meta/llama-3.1-70b"));
        assertEquals("REPLICATE", AiUsageStatsService.inferProviderFromModel("stability-ai/sdxl"));
    }

    @Test
    @DisplayName("inferProviderFromModel — null / 미식별 → UNKNOWN")
    void infer_unknown() {
        assertEquals("UNKNOWN", AiUsageStatsService.inferProviderFromModel(null));
        assertEquals("UNKNOWN", AiUsageStatsService.inferProviderFromModel(""));
        assertEquals("UNKNOWN", AiUsageStatsService.inferProviderFromModel("custom-model-x"));
    }

    // ---- tenantId 가드 ----

    @Test
    @DisplayName("getUsageStats — tenantId null → IllegalArgumentException")
    void getUsageStats_nullTenant_throws() {
        assertThrows(IllegalArgumentException.class, () -> service.getUsageStats(null, "today"));
    }

    @Test
    @DisplayName("getUsageLogs — tenantId blank → IllegalArgumentException")
    void getUsageLogs_blankTenant_throws() {
        assertThrows(IllegalArgumentException.class,
                () -> service.getUsageLogs("  ", null, null, null, PageRequest.of(0, 10)));
    }

    @Test
    @DisplayName("getLogDetail — tenantId null → IllegalArgumentException")
    void getLogDetail_nullTenant_throws() {
        assertThrows(IllegalArgumentException.class, () -> service.getLogDetail(null, 1L));
    }

    // ---- 통계 집계 ----

    @Test
    @DisplayName("getUsageStats — 호출 수 0 일 때 successRate/failureRate = 0")
    void getUsageStats_emptyData_zeroRates() {
        when(usageLogRepository.countByTenantAndPeriod(eq(TENANT_ID), any(), any())).thenReturn(0L);
        when(usageLogRepository.countSuccessByTenantAndPeriod(eq(TENANT_ID), any(), any())).thenReturn(0L);
        when(usageLogRepository.sumTokensByTenantAndPeriod(eq(TENANT_ID), any(), any())).thenReturn(0L);
        when(usageLogRepository.averageDurationByTenantAndPeriod(eq(TENANT_ID), any(), any())).thenReturn(null);
        when(usageLogRepository.countByCallerInPeriod(eq(TENANT_ID), any(), any())).thenReturn(List.of());
        when(usageLogRepository.countByModelInPeriod(eq(TENANT_ID), any(), any())).thenReturn(List.of());
        when(usageLogRepository.countDailyByTenantAndPeriod(eq(TENANT_ID), any(), any())).thenReturn(List.of());

        AiUsageStatsResponse stats = service.getUsageStats(TENANT_ID, "today");

        assertEquals(TENANT_ID, stats.getTenantId());
        assertEquals("today", stats.getPeriod());
        assertEquals(0L, stats.getCallsToday());
        assertEquals(0.0, stats.getSuccessRate());
        assertEquals(0.0, stats.getFailureRate());
        assertEquals(0L, stats.getAverageDurationMs());
        assertEquals(0L, stats.getTotalTokens());
        assertEquals(30, stats.getDailyCalls30d().size(), "최근 30 일 채움");
        // 알려진 provider 4 종 + UNKNOWN 모두 0 으로 초기화
        assertEquals(0L, stats.getCallsByProvider().get("OPENAI"));
        assertEquals(0L, stats.getCallsByProvider().get("GEMINI"));
        assertEquals(0L, stats.getCallsByProvider().get("CLAUDE"));
        assertEquals(0L, stats.getCallsByProvider().get("REPLICATE"));
    }

    @Test
    @DisplayName("getUsageStats — provider 라벨이 model prefix 로 집계됨")
    void getUsageStats_modelGrouping() {
        when(usageLogRepository.countByTenantAndPeriod(eq(TENANT_ID), any(), any())).thenReturn(100L);
        when(usageLogRepository.countSuccessByTenantAndPeriod(eq(TENANT_ID), any(), any())).thenReturn(95L);
        when(usageLogRepository.sumTokensByTenantAndPeriod(eq(TENANT_ID), any(), any())).thenReturn(12000L);
        when(usageLogRepository.averageDurationByTenantAndPeriod(eq(TENANT_ID), any(), any())).thenReturn(840.0);
        when(usageLogRepository.countByCallerInPeriod(eq(TENANT_ID), any(), any())).thenReturn(List.of(
                new Object[]{"wellness", 60L},
                new Object[]{"healing", 40L}
        ));
        when(usageLogRepository.countByModelInPeriod(eq(TENANT_ID), any(), any())).thenReturn(List.of(
                new Object[]{"gpt-4o-mini", 70L},
                new Object[]{"gemini-2.5-flash", 25L},
                new Object[]{"meta/llama-3", 5L}
        ));
        when(usageLogRepository.countDailyByTenantAndPeriod(eq(TENANT_ID), any(), any())).thenReturn(List.of());

        AiUsageStatsResponse stats = service.getUsageStats(TENANT_ID, "month");

        assertEquals(70L, stats.getCallsByProvider().get("OPENAI"));
        assertEquals(25L, stats.getCallsByProvider().get("GEMINI"));
        assertEquals(5L, stats.getCallsByProvider().get("REPLICATE"));
        assertEquals(0L, stats.getCallsByProvider().get("CLAUDE"));
        assertEquals(60L, stats.getCallsByCaller().get("wellness"));
        assertEquals(40L, stats.getCallsByCaller().get("healing"));
        assertEquals(95.0, stats.getSuccessRate());
        assertEquals(5.0, stats.getFailureRate());
        assertEquals(840L, stats.getAverageDurationMs());
        assertEquals(12000L, stats.getTotalTokens());
    }

    // ---- 로그 페이징 + provider 필터 ----

    @Test
    @DisplayName("getUsageLogs — status='success' → isSuccess=TRUE 위임")
    void getUsageLogs_statusSuccess_passesTrue() {
        Pageable pageable = PageRequest.of(0, 50);
        when(usageLogRepository.findPageByTenantWithFilters(eq(TENANT_ID), eq(null), eq(Boolean.TRUE), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(), pageable, 0));

        Page<AiUsageLogResponse> result = service.getUsageLogs(TENANT_ID, null, null, "success", pageable);

        assertNotNull(result);
        assertEquals(0, result.getTotalElements());
    }

    @Test
    @DisplayName("getUsageLogs — provider='openai' 필터 시 model prefix 가 다른 행은 제외")
    void getUsageLogs_providerFilter_excludesOthers() {
        Pageable pageable = PageRequest.of(0, 50);
        AiUsageLog openaiLog = AiUsageLog.builder()
                .id(1L).tenantId(TENANT_ID).requestType("wellness").model("gpt-4o-mini").isSuccess(true).build();
        AiUsageLog geminiLog = AiUsageLog.builder()
                .id(2L).tenantId(TENANT_ID).requestType("wellness").model("gemini-2.5-flash").isSuccess(true).build();
        when(usageLogRepository.findPageByTenantWithFilters(eq(TENANT_ID), eq(null), eq(null), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(openaiLog, geminiLog), pageable, 2));

        Page<AiUsageLogResponse> result = service.getUsageLogs(TENANT_ID, "openai", null, null, pageable);

        assertEquals(1, result.getContent().size());
        assertEquals("OPENAI", result.getContent().get(0).getAiProvider());
        assertEquals(1L, result.getContent().get(0).getId());
    }

    // ---- 상세 ----

    @Test
    @DisplayName("getLogDetail — 타 테넌트의 로그는 Optional.empty()")
    void getLogDetail_otherTenant_empty() {
        AiUsageLog other = AiUsageLog.builder()
                .id(11L).tenantId("other-tenant").model("gpt-4o-mini").build();
        when(usageLogRepository.findById(11L)).thenReturn(Optional.of(other));

        Optional<AiUsageLogDetailResponse> result = service.getLogDetail(TENANT_ID, 11L);

        assertTrue(result.isEmpty(), "다른 테넌트의 로그는 노출 금지");
    }

    @Test
    @DisplayName("getLogDetail — id null → Optional.empty()")
    void getLogDetail_nullId_empty() {
        Optional<AiUsageLogDetailResponse> result = service.getLogDetail(TENANT_ID, null);
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("getLogDetail — 동일 테넌트 + 존재하는 로그 → 정상 본문")
    void getLogDetail_sameTenant_returnsBody() {
        AiUsageLog log = AiUsageLog.builder()
                .id(42L)
                .tenantId(TENANT_ID)
                .requestType("psych")
                .model("gpt-4o")
                .isSuccess(true)
                .responseTimeMs(900L)
                .promptTokens(80)
                .completionTokens(40)
                .totalTokens(120)
                .createdAt(LocalDateTime.now())
                .build();
        when(usageLogRepository.findById(42L)).thenReturn(Optional.of(log));

        AiUsageLogDetailResponse detail = service.getLogDetail(TENANT_ID, 42L).orElseThrow();

        assertEquals(42L, detail.getId());
        assertEquals("OPENAI", detail.getAiProvider());
        assertEquals("success", detail.getStatus());
        assertEquals(120, detail.getTotalTokens());
        assertNull(detail.getErrorMessage());
    }
}
