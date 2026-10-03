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
import static org.mockito.Mockito.verifyNoInteractions;

import com.coresolution.consultation.constant.SessionSecurityFlagKeys;
import com.coresolution.consultation.constant.SystemConfigAccessPolicy;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.SessionSecurityPolicyService;
import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.consultation.utils.SessionUtils;
import jakarta.servlet.http.HttpSession;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * {@link SystemConfigController} AI 프로바이더·플랫폼 세션 스위치 운영자 전용 가드 단위 테스트.
 *
 * <p>P1 보안(2026-10-03): 기본 provider 변경·키 테스트·모델 목록·AI 키 저장·플랫폼 세션 스위치 저장은
 * 테넌트 관리자 경로에서 403 이고 서비스·외부 호출이 일어나지 않는다. 테넌트 단위 키는 계속 저장된다.
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SystemConfigController — AI provider·플랫폼 세션 운영자 전용 가드")
class SystemConfigControllerAiProviderGuardTest {

    private static final String TENANT_ID = "tenant-pr3-guard";

    @Mock
    private SystemConfigService systemConfigService;

    @Mock
    private SessionSecurityPolicyService sessionSecurityPolicyService;

    @Mock
    private HttpSession session;

    @InjectMocks
    private SystemConfigController controller;

    private User userWithRole(UserRole role, String tenantId) {
        User user = User.builder().build();
        user.setRole(role);
        user.setTenantId(tenantId);
        return user;
    }

    private ResponseEntity<Map<String, Object>> callAs(
            User user, Function<SystemConfigController, ResponseEntity<Map<String, Object>>> call) {
        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(user);
            return call.apply(controller);
        }
    }

    private static Map<String, String> body(String key, String value) {
        Map<String, String> map = new HashMap<>();
        map.put(key, value);
        return map;
    }

    private static void assertOpsOnly(ResponseEntity<Map<String, Object>> response) {
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        Map<String, Object> responseBody = response.getBody();
        assertNotNull(responseBody);
        assertEquals(false, responseBody.get("success"));
        assertEquals(SystemConfigController.MSG_KEY_OPS_ONLY, responseBody.get("message"));
    }

    @Test
    @DisplayName("setAiDefaultProvider — ADMIN 이어도 403 운영자 전용, 서비스 미호출")
    void setAiDefaultProvider_admin_returns403OpsOnly() {
        ResponseEntity<Map<String, Object>> response = callAs(userWithRole(UserRole.ADMIN, TENANT_ID),
                c -> c.setAiDefaultProvider(body("providerId", "openai"), session));

        assertOpsOnly(response);
        verify(systemConfigService, never()).setAiDefaultProvider(anyString());
    }

    @Test
    @DisplayName("setAiDefaultProvider — tenantId 없는 ADMIN 도 403 운영자 전용")
    void setAiDefaultProvider_nullTenant_returns403() {
        ResponseEntity<Map<String, Object>> response = callAs(userWithRole(UserRole.ADMIN, null),
                c -> c.setAiDefaultProvider(body("providerId", "openai"), session));

        assertOpsOnly(response);
        verifyNoInteractions(systemConfigService);
    }

    @Test
    @DisplayName("setAiDefaultProvider — STAFF 는 403 접근 권한 없음")
    void setAiDefaultProvider_staff_returns403() {
        ResponseEntity<Map<String, Object>> response = callAs(userWithRole(UserRole.STAFF, TENANT_ID),
                c -> c.setAiDefaultProvider(body("providerId", "openai"), session));

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertEquals("접근 권한이 없습니다.", response.getBody().get("message"));
        verifyNoInteractions(systemConfigService);
    }

    @Test
    @DisplayName("키 테스트·모델 목록 4종 — 403, 저장된 키 조회·외부 호출 없음")
    void keyTestAndModelEndpoints_returns403WithoutTouchingKeys() {
        User admin = userWithRole(UserRole.ADMIN, TENANT_ID);
        Map<String, String> exfil = body("apiUrl", "https://attacker.example.test/collect");

        assertOpsOnly(callAs(admin, c -> c.testOpenAIKey(exfil, session)));
        assertOpsOnly(callAs(admin, c -> c.testGeminiKey(exfil, session)));
        assertOpsOnly(callAs(admin, c -> c.getOpenAIModels(exfil, session)));
        assertOpsOnly(callAs(admin, c -> c.getGeminiModels(exfil, session)));

        verifyNoInteractions(systemConfigService);
    }

    @Test
    @DisplayName("setConfig(AI_DEFAULT_PROVIDER) — 403 운영자 전용, 저장 없음")
    void setConfig_aiDefaultProvider_returns403() {
        Map<String, String> request = body("configValue", "gemini");
        request.put("category", "AI");

        ResponseEntity<Map<String, Object>> response = callAs(userWithRole(UserRole.ADMIN, TENANT_ID),
                c -> c.setConfig(SystemConfigAccessPolicy.AI_DEFAULT_PROVIDER, request, session));

        assertOpsOnly(response);
        verify(systemConfigService, never()).setConfigValue(anyString(), anyString(), any(), any());
    }

    @Test
    @DisplayName("setConfig(AI 키·URL·모델) — 403 운영자 전용, 저장 없음")
    void setConfig_aiProviderKeys_returns403() {
        User admin = userWithRole(UserRole.ADMIN, TENANT_ID);
        for (String prefix : SystemConfigAccessPolicy.AI_PROVIDER_KEY_PREFIXES) {
            for (String suffix : new String[] {
                SystemConfigAccessPolicy.SUFFIX_API_KEY,
                SystemConfigAccessPolicy.SUFFIX_API_URL,
                SystemConfigAccessPolicy.SUFFIX_MODEL
            }) {
                String key = prefix + suffix;
                assertOpsOnly(callAs(admin, c -> c.setConfig(key, body("configValue", "x"), session)));
            }
        }
        verifyNoInteractions(systemConfigService);
    }

    @Test
    @DisplayName("setConfig(플랫폼 세션 스위치 3종) — 403 운영자 전용, 저장·캐시 무효화 없음")
    void setConfig_platformSessionSwitches_returns403() {
        User admin = userWithRole(UserRole.ADMIN, TENANT_ID);
        String[] keys = {
            SessionSecurityFlagKeys.OAUTH_REQUIRE_SERVER_VERIFY,
            SessionSecurityFlagKeys.BACKGROUND_401_KEEP_USER,
            SessionSecurityFlagKeys.SOFT_FAIL_ENABLED
        };
        for (String key : keys) {
            assertOpsOnly(callAs(admin, c -> c.setConfig(key, body("configValue", "false"), session)));
        }
        verifyNoInteractions(systemConfigService);
        verifyNoInteractions(sessionSecurityPolicyService);
    }

    @Test
    @DisplayName("setConfig(중복 로그인 허용) — 테넌트 단위라 200 + 캐시 무효화")
    void setConfig_duplicateLogin_stillWritable() {
        org.mockito.Mockito.when(sessionSecurityPolicyService
                .isSessionSecurityConfigKey(SessionSecurityFlagKeys.DUPLICATE_LOGIN_ALLOWED)).thenReturn(true);

        ResponseEntity<Map<String, Object>> response = callAs(userWithRole(UserRole.ADMIN, TENANT_ID),
                c -> c.setConfig(SessionSecurityFlagKeys.DUPLICATE_LOGIN_ALLOWED,
                        body("configValue", "true"), session));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(systemConfigService).setConfigValue(
                eq(SessionSecurityFlagKeys.DUPLICATE_LOGIN_ALLOWED), eq("true"), any(), any());
        verify(sessionSecurityPolicyService).invalidateCache(TENANT_ID);
    }

    @Test
    @DisplayName("setConfig(allow-list 내 비-AI 키) — 200 저장")
    void setConfig_nonAiAllowedKey_returns200() {
        Map<String, String> request = body("configValue", "true");
        request.put("description", "웰니스 자동 발송");
        request.put("category", "NOTIFICATION");

        ResponseEntity<Map<String, Object>> response = callAs(userWithRole(UserRole.ADMIN, TENANT_ID),
                c -> c.setConfig(SystemConfigAccessPolicy.WELLNESS_AUTO_SEND_ENABLED, request, session));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue((Boolean) response.getBody().get("success"));
        verify(systemConfigService).setConfigValue(
                eq(SystemConfigAccessPolicy.WELLNESS_AUTO_SEND_ENABLED),
                eq("true"), eq("웰니스 자동 발송"), eq("NOTIFICATION"));
    }

    @Test
    @DisplayName("setConfig(allow-list 외 임의 키) — 404, 서비스 호출 없음")
    void setConfig_arbitraryKey_returns404() {
        ResponseEntity<Map<String, Object>> response = callAs(userWithRole(UserRole.ADMIN, TENANT_ID),
                c -> c.setConfig("OTHER_CONFIG_KEY", body("configValue", "anyValue"), session));

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        verify(systemConfigService, never())
                .setConfigValue(anyString(), anyString(), anyString(), anyString());
    }
}
