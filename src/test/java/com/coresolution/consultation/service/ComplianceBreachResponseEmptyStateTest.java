package com.coresolution.consultation.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.compliance.ComplianceServiceErrorMessages;
import com.coresolution.consultation.controller.ComplianceController;
import com.coresolution.consultation.repository.PersonalDataAccessLogRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/**
 * 유출(침해사고) 대응 표본 제거 검증.
 *
 * <p>등록 데이터가 없으면 빈 대응팀·절차 + 「유출 대응 체계를 등록해 주세요」만 응답하고,
 * 삭제된 표본(기술/법무/마케팅/개발팀장, 4단계 절차)이 어떤 테넌트·어떤 컴플라이언스 조회
 * 응답에도 나타나지 않음을 확인한다.
 *
 * @author MindGarden
 * @since 2026-10-03
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("컴플라이언스 — 유출 대응 표본 제거 · 빈 상태")
class ComplianceBreachResponseEmptyStateTest {

    private static final String TENANT_A = "tenant-a";
    private static final String TENANT_B = "tenant-b";

    /** 삭제된 표본 문자열 — 어떤 응답에도 나타나선 안 된다. */
    private static final List<String> REMOVED_SAMPLE_STRINGS = List.of(
            "기술팀장", "법무팀장", "마케팅팀장", "개발팀장",
            "침해사고 발견 및 신고", "개인정보보호위원회 신고", "피해자 통지", "원인 분석 및 재발방지",
            "발견 후 24시간 이내", "발견 후 5일 이내", "침해사고 발생 후 30일 이내",
            "개인정보보호 기본 교육", "의료정보보호 전문 교육",
            "권한 관리 강화", "암호화 강화");

    @Mock
    private UserRepository userRepository;

    @Mock
    private PersonalDataAccessLogRepository personalDataAccessLogRepository;

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private PersonalDataDestructionService personalDataDestructionService;

    private ComplianceService complianceService;

    private ComplianceController complianceController;

    @BeforeEach
    void setUp() {
        complianceService = new ComplianceService(personalDataAccessLogRepository, userRepository, tenantRepository);
        complianceController = new ComplianceController(complianceService, personalDataDestructionService);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private static Tenant tenant(String tenantId, String phone, String email) {
        Tenant tenant = new Tenant();
        tenant.setTenantId(tenantId);
        tenant.setName(tenantId + "-센터");
        tenant.setContactPhone(phone);
        tenant.setContactEmail(email);
        tenant.setAddress(tenantId + " 주소");
        return tenant;
    }

    private static void assertNoSampleStrings(String rendered) {
        for (String sample : REMOVED_SAMPLE_STRINGS) {
            assertThat(rendered).as("표본 문자열 미노출: %s", sample).doesNotContain(sample);
        }
    }

    @Test
    @DisplayName("등록 데이터가 없으면 빈 대응팀·절차 + 「유출 대응 체계를 등록해 주세요」")
    @SuppressWarnings("unchecked")
    void breachResponse_noData_returnsEmptyStateMessage() {
        TenantContextHolder.setTenantId(TENANT_A);
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(TENANT_A)).thenReturn(Optional.empty());

        Map<String, Object> breach = complianceService.getPersonalDataBreachResponseStatus();

        assertThat(breach.get("status")).isEqualTo("success");
        assertThat(breach.get("registered")).isEqualTo(false);
        assertThat(breach.get("emptyMessage")).isEqualTo("유출 대응 체계를 등록해 주세요");
        assertThat(breach.get("emptyMessage"))
                .isEqualTo(ComplianceServiceErrorMessages.MSG_BREACH_RESPONSE_NOT_REGISTERED);
        assertThat((Map<String, Object>) breach.get("responseProcedures")).isEmpty();
        assertThat(breach.get("lastUpdated")).isNull();
        Map<String, Object> team = (Map<String, Object>) breach.get("responseTeam");
        assertThat(team.get("teamLeader")).isNull();
        assertThat((List<Object>) team.get("members")).isEmpty();
        assertNoSampleStrings(breach.toString());
    }

    @Test
    @DisplayName("테넌트 컨텍스트가 없어도 표본 없이 빈 상태 (예외·폴백 없음)")
    void breachResponse_noTenantContext_stillEmptyWithoutSample() {
        Map<String, Object> breach = complianceService.getPersonalDataBreachResponseStatus();

        assertThat(breach.get("emptyMessage"))
                .isEqualTo(ComplianceServiceErrorMessages.MSG_BREACH_RESPONSE_NOT_REGISTERED);
        assertNoSampleStrings(breach.toString());
        verify(tenantRepository, never()).findByTenantIdAndIsDeletedFalse(anyString());
    }

    @Test
    @DisplayName("다른 테넌트 — 각자 자기 연락처만, 표본·상대 테넌트 값은 0건")
    void breachResponse_otherTenants_isolatedAndSampleFree() {
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(TENANT_A))
                .thenReturn(Optional.of(tenant(TENANT_A, "02-1000-0001", "a@tenant-a.example.com")));
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(TENANT_B))
                .thenReturn(Optional.of(tenant(TENANT_B, "02-2000-0002", "b@tenant-b.example.com")));

        TenantContextHolder.setTenantId(TENANT_A);
        String renderedA = complianceService.getPersonalDataBreachResponseStatus().toString();
        TenantContextHolder.setTenantId(TENANT_B);
        String renderedB = complianceService.getPersonalDataBreachResponseStatus().toString();

        assertThat(renderedA).contains("02-1000-0001").doesNotContain("02-2000-0002", "b@tenant-b.example.com");
        assertThat(renderedB).contains("02-2000-0002").doesNotContain("02-1000-0001", "a@tenant-a.example.com");
        assertThat(renderedA).contains(ComplianceServiceErrorMessages.MSG_BREACH_RESPONSE_NOT_REGISTERED);
        assertThat(renderedB).contains(ComplianceServiceErrorMessages.MSG_BREACH_RESPONSE_NOT_REGISTERED);
        assertNoSampleStrings(renderedA);
        assertNoSampleStrings(renderedB);
    }

    @Test
    @DisplayName("모든 컴플라이언스 조회 엔드포인트 응답에 표본 문자열 0건")
    void allComplianceGetEndpoints_haveNoSampleStrings() {
        TenantContextHolder.setTenantId(TENANT_B);
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(anyString()))
                .thenReturn(Optional.of(tenant(TENANT_B, "02-2000-0002", "b@tenant-b.example.com")));

        Map<String, Map<String, Object>> responses = new LinkedHashMap<>();
        responses.put("personal-data-processing",
                complianceController.getPersonalDataProcessingStatus(null, null));
        responses.put("impact-assessment", complianceController.getPersonalDataImpactAssessment());
        responses.put("breach-response", complianceController.getPersonalDataBreachResponseStatus());
        responses.put("education", complianceController.getPersonalDataProtectionEducationStatus());
        responses.put("policy", complianceController.getPersonalDataProcessingPolicyStatus());
        responses.put("overall", complianceController.getComplianceOverallStatus());
        responses.put("dashboard", complianceController.getComplianceDashboard());

        responses.forEach((endpoint, body) -> {
            assertThat(body).as("%s 응답", endpoint).isNotNull();
            for (String sample : REMOVED_SAMPLE_STRINGS) {
                assertThat(body.toString()).as("%s 응답 표본 미노출: %s", endpoint, sample).doesNotContain(sample);
            }
        });
    }
}
