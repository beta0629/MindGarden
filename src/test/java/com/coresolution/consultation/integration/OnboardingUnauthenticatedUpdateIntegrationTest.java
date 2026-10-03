package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import com.coresolution.core.domain.onboarding.OnboardingRequest;
import com.coresolution.core.domain.onboarding.OnboardingStatus;
import com.coresolution.core.domain.onboarding.RiskLevel;
import com.coresolution.core.repository.onboarding.OnboardingRequestRepository;
import jakarta.persistence.EntityManager;
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
 * 미인증 PUT /api/v1/onboarding/requests/{id} 가 거절되고 저장된 이름을 바꾸지 않는지 검증한다.
 *
 * @author MindGarden
 * @since 2026-10-03
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("온보딩 요청 미인증 수정 거절")
class OnboardingUnauthenticatedUpdateIntegrationTest {

    private static final String REPLACEMENT_NAME = "should-not-stick";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private OnboardingRequestRepository onboardingRequestRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    @DisplayName("미인증 PUT /api/v1/onboarding/requests/{id} → 401, 저장 이름 유지")
    void unauthenticatedPut_isRejected_andDoesNotChangeStoredName() throws Exception {
        StoredRequest stored = persistPendingRequest();

        mockMvc.perform(put("/api/v1/onboarding/requests/" + stored.id())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tenantName\":\"" + REPLACEMENT_NAME + "\"}"))
                .andExpect(status().isUnauthorized());

        assertStoredNameUnchanged(stored);
    }

    @Test
    @DisplayName("미인증 PUT + 대상 테넌트 헤더 → 401, 저장 이름 유지")
    void unauthenticatedPut_withTenantHeader_isRejected_andDoesNotChangeStoredName() throws Exception {
        StoredRequest stored = persistPendingRequest();

        mockMvc.perform(put("/api/v1/onboarding/requests/" + stored.id())
                        .header("X-Tenant-Id", stored.tenantId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tenantName\":\"" + REPLACEMENT_NAME + "\"}"))
                .andExpect(status().isUnauthorized());

        assertStoredNameUnchanged(stored);
    }

    @Test
    @DisplayName("미인증 PUT /api/v1/ops/onboarding/requests/{id} → 401, 저장 이름 유지")
    void unauthenticatedOpsPut_isRejected_andDoesNotChangeStoredName() throws Exception {
        StoredRequest stored = persistPendingRequest();

        mockMvc.perform(put("/api/v1/ops/onboarding/requests/" + stored.id())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tenantName\":\"" + REPLACEMENT_NAME + "\"}"))
                .andExpect(status().isUnauthorized());

        assertStoredNameUnchanged(stored);
    }

    private StoredRequest persistPendingRequest() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String originalName = "orig-" + suffix;
        String tenantId = "tenant-" + suffix;
        OnboardingRequest saved = onboardingRequestRepository.save(OnboardingRequest.builder()
                .tenantId(tenantId)
                .tenantName(originalName)
                .requestedBy("probe-" + suffix + "@example.com")
                .status(OnboardingStatus.PENDING)
                .riskLevel(RiskLevel.LOW)
                .isDeleted(false)
                .build());
        entityManager.flush();
        entityManager.clear();
        return new StoredRequest(saved.getId(), tenantId, originalName);
    }

    private void assertStoredNameUnchanged(StoredRequest stored) {
        entityManager.clear();
        OnboardingRequest reloaded = onboardingRequestRepository.findById(stored.id()).orElseThrow();
        assertThat(reloaded.getTenantName())
                .as("미인증 PUT 은 저장된 테넌트 이름을 바꾸면 안 됩니다.")
                .isEqualTo(stored.originalName());
        assertThat(reloaded.getTenantName()).isNotEqualTo(REPLACEMENT_NAME);
    }

    private record StoredRequest(Long id, String tenantId, String originalName) {
    }
}
