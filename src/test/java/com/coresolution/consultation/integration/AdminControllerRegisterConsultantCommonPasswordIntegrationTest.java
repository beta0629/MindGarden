package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.coresolution.consultation.ConsultationManagementApplication;
import com.coresolution.consultation.constant.ProfessionalProviderTypeConstants;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.security.PasswordPolicy;
import com.coresolution.core.security.PasswordService;
import com.coresolution.integrationtest.support.WithMockAdminSecurityContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * POST /api/v1/admin/consultants — 금지 부분 문자열이 있는 비밀번호.
 *
 * <p>컨트롤러는 예외를 잡지 않고 {@code AdminServiceImpl.registerConsultant} 가
 * 사용자 입력 비밀번호를 {@code PasswordService.encodePassword} 로 넘긴다.
 * 정책 위반은 {@link PasswordService.InvalidPasswordException} 그대로 올라가고
 * {@code GlobalExceptionHandler.handleInvalidPassword} 가 HTTP 400
 * {@code INVALID_PASSWORD} 와 정책 문구를 돌려준다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@SpringBootTest(classes = ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@Transactional
@WithMockAdminSecurityContext
@DisplayName("AdminController 상담사 등록 흔한 단어 비밀번호")
class AdminControllerRegisterConsultantCommonPasswordIntegrationTest {

    /** PasswordPolicy 금지 부분 문자열 {@code user} 를 포함하고 그 앞 검사는 통과하는 비밀번호. */
    private static final String COMMON_WORD_PASSWORD = "Myuser9!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private CommonCodeRepository commonCodeRepository;

    private String tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID().toString();
        Tenant tenant = Tenant.builder()
                .tenantId(tenantId)
                .name("비밀번호 정책 테스트 테넌트")
                .businessType("CONSULTATION")
                .status(Tenant.TenantStatus.ACTIVE)
                .contactEmail("pw-policy@test.com")
                .build();
        tenantRepository.save(tenant);
        TenantContextHolder.setTenantId(tenantId);

        CommonCode defaultProfessionalType = new CommonCode();
        defaultProfessionalType.setTenantId(tenantId);
        defaultProfessionalType.setCodeGroup(ProfessionalProviderTypeConstants.CODE_GROUP);
        defaultProfessionalType.setCodeValue(ProfessionalProviderTypeConstants.DEFAULT_TYPE_CODE_VALUE);
        defaultProfessionalType.setCodeLabel("기본 상담사");
        defaultProfessionalType.setKoreanName("기본 상담사");
        defaultProfessionalType.setSortOrder(0);
        defaultProfessionalType.setIsActive(true);
        defaultProfessionalType.setIsDeleted(false);
        defaultProfessionalType.setExtraData(
                "{\"systemAuthorityRole\":\"CONSULTANT\",\"isDefault\":true}");
        commonCodeRepository.save(defaultProfessionalType);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("user 가 들어간 비밀번호는 400, errorCode=INVALID_PASSWORD, message 는 정책 문구")
    void registerConsultant_commonWordPassword_returns400WithPolicyMessage() throws Exception {
        String policyMessage = PasswordPolicy.firstLoginStorageViolationMessage(COMMON_WORD_PASSWORD);
        assertThat(policyMessage).isEqualTo("일반적인 패턴의 비밀번호는 사용할 수 없습니다.");

        User admin = new User();
        admin.setId(1L);
        admin.setUserId("admin-consultant-password");
        admin.setEmail("admin-consultant-password@test.com");
        admin.setName("테스트관리자");
        admin.setTenantId(tenantId);
        admin.setRole(UserRole.ADMIN);

        Map<String, Object> body = new HashMap<>();
        body.put("email", "mvc-consultant-pw-" + UUID.randomUUID() + "@test.com");
        body.put("name", "테스트상담사");
        body.put("password", COMMON_WORD_PASSWORD);

        mockMvc.perform(post("/api/v1/admin/consultants")
                        .sessionAttr(SessionConstants.USER_OBJECT, admin)
                        .sessionAttr(SessionConstants.TENANT_ID, tenantId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errorCode").value(PasswordService.InvalidPasswordException.ERROR_CODE))
                .andExpect(jsonPath("$.message").value(policyMessage));
    }
}
