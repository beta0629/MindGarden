package com.coresolution.consultation.service.ai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
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

    // ---- tenantId 가드 ----

    @Test
    @DisplayName("getUsageStats — tenantId null → IllegalArgumentException")
    void getUsageStats_nullTenant_throws() {
        assertThrows(IllegalArgumentException.class, () -> service.getUsageStats(null, "today"));
    }

    @Test
    @DisplayName("getUsageLogs — tenantId blank → IllegalArgumentException")
    void getUsageLogs_blankTenant_throws() {
        Pageable pageable = PageRequest.of(0, 10);
        assertThrows(IllegalArgumentException.class,
                () -> service.getUsageLogs("  ", null, null, null, pageable));
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
        when(usageLogRepository.countByProviderInPeriod(eq(TENANT_ID), any(), any())).thenReturn(List.of());
        when(usageLogRepository.countDailyByTenantAndPeriod(eq(TENANT_ID), any(), any())).thenReturn(List.of());

        AiUsageStatsResponse stats = service.getUsageStats(TENANT_ID, "today");

        assertEquals(TENANT_ID, stats.getTenantId());
        assertEquals("today", stats.getPeriod());
        assertEquals("today", stats.getRequestedPeriod(),
                "신규 클라이언트는 requestedPeriod 로 라벨 식별 (legacy period 와 동일 값)");
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
    @DisplayName("getUsageStats — period=today 이면 successRate/tokens/duration 이 오늘 구간")
    void getUsageStats_periodToday_usesTodayMetricsWindow() {
        // count: today=10, week=20, month=100
        when(usageLogRepository.countByTenantAndPeriod(eq(TENANT_ID), any(), any()))
                .thenReturn(10L, 20L, 100L);
        // metrics window = today → success 9 / tokens 500 / avg 120
        when(usageLogRepository.countSuccessByTenantAndPeriod(eq(TENANT_ID), any(), any())).thenReturn(9L);
        when(usageLogRepository.sumTokensByTenantAndPeriod(eq(TENANT_ID), any(), any())).thenReturn(500L);
        when(usageLogRepository.averageDurationByTenantAndPeriod(eq(TENANT_ID), any(), any())).thenReturn(120.0);
        when(usageLogRepository.countByCallerInPeriod(eq(TENANT_ID), any(), any())).thenReturn(List.of());
        when(usageLogRepository.countByProviderInPeriod(eq(TENANT_ID), any(), any())).thenReturn(List.of());
        when(usageLogRepository.countDailyByTenantAndPeriod(eq(TENANT_ID), any(), any())).thenReturn(List.of());

        AiUsageStatsResponse stats = service.getUsageStats(TENANT_ID, "today");

        assertEquals(10L, stats.getCallsToday());
        assertEquals(20L, stats.getCallsThisWeek());
        assertEquals(100L, stats.getCallsThisMonth());
        assertEquals(90.0, stats.getSuccessRate());
        assertEquals(10.0, stats.getFailureRate());
        assertEquals(120L, stats.getAverageDurationMs());
        assertEquals(500L, stats.getTotalTokens());
        assertEquals("today", stats.getRequestedPeriod());
    }

    @Test
    @DisplayName("getUsageStats — provider 라벨이 ai_provider 컬럼으로 집계됨 (N3, V20260529_001)")
    void getUsageStats_providerGroupingFromColumn() {
        when(usageLogRepository.countByTenantAndPeriod(eq(TENANT_ID), any(), any())).thenReturn(100L);
        when(usageLogRepository.countSuccessByTenantAndPeriod(eq(TENANT_ID), any(), any())).thenReturn(95L);
        when(usageLogRepository.sumTokensByTenantAndPeriod(eq(TENANT_ID), any(), any())).thenReturn(12000L);
        when(usageLogRepository.averageDurationByTenantAndPeriod(eq(TENANT_ID), any(), any())).thenReturn(840.0);
        when(usageLogRepository.countByCallerInPeriod(eq(TENANT_ID), any(), any())).thenReturn(List.of(
                new Object[]{"wellness", 60L},
                new Object[]{"healing", 40L}
        ));
        when(usageLogRepository.countByProviderInPeriod(eq(TENANT_ID), any(), any())).thenReturn(List.of(
                new Object[]{"OPENAI", 70L},
                new Object[]{"GEMINI", 25L},
                new Object[]{"REPLICATE", 5L}
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

    @Test
    @DisplayName("getUsageStats — null/blank ai_provider 행은 UNKNOWN 으로 집계 (N3 방어)")
    void getUsageStats_nullProviderRow_aggregatesAsUnknown() {
        when(usageLogRepository.countByTenantAndPeriod(eq(TENANT_ID), any(), any())).thenReturn(10L);
        when(usageLogRepository.countSuccessByTenantAndPeriod(eq(TENANT_ID), any(), any())).thenReturn(10L);
        when(usageLogRepository.sumTokensByTenantAndPeriod(eq(TENANT_ID), any(), any())).thenReturn(100L);
        when(usageLogRepository.averageDurationByTenantAndPeriod(eq(TENANT_ID), any(), any())).thenReturn(100.0);
        when(usageLogRepository.countByCallerInPeriod(eq(TENANT_ID), any(), any())).thenReturn(List.of());
        when(usageLogRepository.countByProviderInPeriod(eq(TENANT_ID), any(), any())).thenReturn(List.of(
                new Object[]{null, 3L},
                new Object[]{"", 2L},
                new Object[]{"OPENAI", 5L}
        ));
        when(usageLogRepository.countDailyByTenantAndPeriod(eq(TENANT_ID), any(), any())).thenReturn(List.of());

        AiUsageStatsResponse stats = service.getUsageStats(TENANT_ID, "month");

        assertEquals(5L, stats.getCallsByProvider().get("OPENAI"));
        assertEquals(5L, stats.getCallsByProvider().get("UNKNOWN"),
                "null + blank provider 행 합계가 UNKNOWN 으로 합쳐져야 함");
    }

    @Test
    @DisplayName("getUsageStats — period null/blank → requestedPeriod=\"month\" 기본 echo")
    void getUsageStats_nullPeriod_echoesMonth() {
        when(usageLogRepository.countByTenantAndPeriod(eq(TENANT_ID), any(), any())).thenReturn(0L);
        when(usageLogRepository.countSuccessByTenantAndPeriod(eq(TENANT_ID), any(), any())).thenReturn(0L);
        when(usageLogRepository.sumTokensByTenantAndPeriod(eq(TENANT_ID), any(), any())).thenReturn(0L);
        when(usageLogRepository.averageDurationByTenantAndPeriod(eq(TENANT_ID), any(), any())).thenReturn(null);
        when(usageLogRepository.countByCallerInPeriod(eq(TENANT_ID), any(), any())).thenReturn(List.of());
        when(usageLogRepository.countByProviderInPeriod(eq(TENANT_ID), any(), any())).thenReturn(List.of());
        when(usageLogRepository.countDailyByTenantAndPeriod(eq(TENANT_ID), any(), any())).thenReturn(List.of());

        AiUsageStatsResponse nullStats = service.getUsageStats(TENANT_ID, null);
        assertEquals("month", nullStats.getRequestedPeriod());
        assertEquals("month", nullStats.getPeriod());

        AiUsageStatsResponse blankStats = service.getUsageStats(TENANT_ID, "  ");
        assertEquals("month", blankStats.getRequestedPeriod());
    }

    // ---- 로그 페이징 + provider 필터 ----

    @Test
    @DisplayName("getUsageLogs — status='success' → isSuccess=TRUE 위임")
    void getUsageLogs_statusSuccess_passesTrue() {
        Pageable pageable = PageRequest.of(0, 50);
        when(usageLogRepository.findPageByTenantWithFilters(
                eq(TENANT_ID), eq(null), eq(null), eq(Boolean.TRUE), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(), pageable, 0));

        Page<AiUsageLogResponse> result = service.getUsageLogs(TENANT_ID, null, null, "success", pageable);

        assertNotNull(result);
        assertEquals(0, result.getTotalElements());
    }

    @Test
    @DisplayName("getUsageLogs — provider='openai' 필터는 SQL 레벨에서 적용 (N3, 정확한 totalElements)")
    void getUsageLogs_providerFilter_sqlLevel() {
        Pageable pageable = PageRequest.of(0, 50);
        AiUsageLog openaiLog = AiUsageLog.builder()
                .id(1L).tenantId(TENANT_ID).aiProvider("OPENAI")
                .requestType("wellness").model("gpt-4o-mini").isSuccess(true).build();
        when(usageLogRepository.findPageByTenantWithFilters(
                eq(TENANT_ID), eq("OPENAI"), eq(null), eq(null), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(openaiLog), pageable, 1));

        Page<AiUsageLogResponse> result = service.getUsageLogs(TENANT_ID, "openai", null, null, pageable);

        assertEquals(1, result.getContent().size());
        assertEquals(1L, result.getTotalElements(),
                "SQL 레벨 필터 → totalElements 가 정확값 (서비스 후처리 근사값 제거, N3)");
        assertEquals("OPENAI", result.getContent().get(0).getAiProvider());
    }

    @Test
    @DisplayName("getUsageLogs — entity.aiProvider 컬럼 값이 DTO 에 그대로 노출 (N3)")
    void getUsageLogs_geminiProvider_useColumnValue() {
        Pageable pageable = PageRequest.of(0, 50);
        AiUsageLog geminiLog = AiUsageLog.builder()
                .id(7L).tenantId(TENANT_ID).aiProvider("GEMINI")
                .requestType("wellness").model("gemini-2.5-flash").isSuccess(true).build();
        when(usageLogRepository.findPageByTenantWithFilters(
                eq(TENANT_ID), eq(null), eq(null), eq(null), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(geminiLog), pageable, 1));

        Page<AiUsageLogResponse> result = service.getUsageLogs(TENANT_ID, null, null, null, pageable);

        assertEquals("GEMINI", result.getContent().get(0).getAiProvider(),
                "DTO 의 aiProvider 는 entity.aiProvider 컬럼 직접 사용 (model prefix 추정 제거)");
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
    @DisplayName("getLogDetail — 동일 테넌트 + 존재하는 로그 → 본문 + N3 prompt/response 노출")
    void getLogDetail_sameTenant_returnsBodyWithPromptAndResponse() {
        AiUsageLog log = AiUsageLog.builder()
                .id(42L)
                .tenantId(TENANT_ID)
                .aiProvider("OPENAI")
                .requestType("psych")
                .model("gpt-4o")
                .isSuccess(true)
                .responseTimeMs(900L)
                .promptTokens(80)
                .completionTokens(40)
                .totalTokens(120)
                .prompt("[system]\nyou are\n\n[user]\nhello")
                .response("hi there")
                .createdAt(LocalDateTime.now())
                .build();
        when(usageLogRepository.findById(42L)).thenReturn(Optional.of(log));

        AiUsageLogDetailResponse detail = service.getLogDetail(TENANT_ID, 42L).orElseThrow();

        assertEquals(42L, detail.getId());
        assertEquals("OPENAI", detail.getAiProvider());
        assertEquals("success", detail.getStatus());
        assertEquals(120, detail.getTotalTokens());
        assertNull(detail.getErrorMessage());
        assertEquals("[system]\nyou are\n\n[user]\nhello", detail.getPromptBody(),
                "promptBody 는 entity.prompt 를 그대로 노출 (V20260529_001)");
        assertEquals("hi there", detail.getResponseBody(),
                "responseBody 는 entity.response 를 그대로 노출 (V20260529_001)");
    }

    @Test
    @DisplayName("getLogDetail — V20260529_001 이전 행 (prompt/response NULL) → null 그대로 노출")
    void getLogDetail_legacyRowWithNullBody_returnsNullFields() {
        AiUsageLog legacy = AiUsageLog.builder()
                .id(99L).tenantId(TENANT_ID).aiProvider("OPENAI")
                .requestType("wellness").model("gpt-4o-mini")
                .isSuccess(true).build();
        when(usageLogRepository.findById(99L)).thenReturn(Optional.of(legacy));

        AiUsageLogDetailResponse detail = service.getLogDetail(TENANT_ID, 99L).orElseThrow();

        assertNull(detail.getPromptBody(), "기존 행은 prompt NULL 보존");
        assertNull(detail.getResponseBody(), "기존 행은 response NULL 보존");
    }
}
