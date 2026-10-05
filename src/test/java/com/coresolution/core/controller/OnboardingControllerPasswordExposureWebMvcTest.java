package com.coresolution.core.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import com.coresolution.consultation.config.MindgardenSecurityProperties;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.util.OAuth2DomainUtil;
import com.coresolution.core.constants.SecurityRoleConstants;
import com.coresolution.core.domain.onboarding.OnboardingRequest;
import com.coresolution.core.domain.onboarding.OnboardingStatus;
import com.coresolution.core.domain.onboarding.RiskLevel;
import com.coresolution.core.security.CaptchaVerifier;
import com.coresolution.core.service.OnboardingService;
import com.coresolution.integrationtest.onboarding.OnboardingControllerMvcTestApplication;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * 온보딩 응답 JSON 에 관리자 비밀번호(평문·해시)와 불필요한 개인정보가 노출되지 않는지 MockMvc 로 검증.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */
@SpringBootTest(classes = OnboardingControllerMvcTestApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("OnboardingController — 비밀번호·개인정보 응답 노출 차단")
class OnboardingControllerPasswordExposureWebMvcTest {

    private static final String PUBLIC_BASE = "/api/v1/onboarding";
    private static final String OPS_BASE = "/api/v1/ops/onboarding";
    private static final List<String> PUBLIC_FIELDS = List.of("id", "tenantName", "status", "createdAt");
    private static final String SENSITIVE_PHONE = "010-0000-1111";
    private static final String SENSITIVE_BRN = "000-00-00000";
    private static final String SENSITIVE_ADDRESS = "테스트시 테스트구 테스트로 1";
    private static final String SENSITIVE_REPRESENTATIVE = "테스트대표";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OnboardingService onboardingService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private CaptchaVerifier captchaVerifier;

    @MockBean
    private MindgardenSecurityProperties mindgardenSecurityProperties;

    @MockBean
    private OAuth2DomainUtil oauth2DomainUtil;

    private String rawPassword;
    private String storedHash;
    private String ownerEmail;
    private OnboardingRequest stored;

    @BeforeEach
    void setUp() throws Exception {
        SecurityContextHolder.clearContext();
        rawPassword = "Aa1!" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        storedHash = new BCryptPasswordEncoder().encode(rawPassword);
        ownerEmail = "owner-" + System.nanoTime() + "@example.com";

        Map<String, Object> checklist = new LinkedHashMap<>();
        checklist.put("adminPassword", storedHash);
        checklist.put("contactPhone", SENSITIVE_PHONE);
        checklist.put("contactEmail", ownerEmail);
        checklist.put("brandName", "브랜드");

        stored = OnboardingRequest.builder()
                .id(77L)
                .tenantId("tenant-pw-test")
                .tenantName("테스트 기관")
                .requestedBy(ownerEmail)
                .status(OnboardingStatus.PENDING)
                .riskLevel(RiskLevel.LOW)
                .checklistJson(objectMapper.writeValueAsString(checklist))
                .businessType("CONSULTATION")
                .businessRegistrationNumber(SENSITIVE_BRN)
                .businessAddress(SENSITIVE_ADDRESS)
                .representativeName(SENSITIVE_REPRESENTATIVE)
                .decisionNote("내부 메모")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .isDeleted(false)
                .version(0L)
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void loginAsOps() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "ops-user", "n/a", List.of(new SimpleGrantedAuthority(SecurityRoleConstants.ROLE_OPS))));
    }

    private void assertNoPasswordMaterial(String body) {
        assertThat(body).doesNotContain(rawPassword);
        assertThat(body).doesNotContain(storedHash);
        assertThat(body).doesNotContain("adminPassword");
        assertThat(body).doesNotContain("\"password\"");
    }

    private void assertPublicShape(JsonNode node) {
        List<String> keys = new ArrayList<>();
        node.fieldNames().forEachRemaining(keys::add);
        assertThat(keys).containsExactlyInAnyOrderElementsOf(PUBLIC_FIELDS);
    }

    private void assertNoPersonalData(String body) {
        assertThat(body).doesNotContain(SENSITIVE_PHONE);
        assertThat(body).doesNotContain(SENSITIVE_BRN);
        assertThat(body).doesNotContain(SENSITIVE_ADDRESS);
        assertThat(body).doesNotContain(SENSITIVE_REPRESENTATIVE);
        assertThat(body).doesNotContain(ownerEmail);
        assertThat(body).doesNotContain("checklistJson");
    }

    @Test
    @DisplayName("POST 생성 응답: password 키·checklistJson 없음, 최소 필드만")
    void create_responseHasNoPassword() throws Exception {
        when(captchaVerifier.requiresCaptchaToken()).thenReturn(false);
        when(onboardingService.create(any(), any(), any(), any(), any(), any())).thenReturn(stored);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("tenantName", "테스트 기관");
        body.put("requestedBy", ownerEmail);
        body.put("riskLevel", "LOW");
        body.put("businessType", "CONSULTATION");
        body.put("adminPassword", rawPassword);

        MvcResult result = mockMvc.perform(post(PUBLIC_BASE + "/requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.password").doesNotExist())
                .andExpect(jsonPath("$.data.adminPassword").doesNotExist())
                .andExpect(jsonPath("$.data.checklistJson").doesNotExist())
                .andReturn();

        String json = result.getResponse().getContentAsString();
        assertNoPasswordMaterial(json);
        assertNoPersonalData(json);
        assertPublicShape(objectMapper.readTree(json).path("data"));
    }

    @Test
    @DisplayName("비인증 GET /requests/public?email=: 상태·신청일·기관명(+신청번호)만")
    void publicLookup_returnsMinimalFieldsOnly() throws Exception {
        when(onboardingService.findByEmail(ownerEmail)).thenReturn(List.of(stored));

        MvcResult result = mockMvc.perform(get(PUBLIC_BASE + "/requests/public").param("email", ownerEmail))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].password").doesNotExist())
                .andExpect(jsonPath("$.data[0].checklistJson").doesNotExist())
                .andExpect(jsonPath("$.data[0].status").value("PENDING"))
                .andExpect(jsonPath("$.data[0].tenantName").value("테스트 기관"))
                .andReturn();

        String json = result.getResponse().getContentAsString();
        assertNoPasswordMaterial(json);
        assertNoPersonalData(json);
        assertPublicShape(objectMapper.readTree(json).path("data").get(0));
    }

    @Test
    @DisplayName("반례: 다른 이메일로 조회하면 남의 신청은 0건")
    void publicLookup_otherEmail_returnsNothing() throws Exception {
        String otherEmail = "other-" + System.nanoTime() + "@example.com";
        when(onboardingService.findByEmail(ownerEmail)).thenReturn(List.of(stored));
        when(onboardingService.findByEmail(otherEmail)).thenReturn(Collections.emptyList());

        MvcResult result = mockMvc.perform(get(PUBLIC_BASE + "/requests/public").param("email", otherEmail))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isEmpty())
                .andReturn();

        assertThat(result.getResponse().getContentAsString()).doesNotContain("테스트 기관");
    }

    @Test
    @DisplayName("비인증 GET /requests/public/{id}?email=: 최소 필드만")
    void publicDetail_returnsMinimalFieldsOnly() throws Exception {
        when(onboardingService.findByIdAndEmail(eq(77L), eq(ownerEmail))).thenReturn(stored);

        MvcResult result = mockMvc.perform(get(PUBLIC_BASE + "/requests/public/77").param("email", ownerEmail))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.password").doesNotExist())
                .andReturn();

        String json = result.getResponse().getContentAsString();
        assertNoPasswordMaterial(json);
        assertNoPersonalData(json);
        assertPublicShape(objectMapper.readTree(json).path("data"));
    }

    @Test
    @DisplayName("OPS 목록(Page): checklistJson 은 남기되 adminPassword 제거")
    void opsList_hasNoPassword() throws Exception {
        loginAsOps();
        when(onboardingService.findAll(any())).thenReturn(
                new PageImpl<>(List.of(stored), PageRequest.of(0, 20), 1));

        MvcResult result = mockMvc.perform(get(OPS_BASE + "/requests"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].password").doesNotExist())
                .andExpect(jsonPath("$.data.content[0].checklistJson").exists())
                .andExpect(jsonPath("$.data.content[0].tenantName").value("테스트 기관"))
                .andReturn();

        String json = result.getResponse().getContentAsString();
        assertNoPasswordMaterial(json);
        String checklist = objectMapper.readTree(json).path("data").path("content").get(0)
                .path("checklistJson").asText();
        assertThat(objectMapper.readTree(checklist).has("contactPhone")).isTrue();
        assertThat(objectMapper.readTree(checklist).has("adminPassword")).isFalse();
    }

    @Test
    @DisplayName("OPS 대기 목록: adminPassword 제거")
    void opsPending_hasNoPassword() throws Exception {
        loginAsOps();
        when(onboardingService.findPending()).thenReturn(List.of(stored));

        MvcResult result = mockMvc.perform(get(OPS_BASE + "/requests/pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].password").doesNotExist())
                .andReturn();

        assertNoPasswordMaterial(result.getResponse().getContentAsString());
    }

    @Test
    @DisplayName("OPS 상세: adminPassword 제거")
    void opsDetail_hasNoPassword() throws Exception {
        loginAsOps();
        when(onboardingService.getById(77L)).thenReturn(stored);

        MvcResult result = mockMvc.perform(get(OPS_BASE + "/requests/77"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.password").doesNotExist())
                .andExpect(jsonPath("$.data.id").value(77))
                .andReturn();

        assertNoPasswordMaterial(result.getResponse().getContentAsString());
    }

    @Test
    @DisplayName("OPS 승인 응답: adminAccount 에 password 없음")
    void opsDecision_adminAccountHasNoPassword() throws Exception {
        loginAsOps();
        stored.setStatus(OnboardingStatus.APPROVED);
        when(onboardingService.decide(eq(77L), eq(OnboardingStatus.APPROVED), any(), any()))
                .thenReturn(stored);
        User admin = new User();
        admin.setEmail(ownerEmail);
        when(userRepository.findByEmailAndTenantId(ownerEmail, "tenant-pw-test"))
                .thenReturn(Optional.of(admin));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", "APPROVED");
        body.put("actorId", "ops-user");

        MvcResult result = mockMvc.perform(post(OPS_BASE + "/requests/77/decision")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.adminAccount.email").value(ownerEmail))
                .andExpect(jsonPath("$.data.adminAccount.password").doesNotExist())
                .andExpect(jsonPath("$.data.request.password").doesNotExist())
                .andReturn();

        assertNoPasswordMaterial(result.getResponse().getContentAsString());
    }

    @Test
    @DisplayName("OPS 승인 응답: 평문 저장 이메일은 컨버터 조회가 비어도 contactEmail 로 찾는다")
    void opsDecision_adminAccountFromPlaintextEmailWhenConverterMisses() throws Exception {
        loginAsOps();
        stored.setStatus(OnboardingStatus.APPROVED);
        stored.setRequestedBy("01012345678");
        when(onboardingService.decide(eq(77L), eq(OnboardingStatus.APPROVED), any(), any()))
                .thenReturn(stored);
        when(userRepository.findByEmailAndTenantId(ownerEmail, "tenant-pw-test"))
                .thenReturn(Optional.empty());
        User admin = new User();
        admin.setEmail(ownerEmail);
        when(userRepository.findByTenantId("tenant-pw-test")).thenReturn(List.of(admin));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", "APPROVED");
        body.put("actorId", "ops-user");

        mockMvc.perform(post(OPS_BASE + "/requests/77/decision")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.adminAccount.email").value(ownerEmail))
                .andExpect(jsonPath("$.data.adminAccount.password").doesNotExist());
    }

    @Test
    @DisplayName("반례: 미인증으로 OPS 목록 호출 시 거부되고 서비스 미호출")
    void opsList_unauthenticated_rejected() throws Exception {
        MvcResult result = mockMvc.perform(get(OPS_BASE + "/requests")).andReturn();

        assertThat(result.getResponse().getStatus()).isBetween(400, 499);
        assertNoPasswordMaterial(result.getResponse().getContentAsString());
        verifyNoInteractions(onboardingService);
    }
}
