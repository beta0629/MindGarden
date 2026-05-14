package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.coresolution.consultation.ConsultationManagementApplication;
import com.coresolution.consultation.dto.SocialSignupRequest;
import com.coresolution.consultation.dto.SocialSignupResponse;
import com.coresolution.consultation.service.SocialAuthService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link com.coresolution.consultation.controller.SocialAuthController} 소셜 회원가입 MockMvc 검증.
 * <p>
 * 실제 {@code User} 영속화는 Lombok {@code @Builder} 하위 타입에서 상위 {@code is_deleted} 등이 비어
 * H2 배치 INSERT가 실패할 수 있어(코더 쪽 엔티티 빌더 정합 과제), 여기서는 서비스를 목으로 두고
 * 공개 API 분기에서 {@code X-Tenant-Id} 가 컨트롤러 호출 시점까지 컨텍스트에 잡히는지·HTTP 계약을 검증한다.
 */
@SpringBootTest(classes = ConsultationManagementApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("POST /api/v1/auth/social/signup MockMvc (서비스 목)")
class SocialSignupMvcIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TenantRepository tenantRepository;

    @MockBean
    private SocialAuthService socialAuthService;

    private String tenantId;

    @BeforeEach
    void createTenant() {
        tenantId = UUID.randomUUID().toString();
        tenantRepository.save(Tenant.builder()
            .tenantId(tenantId)
            .name("소셜 MockMvc 테넌트")
            .businessType("CONSULTATION")
            .status(Tenant.TenantStatus.ACTIVE)
            .contactEmail("social-mvc+" + tenantId + "@example.com")
            .build());
    }

    @Test
    @DisplayName("해피 패스: X-Tenant-Id + 비밀번호 포함 본문 → 200, 서비스 호출 시 테넌트 컨텍스트 일치")
    void socialSignup_withPassword_andTenantHeader_returns200() throws Exception {
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        String email = "mvc-pw-" + suffix + "@test.com";
        Map<String, Object> body = baseSignupBody(email);
        body.put("password", "ValidPass1!");

        when(socialAuthService.createUserFromSocial(any())).thenAnswer(invocation -> {
            assertThat(TenantContextHolder.getTenantId()).isEqualTo(tenantId);
            SocialSignupRequest req = invocation.getArgument(0);
            return SocialSignupResponse.builder()
                .success(true)
                .message("ok")
                .userId(1L)
                .email(req.getEmail())
                .name(req.getName())
                .build();
        });

        mockMvc.perform(post("/api/v1/auth/social/signup")
                .header("X-Tenant-Id", tenantId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.email").value(email));

        verify(socialAuthService).createUserFromSocial(any(SocialSignupRequest.class));
    }

    @Test
    @DisplayName("해피 패스(SNS A안): 비밀번호 필드 없이 X-Tenant-Id만으로 200, 서비스에 요청 전달")
    void socialSignup_withoutPassword_andTenantHeader_returns200() throws Exception {
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        String email = "mvc-nopw-" + suffix + "@test.com";
        Map<String, Object> body = baseSignupBody(email);

        when(socialAuthService.createUserFromSocial(any())).thenAnswer(invocation -> {
            assertThat(TenantContextHolder.getTenantId()).isEqualTo(tenantId);
            SocialSignupRequest req = invocation.getArgument(0);
            assertThat(req.getPassword()).isNull();
            return SocialSignupResponse.builder()
                .success(true)
                .message("ok")
                .userId(2L)
                .email(req.getEmail())
                .name(req.getName())
                .build();
        });

        mockMvc.perform(post("/api/v1/auth/social/signup")
                .header("X-Tenant-Id", tenantId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.email").value(email));

        verify(socialAuthService).createUserFromSocial(any(SocialSignupRequest.class));
    }

    private static Map<String, Object> baseSignupBody(String email) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("email", email);
        m.put("name", "MockMvc소셜");
        m.put("phone", "01012345678");
        m.put("provider", "KAKAO");
        m.put("providerUserId", "kakao-mvc-" + UUID.randomUUID());
        m.put("providerUsername", "mvc-nick");
        m.put("providerProfileImage", "https://example.com/p.png");
        m.put("privacyConsent", true);
        m.put("termsConsent", true);
        m.put("marketingConsent", false);
        return m;
    }
}
