package com.coresolution.consultation.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.consultation.service.ai.AiProviderResolver;
import com.coresolution.consultation.utils.SessionUtils;
import jakarta.servlet.http.HttpSession;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import com.coresolution.testsupport.SecurityContextIsolationExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * {@link SystemConfigController} 의 AI 프로바이더 변경 가드 단위 테스트.
 *
 * <p>트랙 B PR-3 (2026-05-23): 키 미등록 provider 선택 시 400 + 메시지,
 * 통과 시 service 호출·캐시 무효화·tenantId null 시 403 분기를 검증한다.
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@ExtendWith({MockitoExtension.class, SecurityContextIsolationExtension.class})
@DisplayName("SystemConfigController — AI provider 변경 가드")
class SystemConfigControllerAiProviderGuardTest {

    private static final String TENANT_ID = "tenant-pr3-guard";

    @Mock
    private SystemConfigService systemConfigService;

    @Mock
    private AiProviderResolver aiProviderResolver;

    @Mock
    private HttpSession session;

    @InjectMocks
    private SystemConfigController controller;

    private User adminUser(String tenantId) {
        User user = User.builder().build();
        user.setRole(UserRole.ADMIN);
        user.setTenantId(tenantId);
        return user;
    }

    @Test
    @DisplayName("setAiDefaultProvider — 등록된 provider 선택 시 200 + 캐시 무효화")
    void setAiDefaultProvider_registered_returns200() {
        User user = adminUser(TENANT_ID);
        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(user);
            when(aiProviderResolver.isProviderKeyRegistered(TENANT_ID, "openai")).thenReturn(true);

            Map<String, String> request = new HashMap<>();
            request.put("providerId", "openai");

            ResponseEntity<Map<String, Object>> response = controller.setAiDefaultProvider(request, session);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            Map<String, Object> body = response.getBody();
            assertNotNull(body);
            assertEquals(true, body.get("success"));
            verify(systemConfigService).setAiDefaultProvider("openai");
            verify(aiProviderResolver).invalidate(TENANT_ID);
        }
    }

    @Test
    @DisplayName("setAiDefaultProvider — 미등록 provider 선택 시 400 + 메시지")
    void setAiDefaultProvider_notRegistered_returns400() {
        User user = adminUser(TENANT_ID);
        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(user);
            when(aiProviderResolver.isProviderKeyRegistered(TENANT_ID, "gemini")).thenReturn(false);

            Map<String, String> request = new HashMap<>();
            request.put("providerId", "gemini");

            ResponseEntity<Map<String, Object>> response = controller.setAiDefaultProvider(request, session);

            assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
            Map<String, Object> body = response.getBody();
            assertNotNull(body);
            assertEquals(false, body.get("success"));
            assertEquals("선택한 provider 의 API 키가 등록되지 않았습니다.", body.get("message"));
            verify(systemConfigService, never()).setAiDefaultProvider(anyString());
            verify(aiProviderResolver, never()).invalidate(anyString());
        }
    }

    @Test
    @DisplayName("setAiDefaultProvider — tenantId null 시 403")
    void setAiDefaultProvider_nullTenant_returns403() {
        User user = adminUser(null);
        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(user);

            Map<String, String> request = new HashMap<>();
            request.put("providerId", "openai");

            ResponseEntity<Map<String, Object>> response = controller.setAiDefaultProvider(request, session);

            assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
            Map<String, Object> body = response.getBody();
            assertNotNull(body);
            assertEquals(false, body.get("success"));
            assertEquals("테넌트 정보가 없습니다.", body.get("message"));
            verify(systemConfigService, never()).setAiDefaultProvider(anyString());
            verify(aiProviderResolver, never()).invalidate(anyString());
        }
    }

    @Test
    @DisplayName("setAiDefaultProvider — providerId 누락 시 400 (가드 미진입)")
    void setAiDefaultProvider_missingProviderId_returns400() {
        User user = adminUser(TENANT_ID);
        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(user);

            Map<String, String> request = new HashMap<>();

            ResponseEntity<Map<String, Object>> response = controller.setAiDefaultProvider(request, session);

            assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
            Map<String, Object> body = response.getBody();
            assertNotNull(body);
            assertEquals("providerId는 필수입니다.", body.get("message"));
            verify(aiProviderResolver, never()).isProviderKeyRegistered(anyString(), anyString());
        }
    }

    @Test
    @DisplayName("setConfig(AI_DEFAULT_PROVIDER) — 미등록 provider 시 400 + 캐시 무효화 미호출")
    void setConfig_aiDefaultProvider_notRegistered_returns400() {
        User user = adminUser(TENANT_ID);
        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(user);
            when(aiProviderResolver.isProviderKeyRegistered(TENANT_ID, "gemini")).thenReturn(false);

            Map<String, String> request = new HashMap<>();
            request.put("configValue", "gemini");
            request.put("description", "기본 AI 프로바이더");
            request.put("category", "AI");

            ResponseEntity<Map<String, Object>> response =
                    controller.setConfig("AI_DEFAULT_PROVIDER", request, session);

            assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
            Map<String, Object> body = response.getBody();
            assertEquals(false, body.get("success"));
            assertEquals("선택한 provider 의 API 키가 등록되지 않았습니다.", body.get("message"));
            verify(systemConfigService, never())
                    .setConfigValue(anyString(), anyString(), any(), any());
            verify(aiProviderResolver, never()).invalidate(anyString());
        }
    }

    @Test
    @DisplayName("setConfig(AI_DEFAULT_PROVIDER) — 등록된 provider 시 200 + 캐시 무효화")
    void setConfig_aiDefaultProvider_registered_returns200() {
        User user = adminUser(TENANT_ID);
        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(user);
            when(aiProviderResolver.isProviderKeyRegistered(TENANT_ID, "openai")).thenReturn(true);

            Map<String, String> request = new HashMap<>();
            request.put("configValue", "openai");
            request.put("description", "기본 AI 프로바이더");
            request.put("category", "AI");

            ResponseEntity<Map<String, Object>> response =
                    controller.setConfig("AI_DEFAULT_PROVIDER", request, session);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            Map<String, Object> body = response.getBody();
            assertEquals(true, body.get("success"));
            verify(systemConfigService).setConfigValue(
                    eq("AI_DEFAULT_PROVIDER"), eq("openai"), eq("기본 AI 프로바이더"), eq("AI"));
            verify(aiProviderResolver).invalidate(TENANT_ID);
        }
    }

    @Test
    @DisplayName("setConfig(다른 키) — 가드 미적용 (resolver 미호출)")
    void setConfig_nonAiKey_skipsGuard() {
        User user = adminUser(TENANT_ID);
        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(user);
            // resolver 호출이 일어나면 안 됨 (lenient: 다른 mock 검증 위해)
            lenient().when(aiProviderResolver.isProviderKeyRegistered(anyString(), anyString())).thenReturn(false);

            Map<String, String> request = new HashMap<>();
            request.put("configValue", "anyValue");
            request.put("description", "임의 설정");
            request.put("category", "ETC");

            ResponseEntity<Map<String, Object>> response =
                    controller.setConfig("OTHER_CONFIG_KEY", request, session);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            Map<String, Object> body = response.getBody();
            assertNotNull(body);
            assertTrue((Boolean) body.get("success"));
            verify(aiProviderResolver, never()).isProviderKeyRegistered(anyString(), anyString());
            verify(aiProviderResolver, never()).invalidate(anyString());
            verify(systemConfigService).setConfigValue(
                    eq("OTHER_CONFIG_KEY"), eq("anyValue"), eq("임의 설정"), eq("ETC"));
        }
    }
}
