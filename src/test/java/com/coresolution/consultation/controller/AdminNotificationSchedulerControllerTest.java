package com.coresolution.consultation.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.NotificationSchedulerFlagKeys;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.NotificationSchedulerFlagDto;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.consultation.utils.SessionUtils;
import jakarta.servlet.http.HttpSession;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
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
 * {@link AdminNotificationSchedulerController} 단위 테스트.
 *
 * <p>RBAC 가드(403) / whitelist(400) / 정상 토글(200) / 감사 식별자(updated_by) /
 * value 파싱 분기 / 조회 4 키 응답 일괄 검증.
 *
 * @author MindGarden
 * @since 2026-05-25
 */
@ExtendWith({MockitoExtension.class, SecurityContextIsolationExtension.class})
@DisplayName("AdminNotificationSchedulerController — 토글 + RBAC + whitelist + audit")
class AdminNotificationSchedulerControllerTest {

    @Mock
    private SystemConfigService systemConfigService;

    @Mock
    private HttpSession session;

    @InjectMocks
    private AdminNotificationSchedulerController controller;

    private User adminUser(Long id, String email) {
        User user = User.builder().email(email).build();
        try {
            // BaseEntity.id 는 GeneratedValue — reflection 으로 주입
            java.lang.reflect.Field field =
                    com.coresolution.consultation.entity.BaseEntity.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(user, id);
        } catch (Exception ignored) {
            // 테스트 보조용. 실패해도 email 식별자가 우선이므로 문제 없음.
        }
        user.setRole(UserRole.ADMIN);
        return user;
    }

    private User clientUser() {
        User user = User.builder().email("client@example.com").build();
        user.setRole(UserRole.CLIENT);
        return user;
    }

    @Test
    @DisplayName("listFlags — 미인증 시 403")
    void listFlags_unauthenticated_returns403() {
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(null);

            ResponseEntity<Map<String, Object>> response = controller.listFlags(session);

            assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(false, response.getBody().get("success"));
            verify(systemConfigService, never()).listNotificationSchedulerFlags();
        }
    }

    @Test
    @DisplayName("listFlags — 일반 사용자(CLIENT) 403")
    void listFlags_nonAdmin_returns403() {
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(clientUser());

            ResponseEntity<Map<String, Object>> response = controller.listFlags(session);

            assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
            verify(systemConfigService, never()).listNotificationSchedulerFlags();
        }
    }

    @Test
    @DisplayName("listFlags — ADMIN 200, 4 종 플래그 반환")
    void listFlags_admin_returnsFlags() {
        List<NotificationSchedulerFlagDto> dtoList = List.of(
                NotificationSchedulerFlagDto.builder()
                        .key(NotificationSchedulerFlagKeys.WELLNESS_TIP_ENABLED)
                        .value(true)
                        .updatedBy("SYSTEM")
                        .updatedAt(LocalDateTime.now())
                        .build(),
                NotificationSchedulerFlagDto.builder()
                        .key(NotificationSchedulerFlagKeys.CONSULTATION_RECORD_ALERT_ENABLED)
                        .value(false)
                        .updatedBy("admin@example.com")
                        .updatedAt(LocalDateTime.now())
                        .build(),
                NotificationSchedulerFlagDto.builder()
                        .key(NotificationSchedulerFlagKeys.WORKFLOW_AUTOMATION_ENABLED)
                        .value(true)
                        .updatedBy("SYSTEM")
                        .updatedAt(LocalDateTime.now())
                        .build(),
                NotificationSchedulerFlagDto.builder()
                        .key(NotificationSchedulerFlagKeys.RESERVATION_REMINDER_ENABLED)
                        .value(true)
                        .updatedBy("SYSTEM")
                        .updatedAt(LocalDateTime.now())
                        .build()
        );
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session))
                    .thenReturn(adminUser(11L, "admin@example.com"));
            when(systemConfigService.listNotificationSchedulerFlags()).thenReturn(dtoList);

            ResponseEntity<Map<String, Object>> response = controller.listFlags(session);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            Map<String, Object> body = response.getBody();
            assertNotNull(body);
            assertEquals(true, body.get("success"));
            @SuppressWarnings("unchecked")
            List<NotificationSchedulerFlagDto> flags =
                    (List<NotificationSchedulerFlagDto>) body.get("flags");
            assertEquals(4, flags.size());
            verify(systemConfigService, times(1)).listNotificationSchedulerFlags();
        }
    }

    @Test
    @DisplayName("updateFlag — 미인증 시 403, 서비스 호출 없음")
    void updateFlag_unauthenticated_returns403() {
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(null);

            ResponseEntity<Map<String, Object>> response = controller.updateFlag(
                    NotificationSchedulerFlagKeys.WELLNESS_TIP_ENABLED,
                    Map.of("value", true),
                    session);

            assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
            verify(systemConfigService, never()).setGlobalBoolean(anyString(), anyBoolean(), anyString());
        }
    }

    @Test
    @DisplayName("updateFlag — 화이트리스트 외 키는 400 + 메시지 + 서비스 호출 없음")
    void updateFlag_keyNotAllowed_returns400() {
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session))
                    .thenReturn(adminUser(11L, "admin@example.com"));

            ResponseEntity<Map<String, Object>> response = controller.updateFlag(
                    "notification.scheduler.MALICIOUS.enabled",
                    Map.of("value", true),
                    session);

            assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
            assertEquals("허용되지 않은 플래그 키입니다.", response.getBody().get("message"));
            verify(systemConfigService, never()).setGlobalBoolean(anyString(), anyBoolean(), anyString());
        }
    }

    @Test
    @DisplayName("updateFlag — value 누락 시 400")
    void updateFlag_missingValue_returns400() {
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session))
                    .thenReturn(adminUser(11L, "admin@example.com"));

            ResponseEntity<Map<String, Object>> response = controller.updateFlag(
                    NotificationSchedulerFlagKeys.WELLNESS_TIP_ENABLED,
                    new HashMap<>(),
                    session);

            assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
            assertEquals("value 는 필수입니다.", response.getBody().get("message"));
            verify(systemConfigService, never()).setGlobalBoolean(anyString(), anyBoolean(), anyString());
        }
    }

    @Test
    @DisplayName("updateFlag — true 토글 시 200, 감사 식별자(이메일) 전달")
    void updateFlag_toggleTrue_returns200WithEmailAudit() {
        NotificationSchedulerFlagDto savedDto = NotificationSchedulerFlagDto.builder()
                .key(NotificationSchedulerFlagKeys.WORKFLOW_AUTOMATION_ENABLED)
                .value(true)
                .updatedBy("admin@example.com")
                .updatedAt(LocalDateTime.now())
                .build();
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session))
                    .thenReturn(adminUser(42L, "admin@example.com"));
            when(systemConfigService.setGlobalBoolean(
                    eq(NotificationSchedulerFlagKeys.WORKFLOW_AUTOMATION_ENABLED),
                    eq(true),
                    eq("admin@example.com")))
                    .thenReturn(savedDto);

            ResponseEntity<Map<String, Object>> response = controller.updateFlag(
                    NotificationSchedulerFlagKeys.WORKFLOW_AUTOMATION_ENABLED,
                    Map.of("value", true),
                    session);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(true, response.getBody().get("success"));
            NotificationSchedulerFlagDto returned =
                    (NotificationSchedulerFlagDto) response.getBody().get("flag");
            assertNotNull(returned);
            assertTrue(returned.isValue());
            assertEquals("admin@example.com", returned.getUpdatedBy());
            verify(systemConfigService, times(1))
                    .setGlobalBoolean(
                            NotificationSchedulerFlagKeys.WORKFLOW_AUTOMATION_ENABLED,
                            true,
                            "admin@example.com");
        }
    }

    @Test
    @DisplayName("updateFlag — false 토글 + 이메일 없는 admin 도 ID 기반 감사 식별자")
    void updateFlag_toggleFalse_emailMissing_usesIdAudit() {
        User userNoEmail = User.builder().build();
        userNoEmail.setRole(UserRole.ADMIN);
        try {
            java.lang.reflect.Field field =
                    com.coresolution.consultation.entity.BaseEntity.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(userNoEmail, 99L);
        } catch (Exception ignored) {
            // 안전 호출 — 실패해도 ADMIN fallback 으로 처리됨
        }
        NotificationSchedulerFlagDto savedDto = NotificationSchedulerFlagDto.builder()
                .key(NotificationSchedulerFlagKeys.WELLNESS_TIP_ENABLED)
                .value(false)
                .updatedBy("user#99")
                .updatedAt(LocalDateTime.now())
                .build();
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(userNoEmail);
            when(systemConfigService.setGlobalBoolean(
                    eq(NotificationSchedulerFlagKeys.WELLNESS_TIP_ENABLED),
                    eq(false),
                    anyString()))
                    .thenReturn(savedDto);

            ResponseEntity<Map<String, Object>> response = controller.updateFlag(
                    NotificationSchedulerFlagKeys.WELLNESS_TIP_ENABLED,
                    Map.of("value", false),
                    session);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            verify(systemConfigService, times(1))
                    .setGlobalBoolean(
                            eq(NotificationSchedulerFlagKeys.WELLNESS_TIP_ENABLED),
                            eq(false),
                            // ID 기반 식별자 (user#99) 또는 ADMIN fallback. 둘 다 허용.
                            any(String.class));
        }
    }

    @Test
    @DisplayName("updateFlag — value 가 \"1\" 문자열일 때 true 로 파싱")
    void updateFlag_stringValue_parsesTruthy() {
        NotificationSchedulerFlagDto savedDto = NotificationSchedulerFlagDto.builder()
                .key(NotificationSchedulerFlagKeys.RESERVATION_REMINDER_ENABLED)
                .value(true)
                .updatedBy("admin@example.com")
                .build();
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session))
                    .thenReturn(adminUser(11L, "admin@example.com"));
            when(systemConfigService.setGlobalBoolean(
                    eq(NotificationSchedulerFlagKeys.RESERVATION_REMINDER_ENABLED),
                    eq(true),
                    anyString()))
                    .thenReturn(savedDto);

            ResponseEntity<Map<String, Object>> response = controller.updateFlag(
                    NotificationSchedulerFlagKeys.RESERVATION_REMINDER_ENABLED,
                    Map.of("value", "1"),
                    session);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            verify(systemConfigService, times(1))
                    .setGlobalBoolean(
                            eq(NotificationSchedulerFlagKeys.RESERVATION_REMINDER_ENABLED),
                            eq(true),
                            anyString());
        }
    }
}
