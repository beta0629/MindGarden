package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.UUID;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.support.ResourceOwnerAccessGuard;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.integrationtest.support.WithMockAdminSecurityContext;
import org.hibernate.LazyInitializationException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/**
 * GET /api/v1/admin/mappings/{id} — OSIV 비활성 환경에서 같은 기관 관리자 조회가 200 + 응답 DTO 인지 고정한다.
 *
 * <p>테스트 트랜잭션을 두지 않아 운영과 같이 컨트롤러가 트랜잭션 밖에서 응답을 만든다. 예전 구현은 서비스가
 * 상담사·내담자 프록시를 {@code getId()} 로만 건드려 초기화되지 않았고, 컨트롤러가 이름을 읽다가
 * LazyInitializationException(500) 이 났다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@WithMockAdminSecurityContext
@DisplayName("GET mappings/{id} — 트랜잭션 밖 응답 생성(OSIV off) 200·권한 가드 유지")
class AdminControllerMappingDetailIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ConsultantClientMappingRepository mappingRepository;

    @Autowired
    private AdminService adminService;

    private String tenantId;
    private User consultant;
    private User client;
    private ConsultantClientMapping mapping;

    @BeforeEach
    void setUp() {
        tenantId = "mdt-" + UUID.randomUUID().toString().replace("-", "").substring(0, 28);
        TenantContextHolder.setTenantId(tenantId);
        consultant = userRepository.saveAndFlush(newUser(UserRole.CONSULTANT, "상담사"));
        client = userRepository.saveAndFlush(newUser(UserRole.CLIENT, "내담자"));
        ConsultantClientMapping m = new ConsultantClientMapping();
        m.setTenantId(tenantId);
        m.setConsultant(consultant);
        m.setClient(client);
        m.setStartDate(LocalDateTime.now());
        m.setStatus(ConsultantClientMapping.MappingStatus.ACTIVE);
        m.setTotalSessions(10);
        m.setRemainingSessions(10);
        m.setUsedSessions(0);
        m.setPackageName("detail-test");
        m.setPackagePrice(100_000L);
        mapping = mappingRepository.saveAndFlush(m);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.setTenantId(tenantId);
        mappingRepository.deleteById(mapping.getId());
        userRepository.deleteById(client.getId());
        userRepository.deleteById(consultant.getId());
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("원인 재현: 트랜잭션 밖에서 엔티티의 상담사 이름을 읽으면 LazyInitializationException")
    void entityOutsideTransaction_lazyInit() {
        ConsultantClientMapping entity = adminService.getMappingById(mapping.getId());

        assertThatThrownBy(() -> entity.getConsultant().getName())
                .isInstanceOf(LazyInitializationException.class);
    }

    @Test
    @DisplayName("같은 기관 관리자 — 200 + DTO(상담사·내담자 id·이름, 상태, 회기)")
    void sameTenantAdmin_ok() throws Exception {
        mockMvc.perform(detail(caller(UserRole.ADMIN, tenantId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(mapping.getId()))
                .andExpect(jsonPath("$.data.consultantId").value(consultant.getId()))
                .andExpect(jsonPath("$.data.clientId").value(client.getId()))
                .andExpect(jsonPath("$.data.consultantName").isNotEmpty())
                .andExpect(jsonPath("$.data.clientName").isNotEmpty())
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andExpect(jsonPath("$.data.totalSessions").value(10));
    }

    @Test
    @DisplayName("권한 가드 유지 — 내담자·상담사 403, 다른 기관 관리자 403, 없는 id 403 (본문 data 없음)")
    void guardStillApplies() throws Exception {
        for (UserRole role : new UserRole[] {UserRole.CLIENT, UserRole.CONSULTANT}) {
            mockMvc.perform(detail(caller(role, tenantId)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.data").doesNotExist());
        }
        String otherTenant = tenantId + "x";
        TenantContextHolder.setTenantId(otherTenant);
        mockMvc.perform(detail(caller(UserRole.ADMIN, otherTenant)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value(ResourceOwnerAccessGuard.DENIAL_RESOURCE_UNAVAILABLE))
                .andExpect(jsonPath("$.data").doesNotExist());
        TenantContextHolder.setTenantId(tenantId);
        mockMvc.perform(get("/api/v1/admin/mappings/{id}", mapping.getId() + 100_000L)
                        .sessionAttr(SessionConstants.USER_OBJECT, caller(UserRole.ADMIN, tenantId))
                        .sessionAttr(SessionConstants.TENANT_ID, tenantId))
                .andExpect(status().isForbidden());
        assertThat(mappingRepository.findById(mapping.getId())).isPresent();
    }

    private MockHttpServletRequestBuilder detail(User caller) {
        return get("/api/v1/admin/mappings/{id}", mapping.getId())
                .sessionAttr(SessionConstants.USER_OBJECT, caller)
                .sessionAttr(SessionConstants.TENANT_ID, caller.getTenantId());
    }

    private static User caller(UserRole role, String tenantId) {
        User user = new User();
        user.setId(role == UserRole.ADMIN ? 1L : 2L);
        user.setUserId("mdt-caller-" + role);
        user.setRole(role);
        user.setTenantId(tenantId);
        return user;
    }

    private User newUser(UserRole role, String name) {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setTenantId(tenantId);
        user.setUserId("mdt-" + role.name().toLowerCase() + "-" + suffix);
        user.setEmail("mdt-" + suffix + "@example.test");
        user.setPassword("not-a-real-hash");
        user.setName(name);
        user.setRole(role);
        user.setIsDeleted(false);
        return user;
    }
}
