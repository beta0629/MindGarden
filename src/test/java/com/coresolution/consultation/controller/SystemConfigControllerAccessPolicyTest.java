package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.SystemConfigAccessPolicy;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.SessionSecurityPolicyService;
import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.consultation.service.ai.AiProviderResolver;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import jakarta.servlet.http.HttpSession;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * {@link SystemConfigController} 접근 정책 단위 테스트.
 *
 * <p>P0 보안(2026-10-03) 검증 항목:
 * <ul>
 *   <li>미인증 / 비-ADMIN(STAFF·CONSULTANT·CLIENT) → 403, 서비스 호출 없음</li>
 *   <li>allow-list 밖 임의 키 → 404, 값 미노출</li>
 *   <li>시크릿성 키 → 마스킹 값 + 설정 여부만 응답 (평문 픽스처 미포함)</li>
 *   <li>AI 키·URL·모델 쓰기 → 403 (운영자 전용)</li>
 *   <li>tenantId 는 세션 사용자에서만 결정 — 다른 테넌트 컨텍스트를 덮어쓴다</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-10-03
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("SystemConfigController — allow-list + 마스킹 + 테넌트 스코프")
class SystemConfigControllerAccessPolicyTest {

    private static final String TENANT_ID = "tenant-sec-own";
    private static final String OTHER_TENANT_ID = "tenant-sec-other";

    /** 테스트 픽스처 — 응답 어디에도 나타나선 안 되는 평문. */
    private static final String FIXTURE_SECRET = "sk-fixture-NEVER-LEAK-9876";

    private static final String OPENAI_API_KEY = "OPENAI_API_KEY";
    private static final String ARBITRARY_KEY = "PORTONE_WEBHOOK_SECRET";

    @Mock
    private SystemConfigService systemConfigService;

    @Mock
    private AiProviderResolver aiProviderResolver;

    @Mock
    private SessionSecurityPolicyService sessionSecurityPolicyService;

    @Mock
    private HttpSession session;

    @InjectMocks
    private SystemConfigController controller;

    @AfterEach
    void clearTenantContext() {
        TenantContextHolder.clear();
    }

    private User userWithRole(UserRole role, String tenantId) {
        User user = User.builder().email("sec-test@example.com").build();
        user.setRole(role);
        user.setTenantId(tenantId);
        return user;
    }

    @Test
    @DisplayName("getConfig — 미인증 403, 서비스 호출 없음")
    void getConfig_unauthenticated_returns403() {
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(null);

            ResponseEntity<Map<String, Object>> response =
                    controller.getConfig(SystemConfigAccessPolicy.WELLNESS_SEND_TIME, session);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
            verify(systemConfigService, never()).getConfigValue(anyString(), anyString());
        }
    }

    @Test
    @DisplayName("getConfig — STAFF·CONSULTANT·CLIENT 403, 서비스 호출 없음")
    void getConfig_nonAdminRoles_return403() {
        for (UserRole role : new UserRole[] {UserRole.STAFF, UserRole.CONSULTANT, UserRole.CLIENT}) {
            try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
                mocked.when(() -> SessionUtils.getCurrentUser(session))
                        .thenReturn(userWithRole(role, TENANT_ID));

                ResponseEntity<Map<String, Object>> response =
                        controller.getConfig(OPENAI_API_KEY, session);

                assertThat(response.getStatusCode()).as("role=%s", role)
                        .isEqualTo(HttpStatus.FORBIDDEN);
            }
        }
        verify(systemConfigService, never()).getConfigValue(anyString(), anyString());
    }

    @Test
    @DisplayName("getConfig — allow-list 밖 키는 404, 값 미노출 + 서비스 호출 없음")
    void getConfig_arbitraryKey_returns404() {
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session))
                    .thenReturn(userWithRole(UserRole.ADMIN, TENANT_ID));

            ResponseEntity<Map<String, Object>> response = controller.getConfig(ARBITRARY_KEY, session);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
            assertThat(response.getBody()).doesNotContainKey("configValue");
            verify(systemConfigService, never()).getConfigValue(anyString(), anyString());
        }
    }

    @Test
    @DisplayName("getConfig — AI API 키는 마스킹 값만, 평문 픽스처가 응답에 없음")
    void getConfig_secretKey_isMasked() {
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session))
                    .thenReturn(userWithRole(UserRole.ADMIN, TENANT_ID));
            when(systemConfigService.getConfigValue(OPENAI_API_KEY, "")).thenReturn(FIXTURE_SECRET);

            ResponseEntity<Map<String, Object>> response = controller.getConfig(OPENAI_API_KEY, session);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            Map<String, Object> body = response.getBody();
            assertThat(body).isNotNull();
            assertThat(body.get("masked")).isEqualTo(true);
            assertThat(body.get("configured")).isEqualTo(true);
            assertThat(String.valueOf(body.get("configValue"))).endsWith("9876");
            assertThat(String.valueOf(body)).doesNotContain(FIXTURE_SECRET);
            assertThat(String.valueOf(body)).doesNotContain("sk-fixture");
        }
    }

    @Test
    @DisplayName("getConfig — 요청 컨텍스트가 타 테넌트여도 세션 테넌트로 스코프")
    void getConfig_usesSessionTenant_notRequestContext() {
        TenantContextHolder.setTenantId(OTHER_TENANT_ID);
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session))
                    .thenReturn(userWithRole(UserRole.ADMIN, TENANT_ID));
            when(systemConfigService.getConfigValue(SystemConfigAccessPolicy.WELLNESS_SEND_TIME, ""))
                    .thenAnswer(invocation -> TenantContextHolder.getTenantId());

            ResponseEntity<Map<String, Object>> response =
                    controller.getConfig(SystemConfigAccessPolicy.WELLNESS_SEND_TIME, session);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).containsEntry("configValue", TENANT_ID);
            // 호출 이후 원래 컨텍스트 복원
            assertThat(TenantContextHolder.getTenantId()).isEqualTo(OTHER_TENANT_ID);
        }
    }

    @Test
    @DisplayName("getConfig — 세션 tenantId 없으면 403")
    void getConfig_noTenant_returns403() {
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session))
                    .thenReturn(userWithRole(UserRole.ADMIN, null));

            ResponseEntity<Map<String, Object>> response =
                    controller.getConfig(SystemConfigAccessPolicy.WELLNESS_SEND_TIME, session);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
            verify(systemConfigService, never()).getConfigValue(anyString(), anyString());
        }
    }

    @Test
    @DisplayName("setConfig — AI 키·URL·모델은 ADMIN 이어도 403 (운영자 전용), 저장 호출 없음")
    void setConfig_aiProviderKeys_return403() {
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session))
                    .thenReturn(userWithRole(UserRole.ADMIN, TENANT_ID));

            for (String prefix : SystemConfigAccessPolicy.AI_PROVIDER_KEY_PREFIXES) {
                for (String suffix : new String[] {
                    SystemConfigAccessPolicy.SUFFIX_API_KEY,
                    SystemConfigAccessPolicy.SUFFIX_API_URL,
                    SystemConfigAccessPolicy.SUFFIX_MODEL
                }) {
                    Map<String, String> request = new HashMap<>();
                    request.put("configValue", FIXTURE_SECRET);

                    ResponseEntity<Map<String, Object>> response =
                            controller.setConfig(prefix + suffix, request, session);

                    assertThat(response.getStatusCode()).as("key=%s", prefix + suffix)
                            .isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(String.valueOf(response.getBody())).doesNotContain(FIXTURE_SECRET);
                }
            }
        }
        verify(systemConfigService, never())
                .setConfigValue(anyString(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("setConfig — 비-ADMIN 403, 저장 호출 없음")
    void setConfig_nonAdmin_returns403() {
        for (UserRole role : new UserRole[] {UserRole.STAFF, UserRole.CONSULTANT, UserRole.CLIENT}) {
            try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
                mocked.when(() -> SessionUtils.getCurrentUser(session))
                        .thenReturn(userWithRole(role, TENANT_ID));

                Map<String, String> request = new HashMap<>();
                request.put("configValue", "true");

                ResponseEntity<Map<String, Object>> response = controller.setConfig(
                        SystemConfigAccessPolicy.WELLNESS_AUTO_SEND_ENABLED, request, session);

                assertThat(response.getStatusCode()).as("role=%s", role)
                        .isEqualTo(HttpStatus.FORBIDDEN);
            }
        }
        verify(systemConfigService, never())
                .setConfigValue(anyString(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("getOpenAIConfig — API 키 마스킹, 평문 픽스처 미노출")
    void getOpenAIConfig_masksApiKey() {
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session))
                    .thenReturn(userWithRole(UserRole.ADMIN, TENANT_ID));
            when(systemConfigService.getOpenAIApiKey()).thenReturn(FIXTURE_SECRET);
            when(systemConfigService.getOpenAIApiUrl()).thenReturn("https://example.invalid/v1");
            when(systemConfigService.getOpenAIModel()).thenReturn("gpt-test");

            ResponseEntity<Map<String, Object>> response = controller.getOpenAIConfig(session);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(String.valueOf(response.getBody())).doesNotContain(FIXTURE_SECRET);
            assertThat(response.getBody()).containsEntry("apiKeyConfigured", true);
        }
    }

    @Test
    @DisplayName("getConfigsByCategory — 비-ADMIN 403, 서비스 호출 없음")
    void getConfigsByCategory_nonAdmin_returns403() {
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session))
                    .thenReturn(userWithRole(UserRole.STAFF, TENANT_ID));

            ResponseEntity<Map<String, Object>> response =
                    controller.getConfigsByCategory("AI", session);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
            verify(systemConfigService, never()).getConfigsByCategory(anyString());
        }
    }
}
