package com.coresolution.consultation.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.compliance.ComplianceServiceErrorMessages;
import com.coresolution.core.domain.Tenant;
import com.coresolution.consultation.repository.PersonalDataAccessLogRepository;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.core.context.TenantContextHolder;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/**
 * 컴플라이언스 응답의 테넌트 격리 검증 — 마인드가든 연락처 하드코딩 제거(P1 보안, 2026-10-03).
 *
 * <p>제거된 상수 문자열이 비(非)마인드가든 테넌트 응답에 단 한 번도 등장하지 않음을 확인하고,
 * 실측 점검 데이터가 없을 때 처리방침 준수 현황이 전 항목 「미점검」인지 확인한다.
 *
 * @author MindGarden
 * @since 2026-10-03
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("컴플라이언스 — 테넌트 연락처 격리 · 미점검 상태")
class ComplianceTenantContactIsolationTest {

    private static final String TENANT_B = "tenant-b";

    /**
     * 코드에서 제거한 마인드가든 고정 연락처 — 어떤 테넌트 응답에도 나타나선 안 된다.
     *
     * <p>출처: {@code ComplianceDashboardSampleContent.breachResponseTeam} 과
     * {@code PersonalDataRequestServiceImpl} 의 삭제된 리터럴.
     */
    private static final List<String> REMOVED_MINDGARDEN_CONTACTS = List.of(
            "032-724-8501",
            "privacy@mindgarden.co.kr",
            "privacy@mindgarden.com",
            "인천광역시 연수구 해돋이로120번길 23 2층 204호");

    @Mock
    private UserRepository userRepository;

    @Mock
    private PersonalDataAccessLogRepository personalDataAccessLogRepository;

    @Mock
    private TenantRepository tenantRepository;

    @InjectMocks
    private ComplianceService complianceService;

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private Tenant tenantB() {
        Tenant tenant = new Tenant();
        tenant.setTenantId(TENANT_B);
        tenant.setName("테넌트B센터");
        tenant.setContactEmail("privacy@tenant-b.example.com");
        tenant.setContactPhone("02-1111-2222");
        tenant.setAddress("서울특별시 강남구 테스트로 1");
        return tenant;
    }

    @Test
    @DisplayName("타 테넌트 유출사고 대응 연락처는 자기 테넌트 값만 쓰고 마인드가든 문자열은 0건")
    void breachResponse_usesTenantContactOnly() {
        TenantContextHolder.setTenantId(TENANT_B);
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(TENANT_B)).thenReturn(Optional.of(tenantB()));

        Map<String, Object> breach = complianceService.getPersonalDataBreachResponseStatus();

        assertThat(breach.toString()).contains("02-1111-2222", "privacy@tenant-b.example.com");
        for (String removed : REMOVED_MINDGARDEN_CONTACTS) {
            assertThat(breach.toString()).as("마인드가든 연락처 미노출: %s", removed).doesNotContain(removed);
        }
    }

    @Test
    @DisplayName("센터 프로필이 비어 있으면 공백 + 「센터 정보를 입력해 주세요」 안내 (마인드가든 폴백 없음)")
    void breachResponse_emptyProfile_showsNoticeNotMindgarden() {
        TenantContextHolder.setTenantId(TENANT_B);
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(TENANT_B)).thenReturn(Optional.empty());

        String rendered = complianceService.getPersonalDataBreachResponseStatus().toString();

        assertThat(rendered).contains(ComplianceServiceErrorMessages.MSG_CENTER_PROFILE_REQUIRED);
        for (String removed : REMOVED_MINDGARDEN_CONTACTS) {
            assertThat(rendered).as("마인드가든 연락처 미노출: %s", removed).doesNotContain(removed);
        }
    }

    @Test
    @DisplayName("실측 점검 데이터가 없으면 처리방침 준수 현황은 전 항목 「미점검」 (all-true 샘플 제거)")
    @SuppressWarnings("unchecked")
    void policyStatus_withoutRealData_isAllNotReviewed() {
        TenantContextHolder.setTenantId(TENANT_B);
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(anyString())).thenReturn(Optional.of(tenantB()));

        Map<String, Object> policy = complianceService.getPersonalDataProcessingPolicyStatus();
        Map<String, Object> complianceStatus = (Map<String, Object>) policy.get("complianceStatus");

        assertThat(complianceStatus).isNotEmpty();
        assertThat(complianceStatus.values())
                .as("all-true 샘플 제거 — 전 항목 미점검")
                .containsOnly(ComplianceServiceErrorMessages.STATUS_NOT_REVIEWED);
        assertThat(complianceStatus.values()).doesNotContain(true);
    }

    @Test
    @DisplayName("전체 컴플라이언스 현황에도 마인드가든 연락처가 0건")
    void overallStatus_hasNoMindgardenContact() {
        TenantContextHolder.setTenantId(TENANT_B);
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(anyString())).thenReturn(Optional.of(tenantB()));

        String rendered = complianceService.getComplianceOverallStatus().toString();

        for (String removed : REMOVED_MINDGARDEN_CONTACTS) {
            assertThat(rendered).as("마인드가든 연락처 미노출: %s", removed).doesNotContain(removed);
        }
    }
}
