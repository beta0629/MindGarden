package com.coresolution.core.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import com.coresolution.core.domain.TenantPgConfiguration;
import com.coresolution.core.domain.TenantPgConfigurationHistory;
import com.coresolution.core.domain.enums.ApprovalStatus;
import com.coresolution.core.domain.enums.PgConfigurationStatus;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.dto.ConnectionTestResponse;
import com.coresolution.core.dto.PgConfigurationApproveRequest;
import com.coresolution.core.dto.PgConfigurationRejectRequest;
import com.coresolution.core.dto.TenantPgConfigurationDetailResponse;
import com.coresolution.core.dto.TenantPgConfigurationRequest;
import com.coresolution.core.dto.TenantPgConfigurationResponse;
import com.coresolution.core.repository.TenantPgConfigurationHistoryRepository;
import com.coresolution.core.repository.TenantPgConfigurationRepository;
import com.coresolution.core.repository.TenantRepository; // 추가
import com.coresolution.core.service.PgConnectionTestService;
import com.coresolution.core.service.TenantPgConfigurationHistoryService;
import com.coresolution.consultation.dto.EmailRequest;
import com.coresolution.consultation.dto.EmailResponse;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.consultation.service.PersonalDataEncryptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.access.AccessDeniedException;

/**
 * TenantPgConfigurationService 단위 테스트
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("TenantPgConfigurationService 테스트")
class TenantPgConfigurationServiceImplTest {
    
    @Mock
    private TenantPgConfigurationRepository configurationRepository;
    
    @Mock
    private TenantPgConfigurationHistoryRepository historyRepository;
    
    @Mock
    private PersonalDataEncryptionService encryptionService;
    
    @Mock
    private List<PgConnectionTestService> connectionTestServices;
    
    @Mock
    private com.coresolution.core.security.TenantAccessControlService accessControlService; // 추가
    
    @Mock
    private TenantPgConfigurationHistoryService historyService; // 추가

    @Mock
    private TenantRepository tenantRepository; // 추가
    
    @Mock
    private EmailService emailService; // 추가

    @InjectMocks
    private TenantPgConfigurationServiceImpl service;
    
    private String testTenantId;
    private String testConfigId;
    private TenantPgConfiguration testConfiguration;
    
    @BeforeEach
    void setUp() {
        testTenantId = "test-tenant-id";
        testConfigId = UUID.randomUUID().toString();
        
        testConfiguration = TenantPgConfiguration.builder()
                .configId(testConfigId)
                .tenantId(testTenantId)
                .pgProvider(PgProvider.TOSS)
                .pgName("토스페이먼츠")
                .apiKeyEncrypted("encrypted-api-key")
                .secretKeyEncrypted("encrypted-secret-key")
                .status(PgConfigurationStatus.PENDING)
                .approvalStatus(ApprovalStatus.PENDING)
                .requestedBy("test-user")
                .requestedAt(LocalDateTime.now())
                .testMode(false)
                .build();
        
        // Create a mock Tenant with a contactEmail and tenantId
        com.coresolution.core.domain.Tenant mockTenant = mock(com.coresolution.core.domain.Tenant.class);
        when(mockTenant.getContactEmail()).thenReturn("test@example.com");
        when(mockTenant.getTenantId()).thenReturn(testTenantId); // Ensure tenantId is set for consistency

        // 모든 테스트에서 사용될 TenantRepository 모의 설정
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(any(String.class)))
                .thenReturn(Optional.of(mockTenant));

        // EmailService.sendEmail 은 EmailResponse 반환 (void 아님)
        when(emailService.sendEmail(any(EmailRequest.class)))
                .thenReturn(EmailResponse.builder().success(true).status("SENT").emailId("mock-email-id").build());

        // BaseEntity의 id는 JPA가 자동 생성하므로 테스트에서는 반영하지 않음
    }
    
    @Test
    @DisplayName("PG 설정 목록 조회 - 성공")
    void testGetConfigurations_Success() {
        // Given
        List<TenantPgConfiguration> configurations = new ArrayList<>();
        configurations.add(testConfiguration);
        
        when(configurationRepository.findByTenantIdAndIsDeletedFalse(testTenantId))
                .thenReturn(configurations);
        
        // When
        List<TenantPgConfigurationResponse> result = service.getConfigurations(
                testTenantId, null, null);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getConfigId()).isEqualTo(testConfigId);
        assertThat(result.get(0).getTenantId()).isEqualTo(testTenantId);
        
        verify(configurationRepository).findByTenantIdAndIsDeletedFalse(testTenantId);
    }
    
    @Test
    @DisplayName("PG 설정 목록 조회 - 상태 필터링")
    void testGetConfigurations_WithStatusFilter() {
        // Given
        List<TenantPgConfiguration> configurations = new ArrayList<>();
        configurations.add(testConfiguration);
        
        when(configurationRepository.findByTenantIdAndStatusAndIsDeletedFalse(
                testTenantId, PgConfigurationStatus.PENDING))
                .thenReturn(configurations);
        
        // When
        List<TenantPgConfigurationResponse> result = service.getConfigurations(
                testTenantId, PgConfigurationStatus.PENDING, null);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        
        verify(configurationRepository).findByTenantIdAndStatusAndIsDeletedFalse(
                testTenantId, PgConfigurationStatus.PENDING);
    }
    
    @Test
    @DisplayName("PG 설정 상세 조회 - 성공")
    void testGetConfigurationDetail_Success() {
        // Given
        when(configurationRepository.findByConfigIdAndIsDeletedFalse(testConfigId))
                .thenReturn(Optional.of(testConfiguration));
        
        when(historyRepository.findByConfigIdOrderByChangedAtDesc(testConfigId))
                .thenReturn(new ArrayList<>());
        
        // When
        TenantPgConfigurationDetailResponse result = service.getConfigurationDetail(
                testTenantId, testConfigId);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.getConfigId()).isEqualTo(testConfigId);
        assertThat(result.getTenantId()).isEqualTo(testTenantId);
        assertThat(result.getHistory()).isNotNull();
        
        verify(configurationRepository).findByConfigIdAndIsDeletedFalse(testConfigId);
        verify(historyRepository).findByConfigIdOrderByChangedAtDesc(testConfigId);
    }
    
    @Test
    @DisplayName("PG 설정 상세 조회 - 존재하지 않는 설정")
    void testGetConfigurationDetail_NotFound() {
        // Given
        when(configurationRepository.findByConfigIdAndIsDeletedFalse(testConfigId))
                .thenReturn(Optional.empty());
        
        // When & Then
        assertThatThrownBy(() -> service.getConfigurationDetail(testTenantId, testConfigId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("PG 설정을 찾을 수 없습니다");
        
        verify(configurationRepository).findByConfigIdAndIsDeletedFalse(testConfigId);
    }
    
    @Test
    @DisplayName("PG 설정 상세 조회 - 다른 테넌트의 설정")
    void testGetConfigurationDetail_WrongTenant() {
        // Given
        String otherTenantId = "other-tenant-id";
        when(configurationRepository.findByConfigIdAndIsDeletedFalse(testConfigId))
                .thenReturn(Optional.of(testConfiguration));
        doThrow(new AccessDeniedException("해당 테넌트의 PG 설정이 아닙니다"))
                .when(accessControlService)
                .validateConfigurationAccess(testConfiguration, otherTenantId);
        
        // When & Then
        assertThatThrownBy(() -> service.getConfigurationDetail(otherTenantId, testConfigId))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("해당 테넌트의 PG 설정이 아닙니다");
    }
    
    @Test
    @DisplayName("PG 설정 생성 - 성공")
    void testCreateConfiguration_Success() {
        // Given
        TenantPgConfigurationRequest request = TenantPgConfigurationRequest.builder()
                .pgProvider(PgProvider.TOSS)
                .pgName("토스페이먼츠")
                .apiKey("test-api-key")
                .secretKey("test-secret-key")
                .testMode(false)
                .build();
        
        when(encryptionService.encrypt(any(String.class))).thenAnswer(invocation -> "encrypted-" + invocation.getArgument(0)); // 수정
        when(encryptionService.isEncrypted(any(String.class))).thenReturn(true); // 추가
        when(encryptionService.ensureActiveKey(any(String.class))).thenAnswer(invocation -> invocation.getArgument(0)); // 추가
        when(configurationRepository.existsByTenantIdAndPgProviderAndStatusAndIsDeletedFalse(
                testTenantId, PgProvider.TOSS, PgConfigurationStatus.ACTIVE))
                .thenReturn(false);
        when(configurationRepository.save(any(TenantPgConfiguration.class)))
                .thenReturn(testConfiguration);
        doNothing().when(historyService).saveHistory(any(), any(), any(), any(), any(), any()); // 추가
        
        // When
        TenantPgConfigurationResponse result = service.createConfiguration(
                testTenantId, request, "test-user");
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.getPgProvider()).isEqualTo(PgProvider.TOSS);
        
        verify(encryptionService).encrypt("test-api-key");
        verify(encryptionService).encrypt("test-secret-key");
        verify(configurationRepository).save(any(TenantPgConfiguration.class));
        verify(historyService).saveHistory(
                eq(testConfigId),
                eq(TenantPgConfigurationHistory.ChangeType.CREATED),
                isNull(),
                eq(PgConfigurationStatus.PENDING.name()),
                eq("test-user"),
                eq("PG 설정 생성"));
    }
    
    @Test
    @DisplayName("PG 설정 생성 - 중복 활성 설정 존재")
    void testCreateConfiguration_DuplicateActive() {
        // Given
        TenantPgConfigurationRequest request = TenantPgConfigurationRequest.builder()
                .pgProvider(PgProvider.TOSS)
                .apiKey("test-api-key")
                .secretKey("test-secret-key")
                .build();
        
        when(configurationRepository.existsByTenantIdAndPgProviderAndStatusAndIsDeletedFalse(
                testTenantId, PgProvider.TOSS, PgConfigurationStatus.ACTIVE))
                .thenReturn(true);
        
        // When & Then
        assertThatThrownBy(() -> service.createConfiguration(testTenantId, request, "test-user"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("이미 활성화된 PG 설정이 존재합니다");
        
        verify(configurationRepository, never()).save(any(TenantPgConfiguration.class));
    }
    
    @Test
    @DisplayName("PG 설정 생성 - 필수 필드 누락")
    void testCreateConfiguration_MissingRequiredFields() {
        // Given
        TenantPgConfigurationRequest request = TenantPgConfigurationRequest.builder()
                .pgProvider(PgProvider.TOSS)
                .apiKey(null) // 필수 필드 누락
                .secretKey("test-secret-key")
                .build();
        
        // When & Then
        assertThatThrownBy(() -> service.createConfiguration(testTenantId, request, "test-user"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("API Key는 필수입니다");
    }
    
    @Test
    @DisplayName("PG 설정 삭제 - 성공")
    void testDeleteConfiguration_Success() {
        // Given
        when(configurationRepository.findByConfigIdAndIsDeletedFalse(testConfigId))
                .thenReturn(Optional.of(testConfiguration));
        when(configurationRepository.save(any(TenantPgConfiguration.class)))
                .thenReturn(testConfiguration);
        
        // When
        service.deleteConfiguration(testTenantId, testConfigId);
        
        // Then
        verify(configurationRepository).findByConfigIdAndIsDeletedFalse(testConfigId);
        verify(configurationRepository).save(any(TenantPgConfiguration.class));
    }
    
    @Test
    @DisplayName("승인 대기 목록 조회 - 성공")
    void testGetPendingApprovals_Success() {
        // Given
        List<TenantPgConfiguration> configurations = new ArrayList<>();
        configurations.add(testConfiguration);
        
        when(configurationRepository.findPendingApprovals(ApprovalStatus.PENDING))
                .thenReturn(configurations);
        
        // When
        List<TenantPgConfigurationResponse> result = service.getPendingApprovals(null, null);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        
        verify(configurationRepository).findPendingApprovals(ApprovalStatus.PENDING);
    }
    
    @Test
    @DisplayName("PG 설정 승인 - 성공")
    void testApproveConfiguration_Success() {
        // Given
        PgConfigurationApproveRequest request = PgConfigurationApproveRequest.builder()
                .approvedBy("admin-user")
                .approvalNote("승인 완료")
                .testConnection(false)
                .build();
        
        when(configurationRepository.findByConfigIdAndIsDeletedFalse(testConfigId))
                .thenReturn(Optional.of(testConfiguration));
        when(configurationRepository.save(any(TenantPgConfiguration.class)))
                .thenReturn(testConfiguration);
        // when(tenantRepository.findByTenantIdAndIsDeletedFalse(any(String.class)))
        //         .thenReturn(Optional.of(mock(com.coresolution.core.domain.Tenant.class))); // setUp에서 이미 설정됨
        
        // When
        TenantPgConfigurationResponse result = service.approveConfiguration(testConfigId, request);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.getApprovalStatus()).isEqualTo(ApprovalStatus.APPROVED);
        
        verify(configurationRepository).findByConfigIdAndIsDeletedFalse(testConfigId);
        verify(configurationRepository).save(any(TenantPgConfiguration.class));
        verify(historyService).saveHistory(
                eq(testConfigId),
                eq(TenantPgConfigurationHistory.ChangeType.APPROVED),
                eq(PgConfigurationStatus.PENDING.name()),
                eq(PgConfigurationStatus.APPROVED.name()),
                eq("admin-user"),
                eq("승인 완료"));
    }
    
    @Test
    @DisplayName("PG 설정 거부 - 성공")
    void testRejectConfiguration_Success() {
        // Given
        PgConfigurationRejectRequest request = PgConfigurationRejectRequest.builder()
                .rejectedBy("admin-user")
                .rejectionReason("테스트용 키 검증 실패 사유는 10자 이상") 
                .build();
        
        when(configurationRepository.findByConfigIdAndIsDeletedFalse(testConfigId))
                .thenReturn(Optional.of(testConfiguration));
        when(configurationRepository.save(any(TenantPgConfiguration.class)))
                .thenReturn(testConfiguration);
        doNothing().when(historyService).saveHistory(any(), any(), any(), any(), any(), any()); // 추가
        
        // When
        TenantPgConfigurationResponse result = service.rejectConfiguration(testConfigId, request);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.getApprovalStatus()).isEqualTo(ApprovalStatus.REJECTED);
        assertThat(result.getRejectionReason()).isEqualTo("테스트용 키 검증 실패 사유는 10자 이상");
        
        verify(configurationRepository).findByConfigIdAndIsDeletedFalse(testConfigId);
        verify(configurationRepository).save(any(TenantPgConfiguration.class));
        verify(historyService).saveHistory(
                eq(testConfigId),
                eq(TenantPgConfigurationHistory.ChangeType.REJECTED),
                eq(PgConfigurationStatus.PENDING.name()),
                eq(PgConfigurationStatus.REJECTED.name()),
                eq("admin-user"),
                eq("테스트용 키 검증 실패 사유는 10자 이상"));
    }
    
    @Test
    @DisplayName("PG 연결 테스트 - 성공")
    void testTestConnection_Success() {
        // Given
        PgConnectionTestService testService = mock(PgConnectionTestService.class);
        ConnectionTestResponse testResponse = ConnectionTestResponse.builder()
                .success(true)
                .result("SUCCESS")
                .message("연결 성공")
                .testedAt(LocalDateTime.now())
                .build();
        
        when(configurationRepository.findByConfigIdAndIsDeletedFalse(testConfigId))
                .thenReturn(Optional.of(testConfiguration));
        when(encryptionService.decrypt(any(String.class))).thenReturn("decrypted-api", "decrypted-secret");
        when(connectionTestServices.stream()).thenReturn(java.util.stream.Stream.of(testService));
        when(testService.supports(PgProvider.TOSS)).thenReturn(true);
        when(testService.testConnection(testConfiguration)).thenReturn(testResponse);
        when(configurationRepository.save(any(TenantPgConfiguration.class)))
                .thenReturn(testConfiguration);
        doNothing().when(accessControlService).validateConfigurationAccess(any(TenantPgConfiguration.class), any(String.class)); 
        doNothing().when(historyService).saveHistory(any(), any(), any(), any(), any(), any()); // 추가
        
        // When
        ConnectionTestResponse result = service.testConnection(testTenantId, testConfigId);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.getSuccess()).isTrue();
        assertThat(result.getResult()).isEqualTo("SUCCESS");
        
        verify(testService).testConnection(testConfiguration);
        verify(configurationRepository).save(any(TenantPgConfiguration.class));
    }
}

