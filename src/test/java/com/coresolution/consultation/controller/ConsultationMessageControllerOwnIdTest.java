package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultationMessage;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.GlobalExceptionHandler;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.support.ConsultationMessageAccessGuard;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * P0 보안 회귀 — 상담 메시지 API 본인·참여자·테넌트 가드.
 *
 * <p>2026-10-03 .dev 재현: 내담자(20)가 {@code GET /consultation-messages/client/21} 로
 * 다른 내담자 메시지 20건을 200 으로 받음. 원인은 {@code hasApiAccess} 우회
 * (CLIENT 도 API_ACCESS_CONSULTATION_MESSAGES 보유). 본 테스트는 실제
 * {@link ConsultationMessageAccessGuard} 를 붙인 standalone MockMvc 로 검증한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ConsultationMessageController 본인 id 가드 (P0)")
class ConsultationMessageControllerOwnIdTest {

    private static final String TENANT_A = "tenant-msg-ownid-a";
    private static final String TENANT_B = "tenant-msg-ownid-b";
    private static final String BASE = "/api/v1/consultation-messages";
    private static final long CLIENT_SELF = 20L;
    private static final long CLIENT_OTHER = 21L;
    private static final long CONSULTANT_SELF = 30L;
    private static final long CONSULTANT_OTHER = 31L;
    private static final long ADMIN_ID = 1L;
    private static final long STAFF_ID = 2L;
    private static final long MESSAGE_ID = 500L;

    @Mock
    private ConsultationMessageService consultationMessageService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private DynamicPermissionService dynamicPermissionService;
    @Mock
    private ConsultantClientMappingRepository mappingRepository;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        TenantContextHolder.clear();
        ConsultationMessageAccessGuard guard =
            new ConsultationMessageAccessGuard(dynamicPermissionService, mappingRepository);
        ConsultationMessageController controller = new ConsultationMessageController(
            consultationMessageService, userRepository, dynamicPermissionService, guard);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
            .setControllerAdvice(new GlobalExceptionHandler())
            .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
            .build();
        when(consultationMessageService.getClientMessages(
            anyLong(), any(), any(), any(), any(), any(), any(Pageable.class)))
            .thenReturn(pageOf(message(MESSAGE_ID, CONSULTANT_SELF, CLIENT_SELF, CONSULTANT_SELF, CLIENT_SELF)));
        when(consultationMessageService.getConsultantMessages(
            anyLong(), any(), any(), any(), any(), any(), any(Pageable.class)))
            .thenReturn(pageOf(message(MESSAGE_ID, CONSULTANT_SELF, CLIENT_SELF, CONSULTANT_SELF, CLIENT_SELF)));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    private static User user(long id, UserRole role, String tenantId) {
        User u = new User();
        u.setId(id);
        u.setUserId("u-" + id);
        u.setRole(role);
        u.setTenantId(tenantId);
        return u;
    }

    private static MockHttpSession session(User u) {
        MockHttpSession s = new MockHttpSession();
        s.setAttribute(SessionConstants.USER_OBJECT, u);
        s.setAttribute(SessionConstants.TENANT_ID, u.getTenantId());
        return s;
    }

    private static ConsultationMessage message(long id, long consultantId, long clientId, long senderId,
            long receiverId) {
        ConsultationMessage m = new ConsultationMessage();
        m.setId(id);
        m.setConsultantId(consultantId);
        m.setClientId(clientId);
        m.setSenderId(senderId);
        m.setReceiverId(receiverId);
        m.setSenderType(senderId == consultantId ? UserRole.CONSULTANT.name() : UserRole.CLIENT.name());
        m.setIsRead(true);
        m.setTitle("t");
        m.setContent("c");
        return m;
    }

    private static Page<ConsultationMessage> pageOf(ConsultationMessage m) {
        return new PageImpl<>(List.of(m));
    }

    private void stubMapping(long consultantId, long clientId, boolean exists) {
        List<ConsultantClientMapping> rows = exists
            ? List.of(new ConsultantClientMapping()) : Collections.emptyList();
        when(mappingRepository.findAllByTenantIdAndConsultantIdAndClientIdOrderByCreatedAtDesc(
            TENANT_A, consultantId, clientId)).thenReturn(rows);
    }

    @Test
    @DisplayName("내담자 본인 id → 200, 서비스는 본인 id 로 조회")
    void client_self_200() throws Exception {
        mockMvc.perform(get(BASE + "/client/" + CLIENT_SELF)
                .session(session(user(CLIENT_SELF, UserRole.CLIENT, TENANT_A))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.messages.length()").value(1));
        verify(consultationMessageService).getClientMessages(
            eq(CLIENT_SELF), isNull(), any(), any(), any(), any(), any(Pageable.class));
    }

    @Test
    @DisplayName("내담자 타인 id → 403, data 없음, 저장소 조회 안 함")
    void client_otherId_403_noData() throws Exception {
        MvcResult result = mockMvc.perform(get(BASE + "/client/" + CLIENT_OTHER)
                .session(session(user(CLIENT_SELF, UserRole.CLIENT, TENANT_A))))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.data").doesNotExist())
            .andExpect(jsonPath("$.messages").doesNotExist())
            .andReturn();
        assertThat(result.getResponse().getContentAsString(StandardCharsets.UTF_8))
            .contains(ConsultationMessageAccessGuard.DENIAL_OWN_MESSAGES_ONLY)
            .doesNotContain("\"receiverId\"");
        verify(consultationMessageService, never()).getClientMessages(
            anyLong(), any(), any(), any(), any(), any(), any(Pageable.class));
    }

    @Test
    @DisplayName("내담자가 hasApiAccess=true 여도 타인 id → 403 (기존 우회 차단)")
    void client_otherId_withApiAccess_stillForbidden() throws Exception {
        when(dynamicPermissionService.hasApiAccess(any(User.class), any())).thenReturn(true);
        when(dynamicPermissionService.hasPermission(any(User.class), any())).thenReturn(true);
        mockMvc.perform(get(BASE + "/client/" + CLIENT_OTHER)
                .session(session(user(CLIENT_SELF, UserRole.CLIENT, TENANT_A))))
            .andExpect(status().isForbidden());
        verify(consultationMessageService, never()).getClientMessages(
            anyLong(), any(), any(), any(), any(), any(), any(Pageable.class));
    }

    @Test
    @DisplayName("내담자가 상담사 목록 경로 호출 → 403")
    void client_consultantPath_403() throws Exception {
        mockMvc.perform(get(BASE + "/consultant/" + CONSULTANT_SELF)
                .session(session(user(CLIENT_SELF, UserRole.CLIENT, TENANT_A))))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.data").doesNotExist());
        verify(consultationMessageService, never()).getConsultantMessages(
            anyLong(), any(), any(), any(), any(), any(), any(Pageable.class));
    }

    @Test
    @DisplayName("내담자가 타인 메시지 단건 조회 → 403")
    void client_otherMessageById_403() throws Exception {
        when(consultationMessageService.findActiveById(MESSAGE_ID)).thenReturn(Optional.of(
            message(MESSAGE_ID, CONSULTANT_SELF, CLIENT_OTHER, CONSULTANT_SELF, CLIENT_OTHER)));
        mockMvc.perform(get(BASE + "/" + MESSAGE_ID)
                .session(session(user(CLIENT_SELF, UserRole.CLIENT, TENANT_A))))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.data").doesNotExist());
    }

    @Test
    @DisplayName("내담자가 본인 수신 메시지 단건 조회 → 200")
    void client_ownMessageById_200() throws Exception {
        when(consultationMessageService.findActiveById(MESSAGE_ID)).thenReturn(Optional.of(
            message(MESSAGE_ID, CONSULTANT_SELF, CLIENT_SELF, CONSULTANT_SELF, CLIENT_SELF)));
        mockMvc.perform(get(BASE + "/" + MESSAGE_ID)
                .session(session(user(CLIENT_SELF, UserRole.CLIENT, TENANT_A))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.id").value(MESSAGE_ID));
    }

    @Test
    @DisplayName("내담자가 타인 메시지 읽음 처리 → 403, markAsRead 미호출")
    void client_markReadOther_403() throws Exception {
        when(consultationMessageService.findActiveById(MESSAGE_ID)).thenReturn(Optional.of(
            message(MESSAGE_ID, CONSULTANT_SELF, CLIENT_OTHER, CONSULTANT_SELF, CLIENT_OTHER)));
        mockMvc.perform(get(BASE + "/" + MESSAGE_ID + "/read")
                .session(session(user(CLIENT_SELF, UserRole.CLIENT, TENANT_A))))
            .andExpect(status().isForbidden());
        verify(consultationMessageService, never()).markAsRead(anyLong());
    }

    @Test
    @DisplayName("내담자가 타인 메시지에 답장·삭제·보관 → 403, 쓰기 미호출")
    void client_replyDeleteArchiveOther_403() throws Exception {
        when(consultationMessageService.findActiveById(MESSAGE_ID)).thenReturn(Optional.of(
            message(MESSAGE_ID, CONSULTANT_SELF, CLIENT_OTHER, CONSULTANT_SELF, CLIENT_OTHER)));
        MockHttpSession s = session(user(CLIENT_SELF, UserRole.CLIENT, TENANT_A));
        mockMvc.perform(post(BASE + "/" + MESSAGE_ID + "/reply").session(s)
                .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"t\",\"content\":\"c\"}"))
            .andExpect(status().isForbidden());
        mockMvc.perform(delete(BASE + "/" + MESSAGE_ID).session(s))
            .andExpect(status().isForbidden());
        mockMvc.perform(put(BASE + "/" + MESSAGE_ID + "/archive").session(s))
            .andExpect(status().isForbidden());
        verify(consultationMessageService, never()).replyToMessage(anyLong(), any(), any(), any(), any(), any());
        verify(consultationMessageService, never()).deleteMessage(anyLong());
        verify(consultationMessageService, never()).archiveMessage(anyLong());
    }

    @Test
    @DisplayName("내담자가 타 내담자 명의로 전송 → 403, sendMessage 미호출")
    void client_sendAsOtherClient_403() throws Exception {
        stubMapping(CONSULTANT_SELF, CLIENT_SELF, true);
        mockMvc.perform(post(BASE).session(session(user(CLIENT_SELF, UserRole.CLIENT, TENANT_A)))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"consultantId\":" + CONSULTANT_SELF + ",\"clientId\":" + CLIENT_OTHER
                    + ",\"senderType\":\"CLIENT\",\"title\":\"t\",\"content\":\"c\"}"))
            .andExpect(status().isForbidden());
        verify(consultationMessageService, never()).sendMessage(
            any(), any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("내담자가 senderType=CONSULTANT 로 위장 전송 → 발신자 CLIENT 로 강제")
    void client_sendSpoofSenderType_forcedClient() throws Exception {
        stubMapping(CONSULTANT_SELF, CLIENT_SELF, true);
        when(consultationMessageService.sendMessage(
            any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(message(MESSAGE_ID, CONSULTANT_SELF, CLIENT_SELF, CLIENT_SELF, CONSULTANT_SELF));
        mockMvc.perform(post(BASE).session(session(user(CLIENT_SELF, UserRole.CLIENT, TENANT_A)))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"consultantId\":" + CONSULTANT_SELF + ",\"clientId\":" + CLIENT_SELF
                    + ",\"senderType\":\"CONSULTANT\",\"title\":\"t\",\"content\":\"c\"}"))
            .andExpect(status().isCreated());
        verify(consultationMessageService).sendMessage(
            eq(CONSULTANT_SELF), eq(CLIENT_SELF), isNull(), eq(UserRole.CLIENT.name()),
            any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("상담사 미매칭 내담자 → 403")
    void consultant_unmappedClient_403() throws Exception {
        stubMapping(CONSULTANT_SELF, CLIENT_OTHER, false);
        mockMvc.perform(get(BASE + "/client/" + CLIENT_OTHER)
                .session(session(user(CONSULTANT_SELF, UserRole.CONSULTANT, TENANT_A))))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.data").doesNotExist());
        verify(consultationMessageService, never()).getClientMessages(
            anyLong(), any(), any(), any(), any(), any(), any(Pageable.class));
    }

    @Test
    @DisplayName("상담사 매칭 내담자 → 200, 상담사 필터는 본인 id 로 고정")
    void consultant_mappedClient_200() throws Exception {
        stubMapping(CONSULTANT_SELF, CLIENT_SELF, true);
        mockMvc.perform(get(BASE + "/client/" + CLIENT_SELF)
                .session(session(user(CONSULTANT_SELF, UserRole.CONSULTANT, TENANT_A))))
            .andExpect(status().isOk());
        verify(consultationMessageService).getClientMessages(
            eq(CLIENT_SELF), eq(CONSULTANT_SELF), any(), any(), any(), any(), any(Pageable.class));
    }

    @Test
    @DisplayName("상담사가 매칭 내담자라도 다른 상담사 스레드 지정 → 403")
    void consultant_mappedClient_otherConsultantFilter_403() throws Exception {
        stubMapping(CONSULTANT_SELF, CLIENT_SELF, true);
        mockMvc.perform(get(BASE + "/client/" + CLIENT_SELF)
                .param("consultantId", String.valueOf(CONSULTANT_OTHER))
                .session(session(user(CONSULTANT_SELF, UserRole.CONSULTANT, TENANT_A))))
            .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("상담사 본인 목록 200 / 타 상담사 목록 403")
    void consultant_selfAndOther() throws Exception {
        MockHttpSession s = session(user(CONSULTANT_SELF, UserRole.CONSULTANT, TENANT_A));
        mockMvc.perform(get(BASE + "/consultant/" + CONSULTANT_SELF).session(s))
            .andExpect(status().isOk());
        mockMvc.perform(get(BASE + "/consultant/" + CONSULTANT_OTHER).session(s))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.data").doesNotExist());
        verify(consultationMessageService, never()).getConsultantMessages(
            eq(CONSULTANT_OTHER), any(), any(), any(), any(), any(), any(Pageable.class));
    }

    @Test
    @DisplayName("상담사가 미매칭 내담자에게 전송 → 403")
    void consultant_sendUnmapped_403() throws Exception {
        stubMapping(CONSULTANT_SELF, CLIENT_OTHER, false);
        mockMvc.perform(post(BASE).session(session(user(CONSULTANT_SELF, UserRole.CONSULTANT, TENANT_A)))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"consultantId\":" + CONSULTANT_SELF + ",\"clientId\":" + CLIENT_OTHER
                    + ",\"senderType\":\"CONSULTANT\",\"title\":\"t\",\"content\":\"c\"}"))
            .andExpect(status().isForbidden());
        verify(consultationMessageService, never()).sendMessage(
            any(), any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("관리자: 요청 헤더로 다른 테넌트를 지정해도 세션 테넌트로만 조회 (타 테넌트 데이터 없음)")
    void admin_otherTenant_scopedToSessionTenant() throws Exception {
        AtomicReference<String> tenantAtQuery = new AtomicReference<>();
        when(consultationMessageService.getClientMessages(
            anyLong(), any(), any(), any(), any(), any(), any(Pageable.class)))
            .thenAnswer(inv -> {
                tenantAtQuery.set(TenantContextHolder.getTenantId());
                return new PageImpl<ConsultationMessage>(Collections.emptyList());
            });
        mockMvc.perform(get(BASE + "/client/" + CLIENT_OTHER)
                .header("X-Tenant-Id", TENANT_B)
                .param("tenantId", TENANT_B)
                .session(session(user(ADMIN_ID, UserRole.ADMIN, TENANT_A))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.messages.length()").value(0));
        assertThat(tenantAtQuery.get()).isEqualTo(TENANT_A);
    }

    @Test
    @DisplayName("관리자: 다른 테넌트 메시지 id 단건 → 세션 테넌트에 없으므로 404, data 없음")
    void admin_otherTenantMessageById_notFound() throws Exception {
        when(consultationMessageService.findActiveById(MESSAGE_ID)).thenReturn(Optional.empty());
        mockMvc.perform(get(BASE + "/" + MESSAGE_ID)
                .header("X-Tenant-Id", TENANT_B)
                .session(session(user(ADMIN_ID, UserRole.ADMIN, TENANT_A))))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.data").doesNotExist());
    }

    @Test
    @DisplayName("사무원(STAFF) 본인 id 로 /client 호출(FE 폴백 경로) → 200")
    void staff_ownIdFallback_200() throws Exception {
        mockMvc.perform(get(BASE + "/client/" + STAFF_ID)
                .session(session(user(STAFF_ID, UserRole.STAFF, TENANT_A))))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("미인증 → 401 (목록·단건·전송)")
    void unauthenticated_401() throws Exception {
        mockMvc.perform(get(BASE + "/client/" + CLIENT_SELF))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.data").doesNotExist());
        mockMvc.perform(get(BASE + "/consultant/" + CONSULTANT_SELF))
            .andExpect(status().isUnauthorized());
        mockMvc.perform(get(BASE + "/" + MESSAGE_ID))
            .andExpect(status().isUnauthorized());
        mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON)
                .content("{\"consultantId\":1,\"clientId\":2}"))
            .andExpect(status().isUnauthorized());
        verify(consultationMessageService, never()).getClientMessages(
            anyLong(), any(), any(), any(), any(), any(), any(Pageable.class));
        verify(consultationMessageService, never()).sendMessage(
            any(), any(), any(), any(), any(), any(), any(), any(), any());
    }
}
