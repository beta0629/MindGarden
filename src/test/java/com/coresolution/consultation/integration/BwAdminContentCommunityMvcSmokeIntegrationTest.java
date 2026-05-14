package com.coresolution.consultation.integration;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import com.coresolution.consultation.constant.HealingContentMediaType;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.HealingContentItemResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.CommunityService;
import com.coresolution.consultation.service.HealingContentCatalogAdminService;
import com.coresolution.consultation.service.HealingContentsCatalogService;
import com.coresolution.consultation.service.PsychoEducationAdminService;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * BW-3 어드민 콘텐츠·BW-4 커뮤니티 검수·BW-5 명상 목록 MockMvc 스모크.
 * {@link AdminControllerConfirmDepositApproveIntegrationTest} 와 동일하게
 * {@code @AutoConfigureMockMvc(addFilters = false)} 로 서블릿 레이어만 검증한다.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@Transactional
@DisplayName("BW-3/4/5 어드민·명상 API MockMvc 스모크")
class BwAdminContentCommunityMvcSmokeIntegrationTest {

    private static final String TEST_TENANT_ID = "tenant-bw-smoke-" + UUID.randomUUID();

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PsychoEducationAdminService psychoEducationAdminService;

    @MockBean
    private HealingContentCatalogAdminService healingContentCatalogAdminService;

    @MockBean
    private CommunityService communityService;

    @MockBean
    private HealingContentsCatalogService healingContentsCatalogService;

    @BeforeEach
    void setTenantContext() {
        TenantContextHolder.setTenantId(TEST_TENANT_ID);
    }

    @AfterEach
    void clearTenantContext() {
        TenantContextHolder.clear();
    }

    private User adminSessionUser() {
        User u = new User();
        u.setId(9001L);
        u.setUserId("admin-bw-smoke");
        u.setEmail("admin-bw-smoke@test.com");
        u.setName("BW Smoke Admin");
        u.setTenantId(TEST_TENANT_ID);
        u.setRole(UserRole.ADMIN);
        return u;
    }

    private User clientSessionUser() {
        User u = new User();
        u.setId(9002L);
        u.setUserId("client-bw-smoke");
        u.setEmail("client-bw-smoke@test.com");
        u.setName("BW Smoke Client");
        u.setTenantId(TEST_TENANT_ID);
        u.setRole(UserRole.CLIENT);
        return u;
    }

    @Test
    @DisplayName("GET /api/v1/admin/content/psycho-education — ADMIN·테넌트 있으면 200")
    @WithMockUser(roles = {"ADMIN"})
    void psychoEducationList_returns200() throws Exception {
        when(psychoEducationAdminService.listAllForTenant(TEST_TENANT_ID)).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/v1/admin/content/psycho-education"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(psychoEducationAdminService).listAllForTenant(TEST_TENANT_ID);
    }

    @Test
    @DisplayName("GET /api/v1/admin/content/healing-catalog — ADMIN·테넌트 있으면 200")
    @WithMockUser(roles = {"ADMIN"})
    void healingCatalogList_returns200() throws Exception {
        when(healingContentCatalogAdminService.listAllForTenant(TEST_TENANT_ID)).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/v1/admin/content/healing-catalog"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(healingContentCatalogAdminService).listAllForTenant(TEST_TENANT_ID);
    }

    @Test
    @DisplayName("GET /api/v1/admin/community/moderation-queue — 관리자 세션 있으면 200")
    @WithMockUser(roles = {"ADMIN"})
    void moderationQueue_returns200() throws Exception {
        when(communityService.moderationQueue(any(User.class), any()))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/v1/admin/community/moderation-queue")
                        .sessionAttr(SessionConstants.USER_OBJECT, adminSessionUser())
                        .sessionAttr(SessionConstants.TENANT_ID, TEST_TENANT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(communityService).moderationQueue(any(User.class), any());
    }

    @Test
    @DisplayName("PATCH /api/v1/admin/community/posts/{id}/moderation — 최소 바디로 200")
    @WithMockUser(roles = {"ADMIN"})
    void moderatePost_returns200() throws Exception {
        long postId = 42L;
        String body = "{\"decision\":\"APPROVE\"}";

        mockMvc.perform(patch("/api/v1/admin/community/posts/{postId}/moderation", postId)
                        .sessionAttr(SessionConstants.USER_OBJECT, adminSessionUser())
                        .sessionAttr(SessionConstants.TENANT_ID, TEST_TENANT_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(communityService).moderatePost(any(User.class), eq(postId), any());
    }

    @Test
    @DisplayName("GET /api/v1/meditations — 내담자 세션·목록 서비스 목업 시 200")
    void meditationsList_withClientSession_returns200() throws Exception {
        HealingContentItemResponse row = HealingContentItemResponse.builder()
                .id(1L)
                .title("t")
                .type(HealingContentMediaType.MEDITATION)
                .build();
        when(healingContentsCatalogService.listForClientTenant(TEST_TENANT_ID)).thenReturn(List.of(row));

        mockMvc.perform(get("/api/v1/meditations")
                        .sessionAttr(SessionConstants.USER_OBJECT, clientSessionUser())
                        .sessionAttr(SessionConstants.TENANT_ID, TEST_TENANT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value(1));

        verify(healingContentsCatalogService).listForClientTenant(TEST_TENANT_ID);
    }
}
