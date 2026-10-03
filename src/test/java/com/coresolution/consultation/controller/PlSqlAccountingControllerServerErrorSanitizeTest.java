package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Map;
import com.coresolution.consultation.constant.ServerErrorMessages;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.PlSqlAccountingService;
import com.coresolution.consultation.util.ServerErrorResponses;
import com.coresolution.consultation.utils.SessionUtils;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * 컨트롤러 catch 블록 500 응답 — 예외 원문(SQL)이 응답에 실리지 않고 공통 문구 + traceId 로 응답한다.
 * 비즈니스 예외(IllegalArgumentException)는 덮지 않고 전역 처리기로 넘긴다. 미인증 401 은 그대로다.
 *
 * @author MindGarden
 * @since 2026-10-03
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PL/SQL 회계 — 500 응답 문구 정리")
class PlSqlAccountingControllerServerErrorSanitizeTest {

    private static final String SQL_LEAK =
            "could not execute statement; SQL [call ValidateIntegratedAmount(?, ?, ?)]; Duplicate entry";

    @Mock private PlSqlAccountingService plSqlAccountingService;
    @Mock private DynamicPermissionService dynamicPermissionService;
    @Mock private HttpSession session;

    private MockedStatic<SessionUtils> sessionUtilsStatic;
    private PlSqlAccountingController controller;

    @BeforeEach
    void setUp() {
        sessionUtilsStatic = mockStatic(SessionUtils.class);
        controller = new PlSqlAccountingController(plSqlAccountingService, dynamicPermissionService);
    }

    @AfterEach
    void tearDown() {
        sessionUtilsStatic.close();
    }

    @Test
    @DisplayName("서비스 DB 예외 → 500 · 공통 문구 · traceId · SQL 원문 없음")
    void serviceDbFailure_returnsGenericBody() {
        loginAsAdmin();
        when(plSqlAccountingService.validateIntegratedAmount(anyLong(), any(BigDecimal.class)))
                .thenThrow(new DataIntegrityViolationException(SQL_LEAK));

        ResponseEntity<Map<String, Object>> response =
                controller.validateIntegratedAmount(Map.of("mappingId", 1, "inputAmount", 1000), session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody())
                .containsEntry("success", false)
                .containsEntry("message", ServerErrorMessages.INTERNAL_SERVER_ERROR)
                .containsKey(ServerErrorResponses.TRACE_ID_KEY);
        assertThat(response.getBody().toString())
                .doesNotContain("SQL").doesNotContain("ValidateIntegratedAmount").doesNotContain("Duplicate");
    }

    @Test
    @DisplayName("반례: 서비스 IllegalArgumentException → 500 으로 덮지 않고 그대로 던짐(전역 400)")
    void businessException_isNotSwallowedInto500() {
        loginAsAdmin();
        IllegalArgumentException business = new IllegalArgumentException("매칭을 찾을 수 없습니다.");
        when(plSqlAccountingService.validateIntegratedAmount(anyLong(), any(BigDecimal.class))).thenThrow(business);

        assertThatThrownBy(() -> controller.validateIntegratedAmount(
                Map.of("mappingId", 1, "inputAmount", 1000), session)).isSameAs(business);
    }

    @Test
    @DisplayName("반례: 미인증 → 401 그대로, 서비스 호출 없음")
    void unauthenticated_stays401() {
        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(null);

        ResponseEntity<Map<String, Object>> response =
                controller.validateIntegratedAmount(Map.of("mappingId", 1, "inputAmount", 1000), session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verifyNoInteractions(plSqlAccountingService);
    }

    private void loginAsAdmin() {
        User admin = new User();
        admin.setId(1L);
        admin.setUserId("admin-sanitize");
        admin.setEmail("admin-sanitize@example.com");
        admin.setName("관리자");
        admin.setPassword("encoded-password-1234");
        admin.setRole(UserRole.ADMIN);
        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(admin);
    }
}
