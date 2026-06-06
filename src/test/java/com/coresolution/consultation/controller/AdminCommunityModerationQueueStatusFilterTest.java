package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Collections;
import java.util.List;

import com.coresolution.consultation.constant.CommunityModerationStatus;
import com.coresolution.consultation.constant.CommunityPostKind;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.community.CommunityModerationQueueItemResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.GlobalExceptionHandler;
import com.coresolution.consultation.service.CommunityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * P0 회귀 — 어드민 커뮤니티 검수 큐 {@code status} 필터(BW-4).
 *
 * <p>직전 결함: {@code AdminCommunityModerationController.moderationQueue} 가 {@code status}
 * 쿼리 파라미터를 받지 않고 {@code CommunityServiceImpl} 이 {@code PENDING} 만 하드코딩하여,
 * FE 의 「승인」/「반려」 탭이 데이터 유무와 무관하게 항상 빈 결과를 반환하던 문제를 수정한다.
 * (core-debugger 보고 ID {@code e1cf4796-7464-4ab3-9589-ec781359422f})</p>
 *
 * <p>본 테스트는 {@link MockMvcBuilders#standaloneSetup(Object...) 스탠드얼론} MockMvc 로
 * 컨트롤러 계층만 격리 검증한다. {@code @SpringBootTest} 기반 컨텍스트는 로컬 H2 EMF 부트 이슈와
 * 무관하게 본 회귀의 핵심(파싱·라우팅·400/403)을 안정적으로 검증할 수 있다.</p>
 *
 * @author MindGarden
 * @since 2026-06-06
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("BW-4 어드민 커뮤니티 검수 큐 status 필터 회귀")
class AdminCommunityModerationQueueStatusFilterTest {

    private static final String TEST_TENANT_ID = "tenant-bw4-status";
    private static final String OTHER_TENANT_ID = "tenant-bw4-other";

    @Mock
    private CommunityService communityService;

    @InjectMocks
    private AdminCommunityModerationController controller;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();
    }

    private User adminSessionUser(String tenantId) {
        User u = new User();
        u.setId(9001L);
        u.setUserId("admin-bw4-status");
        u.setEmail("admin-bw4-status@test.com");
        u.setName("BW4 Status Admin");
        u.setTenantId(tenantId);
        u.setRole(UserRole.ADMIN);
        return u;
    }

    private User staffSessionUser() {
        User u = new User();
        u.setId(9003L);
        u.setUserId("staff-bw4-status");
        u.setEmail("staff-bw4-status@test.com");
        u.setName("BW4 Status Staff");
        u.setTenantId(TEST_TENANT_ID);
        u.setRole(UserRole.STAFF);
        return u;
    }

    private MockHttpSession sessionWith(User user) {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionConstants.USER_OBJECT, user);
        session.setAttribute(SessionConstants.TENANT_ID, user.getTenantId());
        return session;
    }

    private CommunityModerationQueueItemResponse stubItem(long id, CommunityModerationStatus s) {
        return CommunityModerationQueueItemResponse.builder()
                .id(id)
                .postKind(CommunityPostKind.CLIENT_REVIEW)
                .moderationStatus(s)
                .title("t-" + id)
                .bodyPreview("b-" + id)
                .authorUserId(7000L + id)
                .authorDisplay("u-" + id)
                .anonymous(false)
                .createdAt("2026-06-06T10:00:00")
                .build();
    }

    // ---------------------------------------------------------------------
    // T1 — status 미지정 → 전체 (PENDING + APPROVED + REJECTED)
    // ---------------------------------------------------------------------
    @Test
    @DisplayName("T1: GET /moderation-queue (status 없음) → 200, 서비스에 status=null 위임 + PENDING 상단 응답 통과")
    void t1_noStatus_delegatesNullAndReturnsAll() throws Exception {
        List<CommunityModerationQueueItemResponse> rows = List.of(
                stubItem(101L, CommunityModerationStatus.PENDING),
                stubItem(102L, CommunityModerationStatus.PENDING),
                stubItem(201L, CommunityModerationStatus.APPROVED),
                stubItem(301L, CommunityModerationStatus.REJECTED));
        when(communityService.moderationQueue(any(User.class), isNull(), any()))
                .thenReturn(rows);

        mockMvc.perform(get("/api/v1/admin/community/moderation-queue")
                        .session(sessionWith(adminSessionUser(TEST_TENANT_ID))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(4))
                .andExpect(jsonPath("$.data[0].moderationStatus").value("PENDING"))
                .andExpect(jsonPath("$.data[1].moderationStatus").value("PENDING"))
                .andExpect(jsonPath("$.data[2].moderationStatus").value("APPROVED"))
                .andExpect(jsonPath("$.data[3].moderationStatus").value("REJECTED"));

        verify(communityService).moderationQueue(any(User.class), isNull(), any());
    }

    // ---------------------------------------------------------------------
    // T2 — status=PENDING
    // ---------------------------------------------------------------------
    @Test
    @DisplayName("T2: GET /moderation-queue?status=PENDING → 200, 서비스에 PENDING 위임")
    void t2_statusPending_delegatesPending() throws Exception {
        when(communityService.moderationQueue(any(User.class), eq(CommunityModerationStatus.PENDING), any()))
                .thenReturn(List.of(stubItem(101L, CommunityModerationStatus.PENDING)));

        mockMvc.perform(get("/api/v1/admin/community/moderation-queue")
                        .param("status", "PENDING")
                        .session(sessionWith(adminSessionUser(TEST_TENANT_ID))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].moderationStatus").value("PENDING"));

        verify(communityService)
                .moderationQueue(any(User.class), eq(CommunityModerationStatus.PENDING), any());
    }

    // ---------------------------------------------------------------------
    // T3 — status=APPROVED
    // ---------------------------------------------------------------------
    @Test
    @DisplayName("T3: GET /moderation-queue?status=APPROVED → 200, 서비스에 APPROVED 위임")
    void t3_statusApproved_delegatesApproved() throws Exception {
        when(communityService.moderationQueue(any(User.class), eq(CommunityModerationStatus.APPROVED), any()))
                .thenReturn(List.of(
                        stubItem(201L, CommunityModerationStatus.APPROVED),
                        stubItem(202L, CommunityModerationStatus.APPROVED),
                        stubItem(203L, CommunityModerationStatus.APPROVED)));

        mockMvc.perform(get("/api/v1/admin/community/moderation-queue")
                        .param("status", "APPROVED")
                        .session(sessionWith(adminSessionUser(TEST_TENANT_ID))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(3))
                .andExpect(jsonPath("$.data[0].moderationStatus").value("APPROVED"));

        verify(communityService)
                .moderationQueue(any(User.class), eq(CommunityModerationStatus.APPROVED), any());
    }

    // ---------------------------------------------------------------------
    // T4 — status=REJECTED
    // ---------------------------------------------------------------------
    @Test
    @DisplayName("T4: GET /moderation-queue?status=REJECTED → 200, 서비스에 REJECTED 위임")
    void t4_statusRejected_delegatesRejected() throws Exception {
        when(communityService.moderationQueue(any(User.class), eq(CommunityModerationStatus.REJECTED), any()))
                .thenReturn(List.of(stubItem(301L, CommunityModerationStatus.REJECTED)));

        mockMvc.perform(get("/api/v1/admin/community/moderation-queue")
                        .param("status", "REJECTED")
                        .session(sessionWith(adminSessionUser(TEST_TENANT_ID))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].moderationStatus").value("REJECTED"));

        verify(communityService)
                .moderationQueue(any(User.class), eq(CommunityModerationStatus.REJECTED), any());
    }

    // ---------------------------------------------------------------------
    // T5 — status=ALL → null 위임
    // ---------------------------------------------------------------------
    @Test
    @DisplayName("T5: GET /moderation-queue?status=ALL → 200, 서비스에 null 위임 (전체)")
    void t5_statusAll_delegatesNull() throws Exception {
        when(communityService.moderationQueue(any(User.class), isNull(), any()))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/v1/admin/community/moderation-queue")
                        .param("status", "ALL")
                        .session(sessionWith(adminSessionUser(TEST_TENANT_ID))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(communityService).moderationQueue(any(User.class), isNull(), any());
    }

    // ---------------------------------------------------------------------
    // T6 — status=pending (소문자) → PENDING 위임 (대소문자 무시)
    // ---------------------------------------------------------------------
    @Test
    @DisplayName("T6: GET /moderation-queue?status=pending → 200, 대소문자 무시하고 PENDING 위임")
    void t6_statusLowercase_delegatesPending() throws Exception {
        when(communityService.moderationQueue(any(User.class), eq(CommunityModerationStatus.PENDING), any()))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/v1/admin/community/moderation-queue")
                        .param("status", "pending")
                        .session(sessionWith(adminSessionUser(TEST_TENANT_ID))))
                .andExpect(status().isOk());

        verify(communityService)
                .moderationQueue(any(User.class), eq(CommunityModerationStatus.PENDING), any());
    }

    // ---------------------------------------------------------------------
    // T7 — status=garbage → 400, 서비스 미호출
    // ---------------------------------------------------------------------
    @Test
    @DisplayName("T7: GET /moderation-queue?status=garbage → 400, 서비스 미호출")
    void t7_statusInvalid_returns400AndSkipsService() throws Exception {
        mockMvc.perform(get("/api/v1/admin/community/moderation-queue")
                        .param("status", "garbage")
                        .session(sessionWith(adminSessionUser(TEST_TENANT_ID))))
                .andExpect(status().isBadRequest());

        verify(communityService, never()).moderationQueue(any(User.class), any(), any());
    }

    // ---------------------------------------------------------------------
    // T8 — 권한: STAFF 세션 → 403, 서비스 미호출 (Controller 내부 가드)
    // ---------------------------------------------------------------------
    @Test
    @DisplayName("T8: STAFF 세션 → 403, 서비스 미호출 (requireAdminWithTenant 회귀)")
    void t8_whenStaff_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/community/moderation-queue")
                        .param("status", "PENDING")
                        .session(sessionWith(staffSessionUser())))
                .andExpect(status().isForbidden());

        verifyNoInteractions(communityService);
    }

    // ---------------------------------------------------------------------
    // T9 — tenant 격리: 세션의 admin.tenantId 가 그대로 service 호출에 전달됨
    //       (Service / Repository 레이어가 tenantId 로 격리 — 본 테스트는 위임 정합 회귀)
    // ---------------------------------------------------------------------
    @Test
    @DisplayName("T9: 세션 admin.tenantId 가 서비스 호출의 admin.tenantId 와 동일 (다른 테넌트 데이터 미혼입 회귀)")
    void t9_tenantIsolation_delegatesAdminWithExpectedTenant() throws Exception {
        when(communityService.moderationQueue(any(User.class), isNull(), any()))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/v1/admin/community/moderation-queue")
                        .session(sessionWith(adminSessionUser(TEST_TENANT_ID))))
                .andExpect(status().isOk());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(communityService).moderationQueue(userCaptor.capture(), isNull(), any());
        assertThat(userCaptor.getValue().getTenantId()).isEqualTo(TEST_TENANT_ID);
        assertThat(userCaptor.getValue().getTenantId()).isNotEqualTo(OTHER_TENANT_ID);
    }

    // ---------------------------------------------------------------------
    // T10 — PR #147 PATCH 회귀: 레거시 {"status":"APPROVED"} 본문은 400 유지
    //       (PATCH 흐름은 무수정 — 회귀 가드만 추가)
    // ---------------------------------------------------------------------
    @Test
    @DisplayName("T10: PATCH /posts/{id}/moderation with {\"status\":\"APPROVED\"} → 400 (PR #147 회귀)")
    void t10_moderatePost_whenLegacyStatusBody_returns400() throws Exception {
        long postId = 42L;
        String body = "{\"status\":\"APPROVED\"}";

        mockMvc.perform(patch("/api/v1/admin/community/posts/{postId}/moderation", postId)
                        .session(sessionWith(adminSessionUser(TEST_TENANT_ID)))
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isBadRequest());
    }
}
