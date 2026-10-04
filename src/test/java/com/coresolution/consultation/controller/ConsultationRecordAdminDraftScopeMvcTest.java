package com.coresolution.consultation.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.lang.reflect.Constructor;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultationRecordDraft;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.GlobalExceptionHandler;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultationRecordDraftRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.impl.ConsultationRecordDraftServiceImpl;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import com.coresolution.consultation.service.support.ConsultationRecordDraftAccessGuard;
import com.coresolution.core.context.TenantContextHolder;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * 상담일지 서버 초안 — 관리자 자동저장 + 작성자 본인 전용 범위 (PR M).
 *
 * <p>초안 키는 언제나 호출자 본인 users.id 다. 관리자 초안은 관리자 id 로 저장되어 담당 상담사 초안과
 * 섞이지 않고, 서로의 초안을 불러올 수 없다(상대 id 를 넣으면 403). 실제 가드·서비스를 쓰고
 * 리포지토리만 메모리 맵으로 대체한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@DisplayName("상담일지 서버 초안 — 관리자 본인 초안만, 상담사와 상호 비공개")
class ConsultationRecordAdminDraftScopeMvcTest {

    private static final String TENANT_A = "tenant-draft-a";
    private static final String TENANT_B = "tenant-draft-b";
    private static final long SCHEDULE_ID = 812L;
    private static final long ASSIGNEE = 10L;
    private static final long ADMIN_ID = 1L;
    private static final long ADMIN_B = 5L;
    private static final long OTHER_CONSULTANT = 77L;
    private static final long STAFF_ID = 2L;
    private static final String DRAFT_URI = "/api/v1/schedules/consultation-records/draft";
    private static final String ADMIN_PAYLOAD = "{\"formData\":{\"mainIssues\":\"관리자 초안 문구\"}}";
    private static final String CONSULTANT_PAYLOAD = "{\"formData\":{\"mainIssues\":\"상담사 초안 문구\"}}";

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, ConsultationRecordDraft> drafts = new HashMap<>();
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() throws Exception {
        SecurityContextHolder.clearContext();
        TenantContextHolder.clear();
        drafts.clear();
        ScheduleRepository scheduleRepository = mock(ScheduleRepository.class);
        ConsultationRecordDraftRepository draftRepository = mock(ConsultationRecordDraftRepository.class);
        DynamicPermissionService dynamicPermissionService = mock(DynamicPermissionService.class);
        when(dynamicPermissionService.hasPermission(any(User.class), anyString())).thenReturn(true);

        ClientPathAccessGuard clientGuard = new ClientPathAccessGuard(
            mock(ConsultantClientMappingRepository.class), mock(UserRepository.class));
        ConsultationRecordDraftAccessGuard draftGuard = new ConsultationRecordDraftAccessGuard(
            clientGuard, scheduleRepository);
        ConsultationRecordDraftServiceImpl draftService = new ConsultationRecordDraftServiceImpl(
            draftRepository, scheduleRepository);

        Schedule schedule = new Schedule();
        schedule.setId(SCHEDULE_ID);
        schedule.setTenantId(TENANT_A);
        schedule.setConsultantId(ASSIGNEE);
        schedule.setIsDeleted(false);
        when(scheduleRepository.findByTenantIdAndId(TENANT_A, SCHEDULE_ID)).thenReturn(Optional.of(schedule));

        AtomicLong ids = new AtomicLong(1L);
        when(draftRepository.findByTenantIdAndConsultationIdAndConsultantIdAndIsDeletedFalse(
                anyString(), anyLong(), anyLong()))
            .thenAnswer(inv -> Optional.ofNullable(drafts.get(key(inv.getArgument(0), inv.getArgument(1),
                inv.getArgument(2)))).filter(d -> !Boolean.TRUE.equals(d.getIsDeleted())));
        when(draftRepository.save(any(ConsultationRecordDraft.class))).thenAnswer(inv -> {
            ConsultationRecordDraft d = inv.getArgument(0);
            if (d.getId() == null) {
                d.setId(ids.getAndIncrement());
            }
            drafts.put(key(d.getTenantId(), d.getConsultationId(), d.getConsultantId()), d);
            return d;
        });

        Object[] provided = {clientGuard, draftGuard, draftService, scheduleRepository, dynamicPermissionService,
            objectMapper};
        mockMvc = MockMvcBuilders.standaloneSetup(build(ScheduleController.class, provided))
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("관리자 — 본인 id 로 초안 저장·조회·삭제 200, 관리자 id 키로 저장된다")
    void admin_ownDraft_crud() throws Exception {
        User admin = user(ADMIN_ID, UserRole.ADMIN, TENANT_A);
        put(admin, ADMIN_ID, ADMIN_PAYLOAD).andExpect(status().isOk());
        get(admin, ADMIN_ID)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.hasDraft").value(true))
            .andExpect(jsonPath("$.data.payloadJson").value(ADMIN_PAYLOAD))
            .andExpect(jsonPath("$.data.consultantId").value(ADMIN_ID));
        org.assertj.core.api.Assertions.assertThat(drafts).containsKey(key(TENANT_A, SCHEDULE_ID, ADMIN_ID));
        call(HttpMethod.DELETE, admin, ADMIN_ID, null).andExpect(status().isOk());
        get(admin, ADMIN_ID).andExpect(jsonPath("$.data.hasDraft").value(false));
    }

    @Test
    @DisplayName("관리자 초안은 담당 상담사가 불러올 수 없다 — 상담사 본인 조회는 빈 초안, 관리자 id 로 조회는 403")
    void consultant_cannotLoadAdminDraft() throws Exception {
        put(user(ADMIN_ID, UserRole.ADMIN, TENANT_A), ADMIN_ID, ADMIN_PAYLOAD).andExpect(status().isOk());
        User consultant = user(ASSIGNEE, UserRole.CONSULTANT, TENANT_A);
        get(consultant, ASSIGNEE)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.hasDraft").value(false));
        get(consultant, ADMIN_ID).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("상담사 초안은 관리자가 불러올 수 없다 — 관리자 본인 조회는 자기 초안만, 상담사 id 로 조회는 403")
    void admin_cannotLoadConsultantDraft() throws Exception {
        User consultant = user(ASSIGNEE, UserRole.CONSULTANT, TENANT_A);
        User admin = user(ADMIN_ID, UserRole.ADMIN, TENANT_A);
        put(consultant, ASSIGNEE, CONSULTANT_PAYLOAD).andExpect(status().isOk());
        put(admin, ADMIN_ID, ADMIN_PAYLOAD).andExpect(status().isOk());

        get(admin, ADMIN_ID)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.payloadJson").value(ADMIN_PAYLOAD));
        get(admin, ASSIGNEE).andExpect(status().isForbidden());
        put(admin, ASSIGNEE, ADMIN_PAYLOAD).andExpect(status().isForbidden());
        get(consultant, ASSIGNEE)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.payloadJson").value(CONSULTANT_PAYLOAD));
    }

    @Test
    @DisplayName("다른 테넌트 관리자·담당 아닌 상담사 — 본인 id 여도 403, 미인증 401")
    void otherTenantAdmin_and_otherConsultant_forbidden() throws Exception {
        put(user(ADMIN_B, UserRole.ADMIN, TENANT_B), ADMIN_B, ADMIN_PAYLOAD).andExpect(status().isForbidden());
        put(user(OTHER_CONSULTANT, UserRole.CONSULTANT, TENANT_A), OTHER_CONSULTANT, CONSULTANT_PAYLOAD)
            .andExpect(status().isForbidden());
        mockMvc.perform(request(HttpMethod.GET, DRAFT_URI)
                .queryParam("consultationId", "schedule-" + SCHEDULE_ID)
                .queryParam("consultantId", String.valueOf(ADMIN_ID))
                .with(r -> {
                    TenantContextHolder.setTenantId(TENANT_A);
                    return r;
                }))
            .andExpect(status().isUnauthorized());
        org.assertj.core.api.Assertions.assertThat(drafts).isEmpty();
    }

    @Test
    @DisplayName("같은 테넌트 사무원(STAFF) — 본인 id 여도 초안 저장·조회·삭제 403, 저장 없음")
    void sameTenantStaff_forbidden() throws Exception {
        User staff = user(STAFF_ID, UserRole.STAFF, TENANT_A);
        put(staff, STAFF_ID, ADMIN_PAYLOAD).andExpect(status().isForbidden());
        get(staff, STAFF_ID).andExpect(status().isForbidden());
        call(HttpMethod.DELETE, staff, STAFF_ID, null).andExpect(status().isForbidden());
        get(staff, ASSIGNEE).andExpect(status().isForbidden());
        org.assertj.core.api.Assertions.assertThat(drafts).isEmpty();
    }

    private ResultActions get(User caller, long consultantId) throws Exception {
        return call(HttpMethod.GET, caller, consultantId, null);
    }

    private ResultActions put(User caller, long consultantId, String payloadJson) throws Exception {
        return call(HttpMethod.PUT, caller, consultantId, payloadJson);
    }

    private ResultActions call(HttpMethod method, User caller, long consultantId, String payloadJson)
            throws Exception {
        var builder = request(method, DRAFT_URI)
            .queryParam("consultationId", "schedule-" + SCHEDULE_ID)
            .queryParam("consultantId", String.valueOf(consultantId))
            .session(session(caller))
            .with(r -> {
                TenantContextHolder.setTenantId(caller.getTenantId());
                return r;
            });
        if (payloadJson != null) {
            builder.contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("payloadJson", payloadJson)));
        }
        return mockMvc.perform(builder);
    }

    private static String key(Object tenantId, Object consultationId, Object ownerId) {
        return tenantId + "|" + consultationId + "|" + ownerId;
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

    private static <T> T build(Class<T> type, Object... provided) throws Exception {
        Constructor<?> ctor = Arrays.stream(type.getDeclaredConstructors())
            .max(Comparator.comparingInt(Constructor::getParameterCount))
            .orElseThrow();
        Object[] args = Arrays.stream(ctor.getParameterTypes())
            .map(p -> Arrays.stream(provided).filter(p::isInstance).findFirst().orElseGet(() -> mock(p)))
            .toArray();
        ctor.setAccessible(true);
        return type.cast(ctor.newInstance(args));
    }
}
