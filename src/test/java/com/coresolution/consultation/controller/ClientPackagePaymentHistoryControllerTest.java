package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.ClientPackagePaymentHistoryResponse;
import com.coresolution.consultation.dto.PackagePaymentHistorySummaryResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.ForbiddenException;
import com.coresolution.consultation.exception.UnauthorizedException;
import com.coresolution.consultation.service.ClientPackagePaymentHistoryService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.dto.ApiResponse;
import java.util.Collections;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpSession;

/**
 * 내담자 me 패키지 결제 이력 — 세션 clientId 강제·테넌트 격리.
 *
 * @author MindGarden
 * @since 2026-10-28
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ClientPackagePaymentHistoryController")
class ClientPackagePaymentHistoryControllerTest {

    private static final Long CLIENT_ID = ThreadLocalRandom.current().nextLong(10_000L, 99_000L);
    private static final String TENANT_ID = "tenant-pkg-me-" + UUID.randomUUID();

    @Mock
    private ClientPackagePaymentHistoryService clientPackagePaymentHistoryService;

    @InjectMocks
    private ClientPackagePaymentHistoryController controller;

    private MockHttpSession session;

    @BeforeEach
    void setUp() {
        session = new MockHttpSession();
        TenantContextHolder.clear();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("CLIENT 세션 → userId 로만 조회하고 tenant 컨텍스트를 정리한다")
    void getMyHistory_usesSessionClientIdOnly() {
        User client = clientUser(CLIENT_ID, TENANT_ID);
        session.setAttribute(SessionConstants.USER_OBJECT, client);

        ClientPackagePaymentHistoryResponse payload = ClientPackagePaymentHistoryResponse.builder()
                .summary(PackagePaymentHistorySummaryResponse.builder()
                        .clientId(CLIENT_ID)
                        .itemCount(0)
                        .build())
                .items(Collections.emptyList())
                .build();
        when(clientPackagePaymentHistoryService.getPackagePaymentHistory(eq(CLIENT_ID), isNull()))
                .thenReturn(payload);

        ResponseEntity<ApiResponse<ClientPackagePaymentHistoryResponse>> response =
                controller.getMyPackagePaymentHistory(session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        assertThat(response.getBody().getData()).isSameAs(payload);

        ArgumentCaptor<Long> clientIdCaptor = ArgumentCaptor.forClass(Long.class);
        verify(clientPackagePaymentHistoryService)
                .getPackagePaymentHistory(clientIdCaptor.capture(), isNull());
        assertThat(clientIdCaptor.getValue()).isEqualTo(CLIENT_ID);
        assertThat(TenantContextHolder.getTenantId()).isNull();
    }

    @Test
    @DisplayName("미로그인 → UnauthorizedException")
    void getMyHistory_withoutSession_throwsUnauthorized() {
        assertThatThrownBy(() -> controller.getMyPackagePaymentHistory(session))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("로그인");
    }

    @Test
    @DisplayName("ADMIN 역할 → ForbiddenException (세션 id 로도 조회하지 않음)")
    void getMyHistory_adminRole_forbidden() {
        User admin = clientUser(CLIENT_ID, TENANT_ID);
        admin.setRole(UserRole.ADMIN);
        session.setAttribute(SessionConstants.USER_OBJECT, admin);

        assertThatThrownBy(() -> controller.getMyPackagePaymentHistory(session))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("내담자");
    }

    @Test
    @DisplayName("tenantId 없음 → ForbiddenException")
    void getMyHistory_missingTenant_forbidden() {
        User client = clientUser(CLIENT_ID, null);
        session.setAttribute(SessionConstants.USER_OBJECT, client);

        assertThatThrownBy(() -> controller.getMyPackagePaymentHistory(session))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("테넌트");
    }

    private static User clientUser(Long id, String tenantId) {
        User user = new User();
        user.setId(id);
        user.setUserId("client-" + id);
        user.setTenantId(tenantId);
        user.setRole(UserRole.CLIENT);
        return user;
    }
}
