package com.coresolution.consultation.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.constant.compliance.ComplianceServiceErrorMessages;
import com.coresolution.consultation.repository.PersonalDataAccessLogRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link ComplianceService} — 테넌트 실데이터·고정 표본값 제거 검증.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */
@ExtendWith(MockitoExtension.class)
class ComplianceServiceTest {

    private static final String TENANT_A = "tenant-compliance-a";
    private static final String TENANT_A_NAME = "테스트 센터 A";
    private static final String TENANT_A_EMAIL = "contact-a@example.test";
    private static final String TENANT_A_PHONE = "010-0000-0001";
    private static final String TENANT_A_ADDRESS = "테스트시 테스트로 1";
    private static final String TENANT_A_ADDRESS_DETAIL = "2층";

    @Mock
    private PersonalDataAccessLogRepository personalDataAccessLogRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TenantRepository tenantRepository;

    @InjectMocks
    private ComplianceService complianceService;

    private String previousTenantId;

    @BeforeEach
    void setUp() {
        previousTenantId = TenantContextHolder.peekTenantId();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.setTenantIdOrClear(previousTenantId);
    }

    private Tenant tenantA() {
        return Tenant.builder()
            .tenantId(TENANT_A)
            .name(TENANT_A_NAME)
            .contactEmail(TENANT_A_EMAIL)
            .contactPhone(TENANT_A_PHONE)
            .address(TENANT_A_ADDRESS)
            .addressDetail(TENANT_A_ADDRESS_DETAIL)
            .build();
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> basicInfoOf(Map<String, Object> policyStatus) {
        Map<String, Object> components = (Map<String, Object>) policyStatus.get("policyComponents");
        return (Map<String, Object>) components.get("basicInfo");
    }

    @Test
    @DisplayName("처리방침 기본정보는 현재 테넌트 이름·연락처를 쓰고 고정 회사명·이메일·날짜가 없다")
    void policyBasicInfo_usesTenantSettings() {
        TenantContextHolder.setTenantId(TENANT_A);
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(TENANT_A)).thenReturn(Optional.of(tenantA()));

        Map<String, Object> policy = complianceService.getPersonalDataProcessingPolicyStatus();
        Map<String, Object> basicInfo = basicInfoOf(policy);

        assertThat(basicInfo.get("companyName")).isEqualTo(TENANT_A_NAME);
        assertThat(basicInfo.get("contactEmail")).isEqualTo(TENANT_A_EMAIL);
        assertThat(basicInfo.get("contactPhone")).isEqualTo(TENANT_A_PHONE);
        assertThat(basicInfo.get("address")).isEqualTo(TENANT_A_ADDRESS + " " + TENANT_A_ADDRESS_DETAIL);
        assertThat(basicInfo.get("privacyOfficer")).isNull();
        assertThat(basicInfo.get("lastUpdated")).isNull();
        assertThat(basicInfo.values()).doesNotContain("마인드가든", "privacy@mindgarden.co.kr", "2024-12-19");
        assertThat(policy.get("nextReviewDate")).isNull();
    }

    @Test
    @DisplayName("테넌트 레코드가 없으면 회사명·연락처는 null(화면 '—')")
    void policyBasicInfo_noTenantRow_returnsNulls() {
        TenantContextHolder.setTenantId(TENANT_A);
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(TENANT_A)).thenReturn(Optional.empty());

        Map<String, Object> basicInfo = basicInfoOf(complianceService.getPersonalDataProcessingPolicyStatus());

        assertThat(basicInfo.get("companyName")).isNull();
        assertThat(basicInfo.get("contactEmail")).isNull();
        assertThat(basicInfo.get("contactPhone")).isNull();
        assertThat(basicInfo.get("address")).isNull();
    }

    @Test
    @DisplayName("테넌트 컨텍스트가 없으면 테넌트 조회 자체를 하지 않는다")
    void policyBasicInfo_noTenantContext_doesNotQuery() {
        TenantContextHolder.clear();

        Map<String, Object> basicInfo = basicInfoOf(complianceService.getPersonalDataProcessingPolicyStatus());

        assertThat(basicInfo.get("companyName")).isNull();
        verifyNoInteractions(tenantRepository);
    }

    @Test
    @SuppressWarnings("unchecked")
    @DisplayName("교육 대상 인원은 현재 테넌트 임직원(ADMIN·CONSULTANT·STAFF) 수, 이수율·이수 인원은 null")
    void educationStatus_countsTenantStaffAndNoFakeRate() {
        TenantContextHolder.setTenantId(TENANT_A);
        ArgumentCaptor<Collection<UserRole>> roles = ArgumentCaptor.forClass(Collection.class);
        when(userRepository.countByTenantIdAndRolesInAndIsActiveTrueAndIsDeletedFalse(eq(TENANT_A), roles.capture()))
            .thenReturn(7L);

        Map<String, Object> education = complianceService.getPersonalDataProtectionEducationStatus();
        Map<String, Object> completion = (Map<String, Object>) education.get("completionStatus");

        assertThat(completion.get("totalEmployees")).isEqualTo(7L);
        assertThat(completion.get("completionRate")).isNull();
        assertThat(completion.get("basicEducationCompleted")).isNull();
        assertThat(completion.get("medicalDataEducationCompleted")).isNull();
        assertThat(completion.get("technicalEducationCompleted")).isNull();
        assertThat(education.get("nextEducationDate")).isNull();
        assertThat(roles.getValue()).containsExactlyInAnyOrder(UserRole.ADMIN, UserRole.CONSULTANT, UserRole.STAFF);
    }

    @Test
    @SuppressWarnings("unchecked")
    @DisplayName("테넌트 컨텍스트가 없으면 교육 대상 인원은 null이고 사용자 조회를 하지 않는다")
    void educationStatus_noTenantContext_returnsNull() {
        TenantContextHolder.clear();

        Map<String, Object> education = complianceService.getPersonalDataProtectionEducationStatus();
        Map<String, Object> completion = (Map<String, Object>) education.get("completionStatus");

        assertThat(completion.get("totalEmployees")).isNull();
        verifyNoInteractions(userRepository);
    }

    @Test
    @DisplayName("개인정보 처리 현황은 tenantId 조건 쿼리만 사용한다")
    void processingStatus_usesTenantScopedQueries() {
        TenantContextHolder.setTenantId(TENANT_A);
        LocalDateTime start = LocalDateTime.of(2026, 9, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(2026, 9, 30, 23, 59);
        when(personalDataAccessLogRepository.countByTenantIdAndAccessTimeBetween(TENANT_A, start, end))
            .thenReturn(3L);
        when(personalDataAccessLogRepository.countByTenantIdAndDataTypeAndAccessTimeBetween(TENANT_A, start, end))
            .thenReturn(Map.of("PHONE", 3L));

        Map<String, Object> result = complianceService.getPersonalDataProcessingStatus(start, end);

        assertThat(result.get("totalCount")).isEqualTo(3L);
        assertThat(result.get("dataTypeStats")).isEqualTo(Map.of("PHONE", 3L));
        assertThat(result).doesNotContainKey("error").containsKey("period");
        verify(personalDataAccessLogRepository, never()).countByAccessTimeBetween(any(), any());
        verify(personalDataAccessLogRepository, never()).countByDataTypeAndAccessTimeBetween(any(), any());
        verify(personalDataAccessLogRepository, never()).countByAccessTypeAndAccessTimeBetween(any(), any());
        verify(personalDataAccessLogRepository, never()).countByAccessorIdAndAccessTimeBetween(any(), any());
    }

    @Test
    @DisplayName("그룹 집계가 실패해도 전체 건수는 유지하고 집계는 빈 맵")
    void processingStatus_groupQueryFailure_keepsTotal() {
        TenantContextHolder.setTenantId(TENANT_A);
        LocalDateTime start = LocalDateTime.of(2026, 9, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(2026, 9, 30, 23, 59);
        when(personalDataAccessLogRepository.countByTenantIdAndAccessTimeBetween(TENANT_A, start, end))
            .thenReturn(5L);
        when(personalDataAccessLogRepository.countByTenantIdAndAccessTypeAndAccessTimeBetween(TENANT_A, start, end))
            .thenThrow(new IllegalStateException("multi-row"));

        Map<String, Object> result = complianceService.getPersonalDataProcessingStatus(start, end);

        assertThat(result.get("totalCount")).isEqualTo(5L);
        assertThat((Map<?, ?>) result.get("accessTypeStats")).isEmpty();
        assertThat(result).doesNotContainKey("error");
    }

    @Test
    @DisplayName("테넌트 컨텍스트가 없으면 처리 현황은 오류 메시지만 반환하고 로그 조회를 하지 않는다")
    void processingStatus_noTenantContext_returnsError() {
        TenantContextHolder.clear();

        Map<String, Object> result = complianceService.getPersonalDataProcessingStatus(
            LocalDateTime.of(2026, 9, 1, 0, 0), LocalDateTime.of(2026, 9, 30, 0, 0));

        assertThat(result.get("error")).isEqualTo(ComplianceServiceErrorMessages.MSG_TENANT_CONTEXT_MISSING);
        assertThat(result).doesNotContainKey("totalCount");
        verifyNoInteractions(personalDataAccessLogRepository);
    }

    @Test
    @DisplayName("종합 현황에 고정 점수(100)·등급이 없다")
    void overallStatus_hasNoFakeScore() {
        TenantContextHolder.setTenantId(TENANT_A);
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(anyString())).thenReturn(Optional.of(tenantA()));

        Map<String, Object> overall = complianceService.getComplianceOverallStatus();

        assertThat(overall).containsKey("overallScore");
        assertThat(overall.get("overallScore")).isNull();
        assertThat(overall.get("complianceLevel")).isNull();
        assertThat(overall.get("lastUpdated")).isInstanceOf(LocalDateTime.class);
        assertThat(overall.get("status")).isEqualTo("success");
    }
}
