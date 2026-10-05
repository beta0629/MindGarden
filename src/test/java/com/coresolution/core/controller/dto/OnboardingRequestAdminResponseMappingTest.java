package com.coresolution.core.controller.dto;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.core.domain.onboarding.OnboardingRequest;
import com.coresolution.core.domain.onboarding.OnboardingStatus;
import com.coresolution.core.domain.onboarding.RiskLevel;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 목록·상세·승인 응답이 같은 OPS 매핑으로 테넌트와 contactEmail 을 내는지 검증한다.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@DisplayName("온보딩 OPS 응답 매핑")
class OnboardingRequestAdminResponseMappingTest {

    private static final String CONTACT_EMAIL = "owner@example.com";
    private static final String OTHER_EMAIL = "other@example.com";
    private static final String PHONE = "01012345678";
    private static final String TENANT_ID = "tenant-approved-sample";
    private static final String TENANT_NAME = "샘플상담센터";
    private static final String SUBDOMAIN = "sample-center";
    private static final String CIPHER = "k1::QUJDREVGRw==";

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("승인 응답은 테넌트 ID·이름·서브도메인과 checklist contactEmail 을 담는다")
    void from_mapsTenantFieldsAndContactEmail() throws Exception {
        OnboardingRequest request = approvedRequest(
                "{\"adminEmail\":\"" + OTHER_EMAIL + "\",\"contactEmail\":\"  Owner@Example.COM \","
                        + "\"adminPassword\":\"secret-hash\",\"domain\":\"" + SUBDOMAIN + "\"}");

        OnboardingRequestAdminResponse response = OnboardingRequestAdminResponse.from(request, objectMapper);

        assertThat(response.tenantId()).isEqualTo(TENANT_ID);
        assertThat(response.tenantName()).isEqualTo(TENANT_NAME);
        assertThat(response.subdomain()).isEqualTo(SUBDOMAIN);
        assertThat(response.contactEmail()).isEqualTo(CONTACT_EMAIL);
        assertThat(response.requestedBy()).isEqualTo(PHONE);
        assertThat(response.contactEmail()).isNotEqualTo(OTHER_EMAIL);
        assertThat(response.contactEmail()).isNotEqualTo(PHONE);
        JsonNode checklist = objectMapper.readTree(response.checklistJson());
        assertThat(checklist.path("contactEmail").asText()).isEqualTo("  Owner@Example.COM ");
        assertThat(checklist.has("adminPassword")).isFalse();
    }

    @Test
    @DisplayName("adminEmail 만 있고 contactEmail 이 없으면 로그인 이메일은 null")
    void from_ignoresAdminEmailAndPhone() {
        OnboardingRequest request = approvedRequest(
                "{\"adminEmail\":\"" + OTHER_EMAIL + "\",\"email\":\"" + OTHER_EMAIL + "\"}");

        OnboardingRequestAdminResponse response = OnboardingRequestAdminResponse.from(request, objectMapper);

        assertThat(response.contactEmail()).isNull();
        assertThat(response.tenantId()).isEqualTo(TENANT_ID);
    }

    @Test
    @DisplayName("암호문 contactEmail 은 필드와 checklist 어디에도 없다")
    void from_omitsCiphertextContactEmail() throws Exception {
        OnboardingRequest request = approvedRequest(
                "{\"contactEmail\":\"" + CIPHER + "\",\"adminPassword\":\"secret-hash\"}");

        OnboardingRequestAdminResponse response = OnboardingRequestAdminResponse.from(request, objectMapper);

        assertThat(response.contactEmail()).isNull();
        assertThat(response.checklistJson()).doesNotContain(CIPHER);
        assertThat(objectMapper.readTree(response.checklistJson()).has("adminPassword")).isFalse();
    }

    @Test
    @DisplayName("승인 전 신청은 테넌트 ID 가 없어도 contactEmail 은 같은 필드로 나간다")
    void from_pendingStillExposesContactEmail() {
        OnboardingRequest request = OnboardingRequest.builder()
                .id(40L)
                .tenantName(TENANT_NAME)
                .requestedBy(PHONE)
                .status(OnboardingStatus.PENDING)
                .riskLevel(RiskLevel.LOW)
                .checklistJson("{\"contactEmail\":\"" + CONTACT_EMAIL + "\"}")
                .build();

        OnboardingRequestAdminResponse response = OnboardingRequestAdminResponse.from(request, objectMapper);

        assertThat(response.tenantId()).isNull();
        assertThat(response.contactEmail()).isEqualTo(CONTACT_EMAIL);
        assertThat(response.status()).isEqualTo(OnboardingStatus.PENDING);
    }

    private static OnboardingRequest approvedRequest(String checklistJson) {
        return OnboardingRequest.builder()
                .id(39L)
                .tenantId(TENANT_ID)
                .tenantName(TENANT_NAME)
                .subdomain(SUBDOMAIN)
                .requestedBy(PHONE)
                .status(OnboardingStatus.APPROVED)
                .riskLevel(RiskLevel.LOW)
                .checklistJson(checklistJson)
                .build();
    }
}
