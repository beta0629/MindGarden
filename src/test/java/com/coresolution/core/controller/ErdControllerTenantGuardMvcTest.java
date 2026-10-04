package com.coresolution.core.controller;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.lang.reflect.Constructor;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.GlobalExceptionHandler;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import com.coresolution.consultation.service.support.ResourceOwnerAccessGuard;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.ErdDiagram;
import com.coresolution.core.dto.ErdDiagramResponse;
import com.coresolution.core.repository.ErdDiagramRepository;
import com.coresolution.core.service.ErdGenerationService;
import com.coresolution.core.service.ErdHistoryService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * 테넌트 ERD API — 세션 테넌트 관리자 본인 테넌트 전용.
 *
 * <p>경로 tenantId 는 세션 테넌트와 대조만 하고, 조회는 항상 세션 테넌트로 한다. 다른 테넌트 경로·다이어그램,
 * 관리자 아닌 역할, 요청 테넌트 컨텍스트 위조는 모두 공통 403 「접근할 수 없는 자료입니다.」.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("테넌트 ERD — 세션 테넌트 관리자 전용")
class ErdControllerTenantGuardMvcTest {

    private static final String TENANT_A = "tenant-erd-a";
    private static final String TENANT_B = "tenant-erd-b";
    private static final String DIAGRAM_A = "erd-a";
    private static final String DIAGRAM_B = "erd-b";
    private static final String DIAGRAM_PUBLIC = "erd-public";
    private static final String DIAGRAM_PRIVATE_SYSTEM = "erd-private-system";
    private static final String BASE = "/api/v1/tenants/{tenantId}/erd";

    private ErdGenerationService erdGenerationService;
    private ErdHistoryService erdHistoryService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() throws Exception {
        TenantContextHolder.clear();
        erdGenerationService = mock(ErdGenerationService.class);
        erdHistoryService = mock(ErdHistoryService.class);
        ErdDiagramRepository erdDiagramRepository = mock(ErdDiagramRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        ClientPathAccessGuard clientGuard = new ClientPathAccessGuard(
            mock(ConsultantClientMappingRepository.class), userRepository);
        ResourceOwnerAccessGuard guard = build(ResourceOwnerAccessGuard.class, clientGuard, erdDiagramRepository,
            userRepository);
        mockMvc = MockMvcBuilders.standaloneSetup(new ErdController(erdGenerationService, erdHistoryService, guard))
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();

        when(erdDiagramRepository.findByDiagramId(DIAGRAM_A)).thenReturn(Optional.of(diagram(TENANT_A, false)));
        when(erdDiagramRepository.findByDiagramId(DIAGRAM_B)).thenReturn(Optional.of(diagram(TENANT_B, false)));
        when(erdDiagramRepository.findByDiagramId(DIAGRAM_PUBLIC)).thenReturn(Optional.of(diagram(null, true)));
        when(erdDiagramRepository.findByDiagramId(DIAGRAM_PRIVATE_SYSTEM))
            .thenReturn(Optional.of(diagram(null, false)));
        when(erdGenerationService.getTenantErds(TENANT_A))
            .thenReturn(List.of(ErdDiagramResponse.builder().diagramId(DIAGRAM_A).tenantId(TENANT_A).build()));
        when(erdGenerationService.getErd(anyString()))
            .thenAnswer(inv -> ErdDiagramResponse.builder().diagramId(inv.getArgument(0)).build());
        when(erdHistoryService.getHistoryByDiagramId(anyString())).thenReturn(List.of());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("미인증 — 목록·상세·이력 401, 서비스 미호출")
    void anonymous_unauthorized() throws Exception {
        mockMvc.perform(get(BASE, TENANT_A)).andExpect(status().isUnauthorized());
        mockMvc.perform(get(BASE + "/{d}", TENANT_A, DIAGRAM_A)).andExpect(status().isUnauthorized());
        mockMvc.perform(get(BASE + "/{d}/history", TENANT_A, DIAGRAM_A)).andExpect(status().isUnauthorized());
        verifyNoInteractions(erdGenerationService, erdHistoryService);
    }

    @Test
    @DisplayName("관리자 아닌 역할(사무원·상담사·내담자) — 자기 테넌트라도 공통 403")
    void nonAdminRoles_forbidden() throws Exception {
        for (UserRole role : new UserRole[] {UserRole.STAFF, UserRole.CONSULTANT, UserRole.CLIENT}) {
            assertSharedDenial(mockMvc.perform(as(get(BASE, TENANT_A), user(role, TENANT_A), TENANT_A)));
            assertSharedDenial(mockMvc.perform(
                as(get(BASE + "/{d}", TENANT_A, DIAGRAM_A), user(role, TENANT_A), TENANT_A)));
        }
        verifyNoInteractions(erdGenerationService, erdHistoryService);
    }

    @Test
    @DisplayName("같은 테넌트 관리자 — 목록은 세션 테넌트로 조회, 자기 다이어그램 상세·이력 200")
    void ownTenantAdmin_ok() throws Exception {
        User admin = user(UserRole.ADMIN, TENANT_A);
        mockMvc.perform(as(get(BASE, TENANT_A), admin, TENANT_A))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[0].tenantId").value(TENANT_A));
        verify(erdGenerationService).getTenantErds(TENANT_A);
        mockMvc.perform(as(get(BASE + "/{d}", TENANT_A, DIAGRAM_A), admin, TENANT_A)).andExpect(status().isOk());
        mockMvc.perform(as(get(BASE + "/{d}/history", TENANT_A, DIAGRAM_A), admin, TENANT_A))
            .andExpect(status().isOk());
        mockMvc.perform(as(get(BASE + "/{d}", TENANT_A, DIAGRAM_PUBLIC), admin, TENANT_A))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("다른 테넌트 경로 — 목록·상세·이력 공통 403, 다른 테넌트로 조회하지 않음")
    void otherTenantPath_forbidden() throws Exception {
        User admin = user(UserRole.ADMIN, TENANT_A);
        assertSharedDenial(mockMvc.perform(as(get(BASE, TENANT_B), admin, TENANT_A)));
        assertSharedDenial(mockMvc.perform(as(get(BASE + "/{d}", TENANT_B, DIAGRAM_B), admin, TENANT_A)));
        assertSharedDenial(mockMvc.perform(as(get(BASE + "/{d}/history", TENANT_B, DIAGRAM_B), admin, TENANT_A)));
        verify(erdGenerationService, never()).getTenantErds(TENANT_B);
        verifyNoInteractions(erdHistoryService);
    }

    @Test
    @DisplayName("자기 테넌트 경로로 다른 테넌트·비공개 시스템·없는 다이어그램 — 공통 403")
    void otherDiagramUnderOwnPath_forbidden() throws Exception {
        User admin = user(UserRole.ADMIN, TENANT_A);
        for (String diagramId : new String[] {DIAGRAM_B, DIAGRAM_PRIVATE_SYSTEM, "erd-unknown"}) {
            assertSharedDenial(mockMvc.perform(as(get(BASE + "/{d}", TENANT_A, diagramId), admin, TENANT_A)));
            assertSharedDenial(mockMvc.perform(
                as(get(BASE + "/{d}/history", TENANT_A, diagramId), admin, TENANT_A)));
        }
        verifyNoInteractions(erdGenerationService, erdHistoryService);
    }

    @Test
    @DisplayName("요청 테넌트 컨텍스트를 다른 테넌트로 위조 — 세션 테넌트와 달라 공통 403")
    void spoofedTenantContext_forbidden() throws Exception {
        User admin = user(UserRole.ADMIN, TENANT_A);
        assertSharedDenialOrTenantDenial(mockMvc.perform(as(get(BASE, TENANT_B), admin, TENANT_B)));
        verify(erdGenerationService, never()).getTenantErds(TENANT_B);
    }

    private ResultActions assertSharedDenial(ResultActions result) throws Exception {
        return result.andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value(ResourceOwnerAccessGuard.DENIAL_RESOURCE_UNAVAILABLE))
            .andExpect(jsonPath("$.data").doesNotExist());
    }

    /** 세션·컨텍스트 테넌트 불일치는 {@link ClientPathAccessGuard} 의 테넌트 거부(403)로 먼저 막힌다. */
    private static void assertSharedDenialOrTenantDenial(ResultActions result) throws Exception {
        result.andExpect(status().isForbidden()).andExpect(jsonPath("$.data").doesNotExist());
    }

    private static MockHttpServletRequestBuilder as(MockHttpServletRequestBuilder builder, User caller,
            String contextTenantId) {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionConstants.USER_OBJECT, caller);
        session.setAttribute(SessionConstants.TENANT_ID, caller.getTenantId());
        return builder.session(session).with(r -> {
            TenantContextHolder.setTenantId(contextTenantId);
            return r;
        });
    }

    private static User user(UserRole role, String tenantId) {
        User u = new User();
        u.setId(10L);
        u.setUserId("u-erd");
        u.setRole(role);
        u.setTenantId(tenantId);
        return u;
    }

    private static ErdDiagram diagram(String tenantId, boolean isPublic) {
        ErdDiagram d = new ErdDiagram();
        d.setTenantId(tenantId);
        d.setIsPublic(isPublic);
        return d;
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
