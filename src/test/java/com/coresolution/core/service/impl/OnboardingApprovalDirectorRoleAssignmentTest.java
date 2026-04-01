package com.coresolution.core.service.impl;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import com.coresolution.core.constant.OnboardingConstants;
import com.coresolution.core.domain.RoleTemplate;
import com.coresolution.core.repository.onboarding.OnboardingRequestRepository;
import com.coresolution.core.service.TenantDashboardService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.PlatformTransactionManager;

import jakarta.persistence.EntityManager;

/**
 * 온보딩 승인 시 관리자 → 원장(DIRECTOR) {@code user_role_assignments} 보강 단위 테스트
 *
 * @author CoreSolution
 * @since 2026-04-01
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("OnboardingApprovalServiceImpl 원장 역할 할당")
class OnboardingApprovalDirectorRoleAssignmentTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private com.coresolution.core.repository.RoleTemplateRepository roleTemplateRepository;

    @Mock
    private EntityManager entityManager;

    @Mock
    private OnboardingRequestRepository onboardingRequestRepository;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private ApplicationContext applicationContext;

    @Mock
    private PlatformTransactionManager transactionManager;

    @Mock
    private TenantDashboardService tenantDashboardService;

    @InjectMocks
    private OnboardingApprovalServiceImpl approvalService;

    @Test
    @DisplayName("원장 tenant_role이 있고 할당이 없으면 user_role_assignments INSERT")
    void ensureAdminDirectorRoleAssignment_insertsWhenMissing() {
        RoleTemplate directorTemplate = RoleTemplate.builder()
                .roleTemplateId("rt-director-1")
                .templateCode("CONSULTATION_DIRECTOR")
                .name("원장")
                .build();
        when(roleTemplateRepository.findByTemplateCodeAndIsDeletedFalse("CONSULTATION_DIRECTOR"))
                .thenReturn(Optional.of(directorTemplate));
        when(jdbcTemplate.queryForObject(contains("SELECT id FROM users"), eq(Long.class), any(), any()))
                .thenReturn(42L);
        when(jdbcTemplate.queryForObject(contains("FROM tenant_roles"), eq(String.class), any(), eq("rt-director-1")))
                .thenReturn("tenant-role-uuid-1");
        when(jdbcTemplate.queryForObject(contains("FROM user_role_assignments"), eq(Integer.class), any(), any(),
                any())).thenReturn(0);
        when(jdbcTemplate.update(anyString(), any(), any(), any(), any(), any())).thenReturn(1);

        ReflectionTestUtils.invokeMethod(approvalService, "ensureAdminDirectorRoleAssignment", "tenant-a",
                "CONSULTATION", "Admin@Example.com", "approver-1");

        verify(jdbcTemplate).update(contains("INSERT INTO user_role_assignments"), eq(42L), eq("tenant-a"),
                eq("tenant-role-uuid-1"), eq("approver-1"),
                eq(OnboardingConstants.ASSIGNMENT_REASON_ONBOARDING_AUTO));
    }
}
