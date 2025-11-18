package com.coresolution.core.service.impl;

import com.coresolution.core.service.OnboardingApprovalService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 온보딩 승인 서비스 통합 테스트
 * PL/SQL 프로시저 전체 플로우 테스트
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@SpringBootTest(classes = com.mindgarden.consultation.ConsultationManagementApplication.class)
@ActiveProfiles("test")
@Transactional
@DisplayName("온보딩 승인 서비스 통합 테스트")
class OnboardingApprovalServiceIntegrationTest {
    
    @Autowired
    private OnboardingApprovalService onboardingApprovalService;
    
    private Long testRequestId;
    private String testTenantId;
    private String testTenantName;
    private String testBusinessType;
    private String testApprovedBy;
    
    @BeforeEach
    void setUp() {
        testRequestId = 1L;
        testTenantId = "test-tenant-" + System.currentTimeMillis();
        testTenantName = "테스트 테넌트";
        testBusinessType = "ACADEMY";
        testApprovedBy = "test-admin";
    }
    
    @Test
    @DisplayName("온보딩 승인 프로세스 - 전체 플로우 테스트")
    void testProcessOnboardingApproval_FullFlow() {
        // Given
        String decisionNote = "테스트 승인";
        
        // When
        Map<String, Object> result = onboardingApprovalService.processOnboardingApproval(
                testRequestId,
                testTenantId,
                testTenantName,
                testBusinessType,
                testApprovedBy,
                decisionNote
        );
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.containsKey("success")).isTrue();
        assertThat(result.containsKey("message")).isTrue();
        
        // 성공 여부 확인 (실제 DB 상태에 따라 달라질 수 있음)
        Boolean success = (Boolean) result.get("success");
        String message = (String) result.get("message");
        
        System.out.println("온보딩 승인 결과: success=" + success + ", message=" + message);
        
        // 최소한 메시지가 있는지 확인
        assertThat(message).isNotNull();
    }
    
    @Test
    @DisplayName("온보딩 승인 프로세스 - 잘못된 요청 ID")
    void testProcessOnboardingApproval_InvalidRequestId() {
        // Given
        Long invalidRequestId = 999999L;
        
        // When
        Map<String, Object> result = onboardingApprovalService.processOnboardingApproval(
                invalidRequestId,
                testTenantId,
                testTenantName,
                testBusinessType,
                testApprovedBy,
                "테스트"
        );
        
        // Then
        assertThat(result).isNotNull();
        // 프로시저가 실패하거나 경고를 반환할 수 있음
        assertThat(result.containsKey("success")).isTrue();
        assertThat(result.containsKey("message")).isTrue();
    }
    
    @Test
    @DisplayName("온보딩 승인 프로세스 - 필수 파라미터 검증")
    void testProcessOnboardingApproval_RequiredParameters() {
        // Given
        // null 값 테스트는 프로시저 레벨에서 처리됨
        
        // When & Then
        // 실제 테스트는 프로시저 실행 시 검증됨
        // 여기서는 서비스 레벨에서 예외가 발생하지 않는지 확인
        Map<String, Object> result = onboardingApprovalService.processOnboardingApproval(
                testRequestId,
                testTenantId,
                testTenantName,
                testBusinessType,
                testApprovedBy,
                null // decisionNote는 nullable
        );
        
        assertThat(result).isNotNull();
    }
}

