package com.coresolution.consultation.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.ai.AiUsageStatsService;
import com.coresolution.consultation.service.ai.dto.AiUsageLogDetailResponse;
import com.coresolution.consultation.service.ai.dto.AiUsageLogResponse;
import com.coresolution.consultation.service.ai.dto.AiUsageStatsResponse;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.dto.ErrorResponse;
import jakarta.servlet.http.HttpSession;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import com.coresolution.testsupport.SecurityContextIsolationExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * {@link AdminAiUsageController} 단위 테스트.
 *
 * <p>트랙 B PR-4 (2026-05-24): 통계·로그·상세 3 엔드포인트 가드 매트릭스 검증.
 * 권한·tenantId·페이징 안전 처리·서비스 호출 위임을 모두 다룬다.</p>
 *
 * @author CoreSolution
 * @since 2026-05-24
 */
@ExtendWith({MockitoExtension.class, SecurityContextIsolationExtension.class})
@DisplayName("AdminAiUsageController")
class AdminAiUsageControllerTest {

    private static final String TENANT_ID = "tenant-ai-usage";

    @Mock
    private AiUsageStatsService aiUsageStatsService;

    @Mock
    private HttpSession session;

    @InjectMocks
    private AdminAiUsageController controller;

    private User adminUser() {
        User user = User.builder().build();
        user.setTenantId(TENANT_ID);
        return user;
    }

    // -------- /usage-stats --------

    @Test
    @DisplayName("usage-stats — 401: 로그인 사용자 없음")
    void getUsageStats_noUser_returns401() {
        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(null);

            ResponseEntity<?> response = controller.getUsageStats("today", session);

            assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody() instanceof ErrorResponse);
            verify(aiUsageStatsService, never()).getUsageStats(anyString(), anyString());
        }
    }

    @Test
    @DisplayName("usage-stats — 403: 빈 tenantId")
    void getUsageStats_emptyTenantId_returns403() {
        User user = User.builder().build();
        user.setTenantId("");
        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(user);

            ResponseEntity<?> response = controller.getUsageStats(null, session);

            assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
            verify(aiUsageStatsService, never()).getUsageStats(anyString(), anyString());
        }
    }

    @Test
    @DisplayName("usage-stats — 200: 정상 응답 + 서비스 위임")
    void getUsageStats_validUser_returns200() {
        AiUsageStatsResponse stats = AiUsageStatsResponse.builder()
                .tenantId(TENANT_ID)
                .period("today")
                .requestedPeriod("today")
                .callsToday(10)
                .callsThisWeek(50)
                .callsThisMonth(200)
                .callsByProvider(Map.of("OPENAI", 150L, "GEMINI", 50L))
                .callsByCaller(Map.of("wellness", 100L))
                .successRate(95.0)
                .failureRate(5.0)
                .fallbackUsageRate(-1.0)
                .averageDurationMs(800L)
                .totalTokens(12000L)
                .dailyCalls30d(List.of())
                .build();
        when(aiUsageStatsService.getUsageStats(TENANT_ID, "today")).thenReturn(stats);

        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(adminUser());

            ResponseEntity<?> response = controller.getUsageStats("today", session);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            ApiResponse<?> body = (ApiResponse<?>) response.getBody();
            assertNotNull(body);
            AiUsageStatsResponse data = (AiUsageStatsResponse) body.getData();
            assertEquals(TENANT_ID, data.getTenantId());
            assertEquals(10L, data.getCallsToday());
            verify(aiUsageStatsService).getUsageStats(TENANT_ID, "today");
        }
    }

    @Test
    @DisplayName("usage-stats — period 파라미터를 응답의 requestedPeriod 로 echo (3종 호출 수는 항상 반환)")
    void getUsageStats_echoesRequestedPeriod() {
        AiUsageStatsResponse stats = AiUsageStatsResponse.builder()
                .tenantId(TENANT_ID)
                .period("week")
                .requestedPeriod("week")
                .callsToday(7)
                .callsThisWeek(21)
                .callsThisMonth(98)
                .callsByProvider(Map.of("OPENAI", 70L))
                .callsByCaller(Map.of("wellness", 50L))
                .successRate(100.0)
                .failureRate(0.0)
                .fallbackUsageRate(-1.0)
                .averageDurationMs(700L)
                .totalTokens(8000L)
                .dailyCalls30d(List.of())
                .build();
        when(aiUsageStatsService.getUsageStats(TENANT_ID, "week")).thenReturn(stats);

        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(adminUser());

            ResponseEntity<?> response = controller.getUsageStats("week", session);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            ApiResponse<?> body = (ApiResponse<?>) response.getBody();
            AiUsageStatsResponse data = (AiUsageStatsResponse) body.getData();
            assertEquals("week", data.getRequestedPeriod(),
                    "신규 클라이언트는 requestedPeriod 로 라벨 식별");
            assertEquals("week", data.getPeriod(),
                    "legacy period alias 도 동일 값으로 유지 (backward-compat)");
            // period 와 무관하게 3종 호출 수 모두 반환되는지 확인
            assertEquals(7L, data.getCallsToday());
            assertEquals(21L, data.getCallsThisWeek());
            assertEquals(98L, data.getCallsThisMonth());
        }
    }

    // -------- /usage-logs --------

    @Test
    @DisplayName("usage-logs — 401: 로그인 사용자 없음")
    void getUsageLogs_noUser_returns401() {
        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(null);

            ResponseEntity<?> response = controller.getUsageLogs(null, null, null, 0, 50, session);

            assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        }
    }

    @Test
    @DisplayName("usage-logs — 403: tenantId null")
    void getUsageLogs_noTenantId_returns403() {
        User user = User.builder().build();
        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(user);

            ResponseEntity<?> response = controller.getUsageLogs(null, null, null, 0, 50, session);

            assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        }
    }

    @Test
    @DisplayName("usage-logs — 200: 페이징 + 필터 위임")
    void getUsageLogs_validUser_returns200() {
        AiUsageLogResponse row = AiUsageLogResponse.builder()
                .id(1L)
                .aiProvider("OPENAI")
                .requestType("wellness")
                .model("gpt-4o-mini")
                .status("success")
                .durationMs(500L)
                .tokenCount(100)
                .createdAt(LocalDateTime.now())
                .build();
        Page<AiUsageLogResponse> page = new PageImpl<>(List.of(row), PageRequest.of(0, 50), 1);
        when(aiUsageStatsService.getUsageLogs(eq(TENANT_ID), eq("openai"), eq("wellness"), eq("success"), any(Pageable.class)))
                .thenReturn(page);

        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(adminUser());

            ResponseEntity<?> response = controller.getUsageLogs("openai", "wellness", "success", 0, 50, session);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            ApiResponse<?> body = (ApiResponse<?>) response.getBody();
            assertNotNull(body);
            assertTrue(body.isSuccess());
        }
    }

    @Test
    @DisplayName("usage-logs — size 음수/초과 시 1 ~ 200 으로 정규화")
    void getUsageLogs_clampsPageSize() {
        Page<AiUsageLogResponse> page = new PageImpl<>(List.of(), PageRequest.of(0, 200), 0);
        when(aiUsageStatsService.getUsageLogs(anyString(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(page);

        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(adminUser());

            ResponseEntity<?> response = controller.getUsageLogs(null, null, null, -5, 999, session);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            // 페이지 size 가 MAX_PAGE_SIZE(200) 으로 클램프된 Pageable 이 위임되어야 한다.
            org.mockito.ArgumentCaptor<Pageable> captor = org.mockito.ArgumentCaptor.forClass(Pageable.class);
            verify(aiUsageStatsService).getUsageLogs(eq(TENANT_ID), eq(null), eq(null), eq(null), captor.capture());
            Pageable pageable = captor.getValue();
            assertEquals(0, pageable.getPageNumber(), "음수 page 는 0 으로 클램프");
            assertEquals(200, pageable.getPageSize(), "초과 size 는 200 으로 클램프");
        }
    }

    // -------- /usage-logs/{id}/detail --------

    @Test
    @DisplayName("usage-logs detail — 401: 로그인 사용자 없음")
    void getUsageLogDetail_noUser_returns401() {
        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(null);

            ResponseEntity<?> response = controller.getUsageLogDetail(1L, session);

            assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        }
    }

    @Test
    @DisplayName("usage-logs detail — 404: 미존재 / 타 테넌트")
    void getUsageLogDetail_notFound_returns404() {
        when(aiUsageStatsService.getLogDetail(TENANT_ID, 999L)).thenReturn(Optional.empty());

        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(adminUser());

            ResponseEntity<?> response = controller.getUsageLogDetail(999L, session);

            assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        }
    }

    @Test
    @DisplayName("usage-logs detail — 200: 정상 본문 + N3 보강 prompt/response 노출 (V20260529_001)")
    void getUsageLogDetail_found_returns200_withPromptAndResponse() {
        AiUsageLogDetailResponse detail = AiUsageLogDetailResponse.builder()
                .id(7L)
                .aiProvider("GEMINI")
                .requestType("psych")
                .model("gemini-2.5-flash")
                .status("success")
                .durationMs(1200L)
                .promptTokens(100)
                .completionTokens(50)
                .totalTokens(150)
                .promptBody("[system]\nyou are\n\n[user]\nhello")
                .responseBody("hi there")
                .createdAt(LocalDateTime.now())
                .build();
        when(aiUsageStatsService.getLogDetail(TENANT_ID, 7L)).thenReturn(Optional.of(detail));

        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(adminUser());

            ResponseEntity<?> response = controller.getUsageLogDetail(7L, session);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            ApiResponse<?> body = (ApiResponse<?>) response.getBody();
            assertNotNull(body);
            AiUsageLogDetailResponse data = (AiUsageLogDetailResponse) body.getData();
            assertEquals(7L, data.getId());
            assertEquals("GEMINI", data.getAiProvider(),
                    "ai_provider 컬럼 값이 정확히 전달되어야 함 (N3, default OPENAI 고정 결함 해소)");
            assertEquals("[system]\nyou are\n\n[user]\nhello", data.getPromptBody(),
                    "promptBody 가 상세 모달에 노출되어야 함 (V20260529_001)");
            assertEquals("hi there", data.getResponseBody(),
                    "responseBody 가 상세 모달에 노출되어야 함 (V20260529_001)");
        }
    }
}
