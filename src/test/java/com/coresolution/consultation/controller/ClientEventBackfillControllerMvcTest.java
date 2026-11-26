package com.coresolution.consultation.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.coresolution.consultation.constant.ClientEventBackfillConstants;
import com.coresolution.consultation.constant.ClientEventBackfillMode;
import com.coresolution.consultation.dto.ClientEventBackfillResult;
import com.coresolution.consultation.service.ClientEventBackfillService;
import com.coresolution.consultation.service.support.ClientEventBackfillEnvironmentGuard;
import com.coresolution.integrationtest.clientevent.ClientEventBackfillControllerMvcTestApplication;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * 백필 컨트롤러 — ROLE_OPS 전용·ADMIN/CLIENT/미인증 거부·EnvironmentGuard 유지.
 *
 * <p>공유 시크릿 헤더 → ROLE_OPS 는 필터 단위 테스트에서 검증.</p>
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@SpringBootTest(classes = ClientEventBackfillControllerMvcTestApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles({"test", "dev"})
@DisplayName("ClientEventBackfillController MockMvc")
class ClientEventBackfillControllerMvcTest {

    private static final String URI = ClientEventBackfillConstants.API_PATH;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ClientEventBackfillService clientEventBackfillService;

    @MockBean
    private ClientEventBackfillEnvironmentGuard environmentGuard;

    @Test
    @DisplayName("미인증 → 401, 서비스·가드 미호출")
    void unauthenticated_returns401() throws Exception {
        mockMvc.perform(post(URI)
                        .param("mode", "dry-run")
                        .param("tenant_id", "tenant-a")
                        .with(request -> {
                            request.setRemoteAddr("127.0.0.1");
                            return request;
                        }))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(clientEventBackfillService);
        verifyNoInteractions(environmentGuard);
    }

    @Test
    @DisplayName("CLIENT → 403, 서비스 미호출")
    @WithMockUser(roles = {"CLIENT"})
    void client_returns403() throws Exception {
        mockMvc.perform(post(URI)
                        .param("mode", "dry-run")
                        .param("tenant_id", "tenant-a")
                        .with(request -> {
                            request.setRemoteAddr("127.0.0.1");
                            return request;
                        }))
                .andExpect(status().isForbidden());
        verify(clientEventBackfillService, never()).run(any(), any());
    }

    @Test
    @DisplayName("ADMIN → 403 (교차/전체 테넌트 백필 차단), 서비스 미호출")
    @WithMockUser(roles = {"ADMIN"})
    void admin_returns403() throws Exception {
        mockMvc.perform(post(URI)
                        .param("mode", "apply")
                        .param("tenant_id", "other-tenant"))
                .andExpect(status().isForbidden());
        verify(clientEventBackfillService, never()).run(any(), any());
        verifyNoInteractions(environmentGuard);
    }

    @Test
    @DisplayName("OPS → 200, tenant_id 필수 · dry-run")
    @WithMockUser(roles = {"OPS"})
    void ops_returns200_withTenantId() throws Exception {
        when(environmentGuard.describeActiveProfiles()).thenReturn("[dev]");
        when(clientEventBackfillService.run(ClientEventBackfillMode.DRY_RUN, "tenant-a"))
                .thenReturn(ClientEventBackfillResult.empty(
                        ClientEventBackfillMode.DRY_RUN, "tenant-a"));

        mockMvc.perform(post(URI)
                        .param("mode", "dry-run")
                        .param("tenant_id", "tenant-a"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.mode").value("dry-run"))
                .andExpect(jsonPath("$.data.scanned").value(0))
                .andExpect(jsonPath("$.data.clientCount").value(0));

        verify(environmentGuard).requireDevOnly();
        verify(clientEventBackfillService).run(ClientEventBackfillMode.DRY_RUN, "tenant-a");
    }

    @Test
    @DisplayName("OPS + tenant_id → 서비스에 지정 테넌트 전달")
    @WithMockUser(roles = {"OPS"})
    void ops_passesTenantId() throws Exception {
        when(environmentGuard.describeActiveProfiles()).thenReturn("[dev]");
        when(clientEventBackfillService.run(ClientEventBackfillMode.APPLY, "tenant-a"))
                .thenReturn(ClientEventBackfillResult.empty(ClientEventBackfillMode.APPLY, "tenant-a"));

        mockMvc.perform(post(URI)
                        .param("mode", "apply")
                        .param("tenant_id", "tenant-a"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.mode").value("apply"))
                .andExpect(jsonPath("$.data.tenantId").value("tenant-a"));

        verify(clientEventBackfillService).run(ClientEventBackfillMode.APPLY, "tenant-a");
        verify(clientEventBackfillService, never()).run(any(), isNull());
    }

    @Test
    @DisplayName("EnvironmentGuard prod 거부 → 400 ILLEGAL_STATE, 서비스 미호출")
    @WithMockUser(roles = {"OPS"})
    void environmentGuard_prodRejected() throws Exception {
        org.mockito.Mockito.doThrow(
                        new IllegalStateException(
                                "client_event backfill is allowed only on .dev profile (prod blocked)"))
                .when(environmentGuard).requireDevOnly();

        mockMvc.perform(post(URI)
                        .param("mode", "dry-run")
                        .param("tenant_id", "tenant-a"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("ILLEGAL_STATE"));

        verify(clientEventBackfillService, never()).run(any(), any());
    }
}
