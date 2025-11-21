package com.coresolution.core.service;

import com.coresolution.core.domain.onboarding.OnboardingRequest;
import com.coresolution.core.domain.onboarding.OnboardingStatus;
import com.coresolution.core.domain.onboarding.RiskLevel;
import com.coresolution.core.repository.onboarding.OnboardingRequestRepository;
import com.coresolution.core.service.impl.OnboardingServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * OnboardingService 단위 테스트
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("OnboardingService 단위 테스트")
class OnboardingServiceTest {
    
    @Mock
    private OnboardingRequestRepository repository;
    
    @Mock
    private com.coresolution.core.service.OnboardingApprovalService approvalService;
    
    @InjectMocks
    private OnboardingServiceImpl onboardingService;
    
    private OnboardingRequest testRequest;
    private String testTenantId;
    private String testTenantName;
    private String testBusinessType;
    
    @BeforeEach
    void setUp() {
        testTenantId = "test-tenant-123";
        testTenantName = "테스트 테넌트";
        testBusinessType = "ACADEMY";
        
        testRequest = OnboardingRequest.builder()
            .id(1L)
            .tenantId(testTenantId)
            .tenantName(testTenantName)
            .requestedBy("test-requester")
            .riskLevel(RiskLevel.LOW)
            .checklistJson("{\"checklist\": []}")
            .businessType(testBusinessType)
            .status(OnboardingStatus.PENDING)
            .build();
    }
    
    @Test
    @DisplayName("대기 중인 온보딩 요청 목록 조회 - 성공")
    void testFindPending_Success() {
        // Given
        List<OnboardingRequest> pendingRequests = Arrays.asList(testRequest);
        when(repository.findByStatusOrderByCreatedAtDesc(OnboardingStatus.PENDING))
            .thenReturn(pendingRequests);
        
        // When
        List<OnboardingRequest> result = onboardingService.findPending();
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStatus()).isEqualTo(OnboardingStatus.PENDING);
    }
    
    @Test
    @DisplayName("온보딩 요청 ID로 조회 - 성공")
    void testGetById_Success() {
        // Given
        when(repository.findById(1L)).thenReturn(Optional.of(testRequest));
        
        // When
        OnboardingRequest result = onboardingService.getById(1L);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getTenantId()).isEqualTo(testTenantId);
    }
    
    @Test
    @DisplayName("온보딩 요청 ID로 조회 - 없음")
    void testGetById_NotFound() {
        // Given
        when(repository.findById(999L)).thenReturn(Optional.empty());
        
        // When & Then
        assertThatThrownBy(() -> onboardingService.getById(999L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("온보딩 요청을 찾을 수 없습니다");
    }
    
    @Test
    @DisplayName("온보딩 요청 생성 - 성공")
    void testCreate_Success() {
        // Given
        when(repository.save(any(OnboardingRequest.class))).thenReturn(testRequest);
        
        // When
        OnboardingRequest result = onboardingService.create(
            testTenantId,
            testTenantName,
            "test-requester",
            RiskLevel.LOW,
            "{\"checklist\": []}",
            testBusinessType
        );
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.getTenantId()).isEqualTo(testTenantId);
        assertThat(result.getTenantName()).isEqualTo(testTenantName);
        assertThat(result.getStatus()).isEqualTo(OnboardingStatus.PENDING);
        verify(repository, times(1)).save(any(OnboardingRequest.class));
    }
    
    @Test
    @DisplayName("온보딩 요청 결정 - 승인")
    void testDecide_Approved() {
        // Given
        when(repository.findById(1L)).thenReturn(Optional.of(testRequest));
        when(repository.save(any(OnboardingRequest.class))).thenAnswer(invocation -> {
            OnboardingRequest request = invocation.getArgument(0);
            return request;
        });
        
        // OnboardingApprovalService Mock 설정 (성공 시나리오)
        java.util.Map<String, Object> approvalResult = new java.util.HashMap<>();
        approvalResult.put("success", true);
        approvalResult.put("message", "온보딩 승인 완료");
        when(approvalService.processOnboardingApproval(
            anyLong(), anyString(), anyString(), anyString(), anyString(), anyString()
        )).thenReturn(approvalResult);
        
        // When
        OnboardingRequest result = onboardingService.decide(
            1L,
            OnboardingStatus.APPROVED,
            "test-admin",
            "테스트 승인"
        );
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(OnboardingStatus.APPROVED);
        assertThat(result.getDecidedBy()).isEqualTo("test-admin");
        assertThat(result.getDecisionNote()).isEqualTo("테스트 승인");
        verify(repository, atLeastOnce()).save(any(OnboardingRequest.class));
        verify(approvalService, times(1)).processOnboardingApproval(
            anyLong(), anyString(), anyString(), anyString(), anyString(), anyString()
        );
    }
    
    @Test
    @DisplayName("온보딩 요청 결정 - 거부")
    void testDecide_Rejected() {
        // Given
        when(repository.findById(1L)).thenReturn(Optional.of(testRequest));
        when(repository.save(any(OnboardingRequest.class))).thenReturn(testRequest);
        
        // When
        OnboardingRequest result = onboardingService.decide(
            1L,
            OnboardingStatus.REJECTED,
            "test-admin",
            "테스트 거부"
        );
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(OnboardingStatus.REJECTED);
        assertThat(result.getDecidedBy()).isEqualTo("test-admin");
        assertThat(result.getDecisionNote()).isEqualTo("테스트 거부");
        verify(repository, times(1)).save(any(OnboardingRequest.class));
    }
    
    @Test
    @DisplayName("상태별 온보딩 요청 개수 조회 - 성공")
    void testCountByStatus_Success() {
        // Given
        when(repository.countByStatus(OnboardingStatus.PENDING)).thenReturn(5L);
        
        // When
        long count = onboardingService.countByStatus(OnboardingStatus.PENDING);
        
        // Then
        assertThat(count).isEqualTo(5L);
    }
}

