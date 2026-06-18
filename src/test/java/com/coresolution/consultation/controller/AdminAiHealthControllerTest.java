package com.coresolution.consultation.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.ai.AiProviderHealthService;
import com.coresolution.consultation.service.ai.dto.AiProviderHealth;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.dto.ErrorResponse;
import java.time.Instant;
import jakarta.servlet.http.HttpSession;
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
 * {@link AdminAiHealthController} 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-05-23
 */
@ExtendWith({MockitoExtension.class, SecurityContextIsolationExtension.class})
@DisplayName("AdminAiHealthController")
class AdminAiHealthControllerTest {

    private static final String TENANT_ID = "tenant-ctrl-test";

    @Mock
    private AiProviderHealthService healthService;

    @Mock
    private HttpSession session;

    @InjectMocks
    private AdminAiHealthController controller;

    @Test
    @DisplayName("401 — 로그인 사용자 없음")
    void getHealth_noUser_returns401() {
        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(null);

            ResponseEntity<?> response = controller.getHealth(session);

            assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
            assertNotNull(response.getBody());
            ErrorResponse body = (ErrorResponse) response.getBody();
            assertEquals("로그인이 필요합니다.", body.getMessage());
        }
    }

    @Test
    @DisplayName("403 — 테넌트 정보 없음")
    void getHealth_noTenantId_returns403() {
        User user = User.builder().build();
        user.setTenantId(null);
        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(user);

            ResponseEntity<?> response = controller.getHealth(session);

            assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
            ErrorResponse body = (ErrorResponse) response.getBody();
            assertEquals("테넌트 정보가 없습니다.", body.getMessage());
        }
    }

    @Test
    @DisplayName("403 — 빈 tenantId")
    void getHealth_emptyTenantId_returns403() {
        User user = User.builder().build();
        user.setTenantId("");
        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(user);

            ResponseEntity<?> response = controller.getHealth(session);

            assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        }
    }

    @Test
    @DisplayName("200 — 헬스 DTO 정상 반환")
    void getHealth_validUser_returns200() {
        User user = User.builder().build();
        user.setTenantId(TENANT_ID);
        AiProviderHealth health = AiProviderHealth.builder()
                .tenantId(TENANT_ID)
                .activeProvider("openai")
                .openaiKeyRegistered(true)
                .geminiKeyRegistered(false)
                .checkedAt(Instant.now())
                .build();
        when(healthService.checkHealth(TENANT_ID)).thenReturn(health);

        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(user);

            ResponseEntity<?> response = controller.getHealth(session);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            ApiResponse<?> body = (ApiResponse<?>) response.getBody();
            assertNotNull(body);
            assertEquals(true, body.isSuccess());
            AiProviderHealth data = (AiProviderHealth) body.getData();
            assertEquals(TENANT_ID, data.getTenantId());
            assertEquals("openai", data.getActiveProvider());
            assertEquals(true, data.isOpenaiKeyRegistered());
            verify(healthService).checkHealth(TENANT_ID);
        }
    }

    @Test
    @DisplayName("200 — gemini 활성 프로바이더")
    void getHealth_geminiProvider_returns200() {
        User user = User.builder().build();
        user.setTenantId(TENANT_ID);
        AiProviderHealth health = AiProviderHealth.builder()
                .tenantId(TENANT_ID)
                .activeProvider("gemini")
                .openaiKeyRegistered(false)
                .geminiKeyRegistered(true)
                .checkedAt(Instant.now())
                .build();
        when(healthService.checkHealth(TENANT_ID)).thenReturn(health);

        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(user);

            ResponseEntity<?> response = controller.getHealth(session);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            ApiResponse<?> body = (ApiResponse<?>) response.getBody();
            AiProviderHealth data = (AiProviderHealth) body.getData();
            assertEquals("gemini", data.getActiveProvider());
        }
    }
}
