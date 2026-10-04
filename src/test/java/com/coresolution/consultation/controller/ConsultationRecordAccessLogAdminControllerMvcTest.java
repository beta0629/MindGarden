package com.coresolution.consultation.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Optional;

import com.coresolution.consultation.config.SecurityHeaderFilter;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.constant.consultation.ConsultationRecordAccessAudit;
import com.coresolution.consultation.entity.ConsultationRecordAccessLog;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.GlobalExceptionHandler;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultationRecordAccessLogRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * 상담일지 열람 감사 로그 조회 API 권한 가드.
 *
 * <p>관리자 전용·테넌트 범위 강제이며 응답에 본문이 없다는 것을 고정한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@DisplayName("상담일지 열람 감사 로그 API 권한")
class ConsultationRecordAccessLogAdminControllerMvcTest {

    private static final String TENANT_A = "tenant-audit-a";
    private static final String TENANT_B = "tenant-audit-b";
    private static final String URI = "/api/v1/admin/consultation-record-access-logs";

    private ConsultationRecordAccessLogRepository repository;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        TenantContextHolder.clear();
        repository = mock(ConsultationRecordAccessLogRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        ClientPathAccessGuard guard = new ClientPathAccessGuard(
            mock(ConsultantClientMappingRepository.class), userRepository);
        when(userRepository.findByTenantIdAndId(anyString(), any())).thenReturn(Optional.of(new User()));

        ConsultationRecordAccessLog entry = ConsultationRecordAccessLog.builder()
            .recordId(9001L)
            .recordKind(ConsultationRecordAccessAudit.KIND_CONSULTATION_RECORD)
            .clientId(20L)
            .authorConsultantId(22L)
            .actorId(1L)
            .actorRole(UserRole.ADMIN.name())
            .action(ConsultationRecordAccessAudit.ACTION_VIEW)
            .result(ConsultationRecordAccessAudit.RESULT_ALLOWED)
            .build();
        entry.setTenantId(TENANT_A);
        Page<ConsultationRecordAccessLog> page = new PageImpl<>(List.of(entry));
        when(repository.searchByTenant(anyString(), any(), any(), any(), any(), any(), any()))
            .thenReturn(page);

        mockMvc = MockMvcBuilders
            .standaloneSetup(new ConsultationRecordAccessLogAdminController(guard, repository))
            .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
            .addFilter(new SecurityHeaderFilter())
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("미인증 401 / 내담자 403 / 상담사 403 / 다른 테넌트 관리자 403")
    void guardMatrix() throws Exception {
        mockMvc.perform(request(HttpMethod.GET, URI)).andExpect(status().isUnauthorized());
        verifyNoInteractions(repository);

        call(user(20L, UserRole.CLIENT, TENANT_A)).andExpect(status().isForbidden());
        call(user(41L, UserRole.CONSULTANT, TENANT_A)).andExpect(status().isForbidden());
        verifyNoInteractions(repository);

        User otherTenantAdmin = user(900L, UserRole.ADMIN, TENANT_B);
        mockMvc.perform(request(HttpMethod.GET, URI).session(session(otherTenantAdmin)).with(r -> {
            TenantContextHolder.setTenantId(TENANT_A);
            return r;
        })).andExpect(status().isForbidden());
        verifyNoInteractions(repository);
    }

    @Test
    @DisplayName("같은 테넌트 관리자 200 — 본문 필드 없이 메타만")
    void manager_readsMetaOnly() throws Exception {
        call(user(1L, UserRole.ADMIN, TENANT_A))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.logs.length()").value(1))
            .andExpect(jsonPath("$.data.logs[0].action")
                .value(ConsultationRecordAccessAudit.ACTION_VIEW))
            .andExpect(jsonPath("$.data.logs[0].result")
                .value(ConsultationRecordAccessAudit.RESULT_ALLOWED))
            .andExpect(jsonPath("$.data.logs[0].mainIssues").doesNotExist())
            .andExpect(jsonPath("$.data.logs[0].clientCondition").doesNotExist());
    }

    private ResultActions call(User caller) throws Exception {
        return mockMvc.perform(request(HttpMethod.GET, URI).session(session(caller)).with(r -> {
            TenantContextHolder.setTenantId(caller.getTenantId());
            return r;
        }));
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
}
