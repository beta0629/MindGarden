package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Map;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.core.dto.ApiResponse;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.coresolution.testsupport.SecurityContextIsolationExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpSession;

/**
 * {@link ConsultationMessageController#markAllAsRead(HttpSession)} 단위 검증.
 * 운영 핫픽스 (2026-05-23) — GNB "모두 읽음" 일괄 엔드포인트.
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@ExtendWith({MockitoExtension.class, SecurityContextIsolationExtension.class})
@DisplayName("ConsultationMessageController#markAllAsRead 단위 테스트")
class ConsultationMessageControllerTest {

    private static final String TENANT_ID = "tenant-incheon-counseling-001";
    private static final Long USER_ID = 3L;

    @Mock
    private ConsultationMessageService consultationMessageService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DynamicPermissionService dynamicPermissionService;

    @InjectMocks
    private ConsultationMessageController controller;

    private MockHttpSession sessionWithUser(User user) {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionConstants.USER_OBJECT, user);
        return session;
    }

    private User buildUser(String tenantId) {
        User user = User.builder()
            .userId("kim.sunhee")
            .email("kim@example.com")
            .role(UserRole.CONSULTANT)
            .build();
        user.setId(USER_ID);
        user.setTenantId(tenantId);
        return user;
    }

    @Test
    @DisplayName("비로그인 요청은 401 + 'service.markAllAsRead' 미호출")
    void markAllAsRead_비로그인_401반환() {
        MockHttpSession session = new MockHttpSession();

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
            controller.markAllAsRead(session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        verify(consultationMessageService, never()).markAllAsRead(any());
    }

    @Test
    @DisplayName("테넌트 정보 없음 요청은 403 + 'service.markAllAsRead' 미호출")
    void markAllAsRead_테넌트없음_403반환() {
        User user = buildUser("   ");
        MockHttpSession session = sessionWithUser(user);

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
            controller.markAllAsRead(session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        verify(consultationMessageService, never()).markAllAsRead(any());
    }

    @Test
    @DisplayName("정상 요청은 service.markAllAsRead(userId) 호출 + updatedCount 반환")
    void markAllAsRead_정상_service호출_updatedCount반환() {
        User user = buildUser(TENANT_ID);
        MockHttpSession session = sessionWithUser(user);
        when(consultationMessageService.markAllAsRead(USER_ID)).thenReturn(263);

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
            controller.markAllAsRead(session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        assertThat(response.getBody().getData()).containsEntry("updatedCount", 263);
        verify(consultationMessageService).markAllAsRead(USER_ID);
    }
}
