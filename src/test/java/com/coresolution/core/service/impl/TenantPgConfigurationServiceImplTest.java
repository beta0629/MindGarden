package com.coresolution.core.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;
import com.coresolution.core.constants.TenantPgSettingsJsonKeys;
import com.coresolution.core.constants.TenantPgWebhookSecretMessages;
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
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
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

    /**
     * 테스트가 실행될 때 만든 {@code whsec_} + 표준 Base64.
     * 소스에 고엔트로피 리터럴을 두지 않는다.
     */
    private static final String VALID_WEBHOOK_SECRET;

    static {
        byte[] material = new byte[16];
        new Random(71L).nextBytes(material);
        VALID_WEBHOOK_SECRET = "whsec_" + Base64.getEncoder().encodeToString(material);
    }
    
    @Mock
    private TenantPgConfigurationRepository configurationRepository;
    
    @Mock
    private TenantPgConfigurationHistoryRepository historyRepository;
    
    @Mock
    private PersonalDataEncryptionService encryptionService;
    
    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();
    
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
    @DisplayName("운영 포털 목록 — tenantId 있으면 getConfigurations 경로")
    void listConfigurationsForOps_withTenantId() {
        when(configurationRepository.findByTenantIdAndIsDeletedFalse(testTenantId))
                .thenReturn(List.of(testConfiguration));

        List<TenantPgConfigurationResponse> result =
                service.listConfigurationsForOps(testTenantId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getConfigId()).isEqualTo(testConfigId);
        verify(configurationRepository).findByTenantIdAndIsDeletedFalse(testTenantId);
        verify(configurationRepository, never()).findByIsDeletedFalse();
    }

    @Test
    @DisplayName("운영 포털 목록 — tenantId 없으면 전체 비삭제")
    void listConfigurationsForOps_allNonDeleted() {
        testConfiguration.setStatus(PgConfigurationStatus.ACTIVE);
        testConfiguration.setApprovalStatus(ApprovalStatus.APPROVED);
        when(configurationRepository.findByIsDeletedFalse())
                .thenReturn(List.of(testConfiguration));

        List<TenantPgConfigurationResponse> result =
                service.listConfigurationsForOps(null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStatus()).isEqualTo(PgConfigurationStatus.ACTIVE);
        verify(configurationRepository).findByIsDeletedFalse();
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

    @Test
    @DisplayName("테스트 모드 PATCH — ON 성공, 승인 상태 유지")
    void patchTestMode_turnOn_keepsApprovalStatus() {
        testConfiguration.setTestMode(false);
        testConfiguration.setApprovalStatus(ApprovalStatus.PENDING);
        testConfiguration.setStatus(PgConfigurationStatus.PENDING);

        when(configurationRepository.findByConfigIdAndIsDeletedFalse(testConfigId))
                .thenReturn(Optional.of(testConfiguration));
        when(configurationRepository.save(any(TenantPgConfiguration.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(accessControlService)
                .validateConfigurationAccess(any(TenantPgConfiguration.class), eq(testTenantId));
        doNothing().when(historyService).saveHistory(any(), any(), any(), any(), any(), any());

        TenantPgConfigurationResponse result = service.patchTestMode(testTenantId, testConfigId, true);

        assertThat(result.getTestMode()).isTrue();
        assertThat(result.getApprovalStatus()).isEqualTo(ApprovalStatus.PENDING);
        assertThat(result.getStatus()).isEqualTo(PgConfigurationStatus.PENDING);
        verify(configurationRepository).save(any(TenantPgConfiguration.class));
    }

    @Test
    @DisplayName("테스트 모드 PATCH — IAMPORT OFF 시 라이브 channelKey 없으면 fail-closed")
    void patchTestMode_iamportOffWithoutLiveKey_throws() {
        testConfiguration.setPgProvider(PgProvider.IAMPORT);
        testConfiguration.setTestMode(true);
        testConfiguration.setSettingsJson("{\"portoneChannelKeyTest\":\"channel-key-test-xxxxx\"}");

        when(configurationRepository.findByConfigIdAndIsDeletedFalse(testConfigId))
                .thenReturn(Optional.of(testConfiguration));
        doNothing().when(accessControlService)
                .validateConfigurationAccess(any(TenantPgConfiguration.class), eq(testTenantId));

        assertThatThrownBy(() -> service.patchTestMode(testTenantId, testConfigId, false))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("라이브");

        verify(configurationRepository, never()).save(any(TenantPgConfiguration.class));
    }

    @Test
    @DisplayName("테스트 모드 PATCH — IAMPORT OFF 시 웹훅 시크릿 없으면 fail-closed")
    void patchTestMode_iamportOffWithoutWebhookSecret_throws() {
        testConfiguration.setPgProvider(PgProvider.IAMPORT);
        testConfiguration.setTestMode(true);
        testConfiguration.setSettingsJson(
                "{\"portoneChannelKey\":\"channel-key-live-xxxxx\",\"portoneChannelKeyTest\":\"channel-key-test-xxxxx\"}");

        when(configurationRepository.findByConfigIdAndIsDeletedFalse(testConfigId))
                .thenReturn(Optional.of(testConfiguration));
        doNothing().when(accessControlService)
                .validateConfigurationAccess(any(TenantPgConfiguration.class), eq(testTenantId));

        assertThatThrownBy(() -> service.patchTestMode(testTenantId, testConfigId, false))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("웹훅 시크릿");

        verify(configurationRepository, never()).save(any(TenantPgConfiguration.class));
    }

    @Test
    @DisplayName("테스트 모드 PATCH — IAMPORT OFF 시 라이브 키+웹훅 시크릿 있으면 성공")
    void patchTestMode_iamportOffWithLiveKeyAndWebhookSecret_succeeds() {
        testConfiguration.setPgProvider(PgProvider.IAMPORT);
        testConfiguration.setTestMode(true);
        testConfiguration.setSettingsJson(
                "{\"portoneChannelKey\":\"channel-key-live-xxxxx\","
                        + "\"portoneChannelKeyTest\":\"channel-key-test-xxxxx\","
                        + "\"portoneWebhookSecret\":\"ENC(whsec_configured)\"}");
        testConfiguration.setApprovalStatus(ApprovalStatus.PENDING);

        when(configurationRepository.findByConfigIdAndIsDeletedFalse(testConfigId))
                .thenReturn(Optional.of(testConfiguration));
        when(configurationRepository.save(any(TenantPgConfiguration.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(accessControlService)
                .validateConfigurationAccess(any(TenantPgConfiguration.class), eq(testTenantId));
        doNothing().when(historyService).saveHistory(any(), any(), any(), any(), any(), any());

        TenantPgConfigurationResponse result = service.patchTestMode(testTenantId, testConfigId, false);

        assertThat(result.getTestMode()).isFalse();
        assertThat(result.getApprovalStatus()).isEqualTo(ApprovalStatus.PENDING);
        verify(configurationRepository).save(any(TenantPgConfiguration.class));
    }

    @Test
    @DisplayName("테스트 모드 PATCH — true 롤백은 라이브 키/시크릿 검사 없이 허용")
    void patchTestMode_rollbackToTrue_okWithoutLiveChecks() {
        testConfiguration.setPgProvider(PgProvider.IAMPORT);
        testConfiguration.setTestMode(false);
        testConfiguration.setSettingsJson("{\"portoneChannelKeyTest\":\"channel-key-test-xxxxx\"}");
        testConfiguration.setStatus(PgConfigurationStatus.ACTIVE);
        testConfiguration.setApprovalStatus(ApprovalStatus.APPROVED);

        when(configurationRepository.findByConfigIdAndIsDeletedFalse(testConfigId))
                .thenReturn(Optional.of(testConfiguration));
        when(configurationRepository.save(any(TenantPgConfiguration.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(accessControlService)
                .validateConfigurationAccess(any(TenantPgConfiguration.class), eq(testTenantId));
        doNothing().when(historyService).saveHistory(any(), any(), any(), any(), any(), any());

        TenantPgConfigurationResponse result = service.patchTestMode(testTenantId, testConfigId, true);

        assertThat(result.getTestMode()).isTrue();
        assertThat(result.getStatus()).isEqualTo(PgConfigurationStatus.ACTIVE);
        assertThat(result.getApprovalStatus()).isEqualTo(ApprovalStatus.APPROVED);
    }

    @Test
    @DisplayName("ADMIN PUT ACTIVE — live 필드 유지, pending 스테이징, approvalStatus APPROVED 유지")
    void updateConfiguration_activeStagesPending_keepsLiveAndApproved() throws Exception {
        testConfiguration.setStatus(PgConfigurationStatus.ACTIVE);
        testConfiguration.setApprovalStatus(ApprovalStatus.APPROVED);
        testConfiguration.setPgProvider(PgProvider.IAMPORT);
        testConfiguration.setStoreId("live-store");
        testConfiguration.setApiKeyEncrypted("encrypted-live-api");
        testConfiguration.setSecretKeyEncrypted("encrypted-live-secret");
        testConfiguration.setTestMode(true);
        testConfiguration.setSettingsJson(
                "{\"portoneChannelKeyTest\":\"channel-key-test-xxxxx\",\"portoneWebhookSecret\":\"ENC(whsec)\"}");

        TenantPgConfigurationRequest request = TenantPgConfigurationRequest.builder()
                .pgProvider(PgProvider.IAMPORT)
                .pgName("포트원")
                .apiKey("new-api-key")
                .secretKey("new-secret-key")
                .storeId("pending-store")
                .testMode(false)
                .settingsJson("{\"portoneChannelKeyTest\":\"channel-key-test-yyyyy\"}")
                .build();

        when(configurationRepository.findByConfigIdAndIsDeletedFalse(testConfigId))
                .thenReturn(Optional.of(testConfiguration));
        when(encryptionService.encrypt(any(String.class)))
                .thenAnswer(invocation -> "encrypted-" + invocation.getArgument(0));
        when(encryptionService.isEncrypted(any(String.class))).thenReturn(true);
        when(encryptionService.ensureActiveKey(any(String.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(configurationRepository.save(any(TenantPgConfiguration.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(accessControlService)
                .validateConfigurationAccess(any(TenantPgConfiguration.class), eq(testTenantId));
        doNothing().when(historyService).saveHistory(any(), any(), any(), any(), any(), any());

        TenantPgConfigurationResponse result =
                service.updateConfiguration(testTenantId, testConfigId, request);

        assertThat(result.getStatus()).isEqualTo(PgConfigurationStatus.ACTIVE);
        assertThat(result.getApprovalStatus()).isEqualTo(ApprovalStatus.APPROVED);
        assertThat(result.getHasPendingEdit()).isTrue();
        assertThat(result.getStoreId()).isEqualTo("live-store");
        assertThat(result.getTestMode()).isTrue();

        ArgumentCaptor<TenantPgConfiguration> savedCaptor =
                ArgumentCaptor.forClass(TenantPgConfiguration.class);
        verify(configurationRepository).save(savedCaptor.capture());
        TenantPgConfiguration saved = savedCaptor.getValue();
        assertThat(saved.getApiKeyEncrypted()).isEqualTo("encrypted-live-api");
        assertThat(saved.getSecretKeyEncrypted()).isEqualTo("encrypted-live-secret");
        assertThat(saved.getStoreId()).isEqualTo("live-store");
        assertThat(saved.getTestMode()).isTrue();
        assertThat(saved.getPendingRequestJson()).isNotBlank();
        assertThat(saved.getPendingRequestJson()).doesNotContain("testMode");
        JsonNode pending = objectMapper.readTree(saved.getPendingRequestJson());
        assertThat(pending.get("storeId").asText()).isEqualTo("pending-store");
        assertThat(pending.get("apiKeyEncrypted").asText()).isEqualTo("encrypted-new-api-key");
        assertThat(pending.has("testMode")).isFalse();

        ArgumentCaptor<String> notesCaptor = ArgumentCaptor.forClass(String.class);
        verify(historyService).saveHistory(
                eq(testConfigId),
                eq(TenantPgConfigurationHistory.ChangeType.UPDATED),
                eq("ACTIVE"),
                eq("ACTIVE"),
                any(),
                notesCaptor.capture());
        assertThat(notesCaptor.getValue()).contains("스테이징");
        assertThat(notesCaptor.getValue()).contains("ACTIVE live 유지");
    }

    /**
     * pending 승인 시 강제 연결 시험 stub (성공).
     */
    private PgConnectionTestService stubSuccessfulConnectionTest() {
        PgConnectionTestService testService = mock(PgConnectionTestService.class);
        when(encryptionService.decrypt(any(String.class))).thenReturn("decrypted-api", "decrypted-secret");
        when(connectionTestServices.stream()).thenReturn(java.util.stream.Stream.of(testService));
        when(testService.supports(any(PgProvider.class))).thenReturn(true);
        when(testService.testConnection(any(TenantPgConfiguration.class)))
                .thenReturn(ConnectionTestResponse.builder()
                        .success(true)
                        .result("SUCCESS")
                        .message("연결 성공")
                        .testedAt(LocalDateTime.now())
                        .build());
        return testService;
    }

    @Test
    @DisplayName("승인 — ACTIVE+pending 적용 후 pending 클리어, ACTIVE+APPROVED")
    void approveConfiguration_activeWithPending_appliesAndClears() throws Exception {
        testConfiguration.setStatus(PgConfigurationStatus.ACTIVE);
        testConfiguration.setApprovalStatus(ApprovalStatus.APPROVED);
        testConfiguration.setStoreId("live-store");
        testConfiguration.setApiKeyEncrypted("encrypted-live-api");
        testConfiguration.setSecretKeyEncrypted("encrypted-live-secret");
        testConfiguration.setTestMode(true);
        testConfiguration.setPendingRequestJson(
                "{\"pgProvider\":\"TOSS\",\"pgName\":\"토스\","
                        + "\"apiKeyEncrypted\":\"encrypted-pending-api\","
                        + "\"secretKeyEncrypted\":\"encrypted-pending-secret\","
                        + "\"storeId\":\"pending-store\",\"settingsJson\":null,\"notes\":null}");
        testConfiguration.setPendingRequestedBy("admin-user");
        testConfiguration.setPendingRequestedAt(LocalDateTime.now());

        PgConfigurationApproveRequest request = PgConfigurationApproveRequest.builder()
                .approvedBy("ops-user")
                .approvalNote("재승인")
                .testConnection(false)
                .build();

        when(configurationRepository.findByConfigIdAndIsDeletedFalse(testConfigId))
                .thenReturn(Optional.of(testConfiguration));
        when(configurationRepository.save(any(TenantPgConfiguration.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(historyService).saveHistory(any(), any(), any(), any(), any(), any());
        stubSuccessfulConnectionTest();

        TenantPgConfigurationResponse result = service.approveConfiguration(testConfigId, request);

        assertThat(result.getStatus()).isEqualTo(PgConfigurationStatus.ACTIVE);
        assertThat(result.getApprovalStatus()).isEqualTo(ApprovalStatus.APPROVED);
        assertThat(result.getHasPendingEdit()).isFalse();
        assertThat(result.getStoreId()).isEqualTo("pending-store");
        assertThat(result.getTestMode()).isTrue();

        ArgumentCaptor<TenantPgConfiguration> savedCaptor =
                ArgumentCaptor.forClass(TenantPgConfiguration.class);
        // 연결시험 중 save 가 선행될 수 있으므로 최종 승인 save 를 검증한다.
        verify(configurationRepository, atLeastOnce()).save(savedCaptor.capture());
        TenantPgConfiguration finalSaved =
                savedCaptor.getAllValues().get(savedCaptor.getAllValues().size() - 1);
        assertThat(finalSaved.getApiKeyEncrypted()).isEqualTo("encrypted-pending-api");
        assertThat(finalSaved.getPendingRequestJson()).isNull();
        assertThat(finalSaved.getPendingRequestedBy()).isNull();
        assertThat(finalSaved.getPendingRequestedAt()).isNull();
        assertThat(finalSaved.getTestMode()).isTrue();

        verify(historyService).saveHistory(
                eq(testConfigId),
                eq(TenantPgConfigurationHistory.ChangeType.APPROVED),
                eq("ACTIVE"),
                eq("ACTIVE"),
                eq("ops-user"),
                org.mockito.ArgumentMatchers.contains("pending 적용"));
    }

    @Test
    @DisplayName("승인 — ACTIVE+pending 적용 시 live 웹훅 시크릿 유지, 다른 pending 필드는 적용")
    void approveConfiguration_activeWithPending_keepsLiveWebhookSecret() throws Exception {
        testConfiguration.setStatus(PgConfigurationStatus.ACTIVE);
        testConfiguration.setApprovalStatus(ApprovalStatus.APPROVED);
        testConfiguration.setStoreId("live-store");
        testConfiguration.setApiKeyEncrypted("encrypted-live-api");
        testConfiguration.setSecretKeyEncrypted("encrypted-live-secret");
        testConfiguration.setTestMode(true);
        testConfiguration.setSettingsJson(
                "{\"portoneChannelKeyTest\":\"channel-key-live\","
                        + "\"portoneWebhookSecret\":\"enc:live-webhook\"}");
        String pendingSettingsJson =
                "{\"portoneChannelKeyTest\":\"channel-key-pending\","
                        + "\"portoneWebhookSecret\":\"enc:pending-webhook\"}";
        testConfiguration.setPendingRequestJson(
                "{\"pgProvider\":\"TOSS\",\"pgName\":\"토스\","
                        + "\"apiKeyEncrypted\":\"encrypted-pending-api\","
                        + "\"secretKeyEncrypted\":\"encrypted-pending-secret\","
                        + "\"storeId\":\"pending-store\","
                        + "\"settingsJson\":"
                        + objectMapper.writeValueAsString(pendingSettingsJson)
                        + ",\"notes\":null}");
        testConfiguration.setPendingRequestedBy("admin-user");
        testConfiguration.setPendingRequestedAt(LocalDateTime.now());

        PgConfigurationApproveRequest request = PgConfigurationApproveRequest.builder()
                .approvedBy("ops-user")
                .approvalNote("재승인 — 웹훅 시크릿 live 유지")
                .testConnection(false)
                .build();

        when(configurationRepository.findByConfigIdAndIsDeletedFalse(testConfigId))
                .thenReturn(Optional.of(testConfiguration));
        when(configurationRepository.save(any(TenantPgConfiguration.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(historyService).saveHistory(any(), any(), any(), any(), any(), any());
        stubSuccessfulConnectionTest();

        TenantPgConfigurationResponse result = service.approveConfiguration(testConfigId, request);

        assertThat(result.getStatus()).isEqualTo(PgConfigurationStatus.ACTIVE);
        assertThat(result.getApprovalStatus()).isEqualTo(ApprovalStatus.APPROVED);
        assertThat(result.getHasPendingEdit()).isFalse();
        assertThat(result.getStoreId()).isEqualTo("pending-store");

        ArgumentCaptor<TenantPgConfiguration> savedCaptor =
                ArgumentCaptor.forClass(TenantPgConfiguration.class);
        verify(configurationRepository, atLeastOnce()).save(savedCaptor.capture());
        TenantPgConfiguration saved =
                savedCaptor.getAllValues().get(savedCaptor.getAllValues().size() - 1);
        assertThat(saved.getPendingRequestJson()).isNull();
        assertThat(saved.getPendingRequestedBy()).isNull();
        assertThat(saved.getPendingRequestedAt()).isNull();
        assertThat(saved.getStoreId()).isEqualTo("pending-store");
        assertThat(saved.getStatus()).isEqualTo(PgConfigurationStatus.ACTIVE);
        assertThat(saved.getApprovalStatus()).isEqualTo(ApprovalStatus.APPROVED);

        JsonNode liveSettings = objectMapper.readTree(saved.getSettingsJson());
        assertThat(liveSettings.get(TenantPgSettingsJsonKeys.PORTONE_WEBHOOK_SECRET).asText())
                .isEqualTo("enc:live-webhook");
        assertThat(liveSettings.get("portoneChannelKeyTest").asText())
                .isEqualTo("channel-key-pending");
        assertThat(saved.getSettingsJson()).doesNotContain("enc:pending-webhook");
    }

    @Test
    @DisplayName("거부 — ACTIVE+pending 폐기, live 유지, ACTIVE+APPROVED")
    void rejectConfiguration_activeWithPending_discardsKeepsLiveApproved() {
        testConfiguration.setStatus(PgConfigurationStatus.ACTIVE);
        testConfiguration.setApprovalStatus(ApprovalStatus.APPROVED);
        testConfiguration.setStoreId("live-store");
        testConfiguration.setApiKeyEncrypted("encrypted-live-api");
        testConfiguration.setTestMode(true);
        testConfiguration.setPendingRequestJson(
                "{\"storeId\":\"pending-store\",\"apiKeyEncrypted\":\"encrypted-pending-api\","
                        + "\"secretKeyEncrypted\":\"encrypted-pending-secret\"}");
        testConfiguration.setPendingRequestedBy("admin-user");
        testConfiguration.setPendingRequestedAt(LocalDateTime.now());

        PgConfigurationRejectRequest request = PgConfigurationRejectRequest.builder()
                .rejectedBy("ops-user")
                .rejectionReason("재승인 거부 사유는 10자 이상")
                .build();

        when(configurationRepository.findByConfigIdAndIsDeletedFalse(testConfigId))
                .thenReturn(Optional.of(testConfiguration));
        when(configurationRepository.save(any(TenantPgConfiguration.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(historyService).saveHistory(any(), any(), any(), any(), any(), any());

        TenantPgConfigurationResponse result = service.rejectConfiguration(testConfigId, request);

        assertThat(result.getStatus()).isEqualTo(PgConfigurationStatus.ACTIVE);
        assertThat(result.getApprovalStatus()).isEqualTo(ApprovalStatus.APPROVED);
        assertThat(result.getHasPendingEdit()).isFalse();
        assertThat(result.getStoreId()).isEqualTo("live-store");
        assertThat(result.getTestMode()).isTrue();

        ArgumentCaptor<TenantPgConfiguration> savedCaptor =
                ArgumentCaptor.forClass(TenantPgConfiguration.class);
        verify(configurationRepository).save(savedCaptor.capture());
        assertThat(savedCaptor.getValue().getApiKeyEncrypted()).isEqualTo("encrypted-live-api");
        assertThat(savedCaptor.getValue().getPendingRequestJson()).isNull();

        verify(historyService).saveHistory(
                eq(testConfigId),
                eq(TenantPgConfigurationHistory.ChangeType.REJECTED),
                eq("ACTIVE"),
                eq("ACTIVE"),
                eq("ops-user"),
                org.mockito.ArgumentMatchers.contains("스테이징 수정 폐기"));
    }

    @Test
    @DisplayName("ADMIN PUT — testMode=null 이면 기존 testMode 유지 (비-ACTIVE)")
    void updateConfiguration_nullTestMode_keepsExisting_nonActive() {
        testConfiguration.setStatus(PgConfigurationStatus.PENDING);
        testConfiguration.setApprovalStatus(ApprovalStatus.PENDING);
        testConfiguration.setTestMode(true);

        TenantPgConfigurationRequest request = TenantPgConfigurationRequest.builder()
                .pgProvider(PgProvider.TOSS)
                .apiKey("api")
                .secretKey("secret")
                .testMode(null)
                .build();

        when(configurationRepository.findByConfigIdAndIsDeletedFalse(testConfigId))
                .thenReturn(Optional.of(testConfiguration));
        when(encryptionService.encrypt(any(String.class)))
                .thenAnswer(invocation -> "encrypted-" + invocation.getArgument(0));
        when(encryptionService.isEncrypted(any(String.class))).thenReturn(true);
        when(encryptionService.ensureActiveKey(any(String.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(configurationRepository.save(any(TenantPgConfiguration.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(accessControlService)
                .validateConfigurationAccess(any(TenantPgConfiguration.class), eq(testTenantId));
        doNothing().when(historyService).saveHistory(any(), any(), any(), any(), any(), any());

        TenantPgConfigurationResponse result =
                service.updateConfiguration(testTenantId, testConfigId, request);

        assertThat(result.getTestMode()).isTrue();
        ArgumentCaptor<TenantPgConfiguration> savedCaptor =
                ArgumentCaptor.forClass(TenantPgConfiguration.class);
        verify(configurationRepository).save(savedCaptor.capture());
        assertThat(savedCaptor.getValue().getTestMode()).isTrue();
    }

    @Test
    @DisplayName("ADMIN PUT — testMode=false/true 여도 live testMode 변경 안 함 (ACTIVE)")
    void updateConfiguration_adminPutNeverChangesTestMode_active() {
        testConfiguration.setStatus(PgConfigurationStatus.ACTIVE);
        testConfiguration.setApprovalStatus(ApprovalStatus.APPROVED);
        testConfiguration.setTestMode(true);
        testConfiguration.setPgProvider(PgProvider.TOSS);
        testConfiguration.setSettingsJson(null);

        TenantPgConfigurationRequest request = TenantPgConfigurationRequest.builder()
                .pgProvider(PgProvider.TOSS)
                .apiKey("api")
                .secretKey("secret")
                .testMode(false)
                .build();

        when(configurationRepository.findByConfigIdAndIsDeletedFalse(testConfigId))
                .thenReturn(Optional.of(testConfiguration));
        when(encryptionService.encrypt(any(String.class)))
                .thenAnswer(invocation -> "encrypted-" + invocation.getArgument(0));
        when(encryptionService.isEncrypted(any(String.class))).thenReturn(true);
        when(encryptionService.ensureActiveKey(any(String.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(configurationRepository.save(any(TenantPgConfiguration.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(accessControlService)
                .validateConfigurationAccess(any(TenantPgConfiguration.class), eq(testTenantId));
        doNothing().when(historyService).saveHistory(any(), any(), any(), any(), any(), any());

        TenantPgConfigurationResponse result =
                service.updateConfiguration(testTenantId, testConfigId, request);

        assertThat(result.getTestMode()).isTrue();
        assertThat(result.getApprovalStatus()).isEqualTo(ApprovalStatus.APPROVED);
        assertThat(result.getHasPendingEdit()).isTrue();
        ArgumentCaptor<TenantPgConfiguration> savedCaptor =
                ArgumentCaptor.forClass(TenantPgConfiguration.class);
        verify(configurationRepository).save(savedCaptor.capture());
        assertThat(savedCaptor.getValue().getTestMode()).isTrue();
    }

    @Test
    @DisplayName("ADMIN PUT — testMode=true 여도 비-ACTIVE live testMode 변경 안 함")
    void updateConfiguration_adminPutNeverChangesTestMode_nonActive() {
        testConfiguration.setStatus(PgConfigurationStatus.PENDING);
        testConfiguration.setApprovalStatus(ApprovalStatus.PENDING);
        testConfiguration.setTestMode(false);

        TenantPgConfigurationRequest request = TenantPgConfigurationRequest.builder()
                .pgProvider(PgProvider.TOSS)
                .apiKey("api")
                .secretKey("secret")
                .testMode(true)
                .build();

        when(configurationRepository.findByConfigIdAndIsDeletedFalse(testConfigId))
                .thenReturn(Optional.of(testConfiguration));
        when(encryptionService.encrypt(any(String.class)))
                .thenAnswer(invocation -> "encrypted-" + invocation.getArgument(0));
        when(encryptionService.isEncrypted(any(String.class))).thenReturn(true);
        when(encryptionService.ensureActiveKey(any(String.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(configurationRepository.save(any(TenantPgConfiguration.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(accessControlService)
                .validateConfigurationAccess(any(TenantPgConfiguration.class), eq(testTenantId));
        doNothing().when(historyService).saveHistory(any(), any(), any(), any(), any(), any());

        TenantPgConfigurationResponse result =
                service.updateConfiguration(testTenantId, testConfigId, request);

        assertThat(result.getTestMode()).isFalse();
        ArgumentCaptor<TenantPgConfiguration> savedCaptor =
                ArgumentCaptor.forClass(TenantPgConfiguration.class);
        verify(configurationRepository).save(savedCaptor.capture());
        assertThat(savedCaptor.getValue().getTestMode()).isFalse();
    }

    @Test
    @DisplayName("ADMIN PUT — apiKey/secretKey null/blank 이면 기존 암호문 유지(빈 문자열 미암호화)")
    void updateConfiguration_blankSecrets_keepsExistingEncrypted() {
        testConfiguration.setStatus(PgConfigurationStatus.PENDING);
        testConfiguration.setApprovalStatus(ApprovalStatus.PENDING);
        testConfiguration.setApiKeyEncrypted("encrypted-api-key");
        testConfiguration.setSecretKeyEncrypted("encrypted-secret-key");

        TenantPgConfigurationRequest request = TenantPgConfigurationRequest.builder()
                .pgProvider(PgProvider.TOSS)
                .pgName("토스 수정")
                .apiKey(null)
                .secretKey("  ")
                .testMode(false)
                .build();

        when(configurationRepository.findByConfigIdAndIsDeletedFalse(testConfigId))
                .thenReturn(Optional.of(testConfiguration));
        when(configurationRepository.save(any(TenantPgConfiguration.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(accessControlService)
                .validateConfigurationAccess(any(TenantPgConfiguration.class), eq(testTenantId));
        doNothing().when(historyService).saveHistory(any(), any(), any(), any(), any(), any());

        TenantPgConfigurationResponse result =
                service.updateConfiguration(testTenantId, testConfigId, request);

        assertThat(result.getApiSecretConfigured()).isTrue();
        ArgumentCaptor<TenantPgConfiguration> savedCaptor =
                ArgumentCaptor.forClass(TenantPgConfiguration.class);
        verify(configurationRepository).save(savedCaptor.capture());
        assertThat(savedCaptor.getValue().getApiKeyEncrypted()).isEqualTo("encrypted-api-key");
        assertThat(savedCaptor.getValue().getSecretKeyEncrypted()).isEqualTo("encrypted-secret-key");
        verify(encryptionService, never()).encrypt(any());
    }

    @Test
    @DisplayName("ADMIN PUT — 시크릿 공란이어도 settingsJson 웹훅 시크릿 최초 저장 가능")
    void updateConfiguration_blankSecrets_canSetWebhookSecretInSettingsJson() throws Exception {
        testConfiguration.setStatus(PgConfigurationStatus.PENDING);
        testConfiguration.setApprovalStatus(ApprovalStatus.PENDING);
        testConfiguration.setPgProvider(PgProvider.IAMPORT);
        testConfiguration.setApiKeyEncrypted("encrypted-api-key");
        testConfiguration.setSecretKeyEncrypted("encrypted-secret-key");
        testConfiguration.setSettingsJson("{\"portoneChannelKey\":\"live-ck\"}");
        testConfiguration.setTestMode(true);

        String webhookPlain = VALID_WEBHOOK_SECRET;
        String incomingSettings = "{\"portoneChannelKey\":\"live-ck\","
                + "\"portoneWebhookSecret\":\"" + webhookPlain + "\"}";
        TenantPgConfigurationRequest request = TenantPgConfigurationRequest.builder()
                .pgProvider(PgProvider.IAMPORT)
                .storeId("store-1")
                .apiKey(null)
                .secretKey(null)
                .testMode(true)
                .settingsJson(incomingSettings)
                .build();

        when(configurationRepository.findByConfigIdAndIsDeletedFalse(testConfigId))
                .thenReturn(Optional.of(testConfiguration));
        when(encryptionService.isEncrypted(anyString())).thenReturn(false);
        when(encryptionService.encrypt(eq(webhookPlain))).thenReturn("ENC(webhook-first)");
        when(encryptionService.ensureActiveKey(eq("ENC(webhook-first)")))
                .thenReturn("ENC(webhook-first)");
        when(configurationRepository.save(any(TenantPgConfiguration.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(accessControlService)
                .validateConfigurationAccess(any(TenantPgConfiguration.class), eq(testTenantId));
        doNothing().when(historyService).saveHistory(any(), any(), any(), any(), any(), any());

        TenantPgConfigurationResponse result =
                service.updateConfiguration(testTenantId, testConfigId, request);

        ArgumentCaptor<TenantPgConfiguration> savedCaptor =
                ArgumentCaptor.forClass(TenantPgConfiguration.class);
        verify(configurationRepository).save(savedCaptor.capture());
        assertThat(savedCaptor.getValue().getApiKeyEncrypted()).isEqualTo("encrypted-api-key");
        assertThat(savedCaptor.getValue().getSecretKeyEncrypted()).isEqualTo("encrypted-secret-key");
        JsonNode savedJson = objectMapper.readTree(savedCaptor.getValue().getSettingsJson());
        assertThat(savedJson.get(TenantPgSettingsJsonKeys.PORTONE_WEBHOOK_SECRET).asText())
                .isEqualTo("ENC(webhook-first)");
        assertThat(result.getPortoneWebhookSecretConfigured()).isTrue();
        assertThat(result.getApiSecretConfigured()).isTrue();
        assertThat(result.getSettingsJson()).doesNotContain(webhookPlain);
        verify(encryptionService).encrypt(webhookPlain);
    }

    @Test
    @DisplayName("PG 설정 생성 - secretKey blank 거부")
    void testCreateConfiguration_BlankSecretKeyRejected() {
        TenantPgConfigurationRequest request = TenantPgConfigurationRequest.builder()
                .pgProvider(PgProvider.TOSS)
                .apiKey("test-api-key")
                .secretKey("   ")
                .build();

        assertThatThrownBy(() -> service.createConfiguration(testTenantId, request, "test-user"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Secret Key는 필수입니다");

        verify(configurationRepository, never()).save(any(TenantPgConfiguration.class));
        verify(encryptionService, never()).encrypt(any());
    }

    @Test
    @DisplayName("getActiveByProvider — ACTIVE+APPROVED+pending 스테이징 시에도 반환")
    void getActiveConfigurationByProvider_returnsWhenApprovedEvenWithPending() {
        testConfiguration.setStatus(PgConfigurationStatus.ACTIVE);
        testConfiguration.setApprovalStatus(ApprovalStatus.APPROVED);
        testConfiguration.setPendingRequestJson("{\"storeId\":\"pending\"}");
        testConfiguration.setPendingRequestedAt(LocalDateTime.now());

        when(configurationRepository.findByTenantIdAndPgProviderAndStatusAndIsDeletedFalse(
                testTenantId, PgProvider.TOSS, PgConfigurationStatus.ACTIVE))
                .thenReturn(Optional.of(testConfiguration));
        when(historyRepository.findByConfigIdOrderByChangedAtDesc(testConfigId))
                .thenReturn(new ArrayList<>());
        doNothing().when(accessControlService)
                .validateConfigurationAccess(any(TenantPgConfiguration.class), eq(testTenantId));

        TenantPgConfigurationDetailResponse result =
                service.getActiveConfigurationByProvider(testTenantId, PgProvider.TOSS);

        assertThat(result).isNotNull();
        assertThat(result.getConfigId()).isEqualTo(testConfigId);
        assertThat(result.getHasPendingEdit()).isTrue();
        assertThat(result.getApprovalStatus()).isEqualTo(ApprovalStatus.APPROVED);
    }

    @Test
    @DisplayName("getActiveByProvider — ACTIVE+REJECTED 는 fail-closed null")
    void getActiveConfigurationByProvider_rejectedReturnsNull() {
        testConfiguration.setStatus(PgConfigurationStatus.ACTIVE);
        testConfiguration.setApprovalStatus(ApprovalStatus.REJECTED);

        when(configurationRepository.findByTenantIdAndPgProviderAndStatusAndIsDeletedFalse(
                testTenantId, PgProvider.TOSS, PgConfigurationStatus.ACTIVE))
                .thenReturn(Optional.of(testConfiguration));

        TenantPgConfigurationDetailResponse result =
                service.getActiveConfigurationByProvider(testTenantId, PgProvider.TOSS);

        assertThat(result).isNull();
        verify(accessControlService, never())
                .validateConfigurationAccess(any(TenantPgConfiguration.class), anyString());
    }

    @Test
    @DisplayName("웹훅 시크릿 PATCH — 다른 settings 키 보존, 승인/상태 유지, 암호화 저장")
    void patchWebhookSecret_preservesOtherKeys_keepsApproval_encrypts() throws Exception {
        testConfiguration.setPgProvider(PgProvider.IAMPORT);
        testConfiguration.setStatus(PgConfigurationStatus.ACTIVE);
        testConfiguration.setApprovalStatus(ApprovalStatus.APPROVED);
        testConfiguration.setSettingsJson(
                "{\"portoneChannelKey\":\"channel-key-live-xxxxx\",\"keepMe\":true}");

        when(configurationRepository.findByConfigIdAndIsDeletedFalse(testConfigId))
                .thenReturn(Optional.of(testConfiguration));
        when(configurationRepository.save(any(TenantPgConfiguration.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(accessControlService)
                .validateConfigurationAccess(any(TenantPgConfiguration.class), eq(testTenantId));
        doNothing().when(historyService).saveHistory(any(), any(), any(), any(), any(), any());

        when(encryptionService.isEncrypted(anyString())).thenReturn(false);
        when(encryptionService.encrypt(eq(VALID_WEBHOOK_SECRET)))
                .thenReturn("ENC(webhook)");
        when(encryptionService.ensureActiveKey(eq("ENC(webhook)")))
                .thenReturn("ENC(webhook)");

        TenantPgConfigurationResponse result =
                service.patchWebhookSecret(testTenantId, testConfigId, "  " + VALID_WEBHOOK_SECRET + "  ");

        assertThat(result.getStatus()).isEqualTo(PgConfigurationStatus.ACTIVE);
        assertThat(result.getApprovalStatus()).isEqualTo(ApprovalStatus.APPROVED);
        assertThat(result.getPortoneWebhookSecretConfigured()).isTrue();
        assertThat(result.getSettingsJson()).doesNotContain(TenantPgSettingsJsonKeys.PORTONE_WEBHOOK_SECRET);
        assertThat(result.getSettingsJson()).doesNotContain(VALID_WEBHOOK_SECRET);
        assertThat(result.getSettingsJson()).contains("channel-key-live-xxxxx");

        ArgumentCaptor<TenantPgConfiguration> savedCaptor =
                ArgumentCaptor.forClass(TenantPgConfiguration.class);
        verify(configurationRepository).save(savedCaptor.capture());
        JsonNode savedJson = objectMapper.readTree(savedCaptor.getValue().getSettingsJson());
        assertThat(savedJson.get(TenantPgSettingsJsonKeys.PORTONE_WEBHOOK_SECRET).asText())
                .isEqualTo("ENC(webhook)");
        assertThat(savedJson.get("portoneChannelKey").asText()).isEqualTo("channel-key-live-xxxxx");
        assertThat(savedJson.get("keepMe").asBoolean()).isTrue();
        assertThat(savedCaptor.getValue().getStatus()).isEqualTo(PgConfigurationStatus.ACTIVE);
        assertThat(savedCaptor.getValue().getApprovalStatus()).isEqualTo(ApprovalStatus.APPROVED);

        ArgumentCaptor<String> notesCaptor = ArgumentCaptor.forClass(String.class);
        verify(historyService).saveHistory(
                eq(testConfigId),
                eq(TenantPgConfigurationHistory.ChangeType.UPDATED),
                eq("ACTIVE"),
                eq("ACTIVE"),
                any(),
                notesCaptor.capture());
        assertThat(notesCaptor.getValue()).contains("웹훅 시크릿 갱신");
        assertThat(notesCaptor.getValue()).doesNotContain(VALID_WEBHOOK_SECRET);
    }

    @Test
    @DisplayName("웹훅 시크릿 PATCH — whsec_ 접두사 없으면 400 문구, 평문 미포함, 저장 없음")
    void patchWebhookSecret_missingPrefix_throwsWithoutEchoingSecret() {
        String raw = VALID_WEBHOOK_SECRET.substring("whsec_".length());
        assertRejectedWebhookSecret(raw);
    }

    @Test
    @DisplayName("웹훅 시크릿 PATCH — Base64 디코드 실패면 400 문구, 평문 미포함, 저장 없음")
    void patchWebhookSecret_invalidBase64_throwsWithoutEchoingSecret() {
        assertRejectedWebhookSecret("whsec_!!!!");
        assertRejectedWebhookSecret("whsec_unit_test_secret");
    }

    private void assertRejectedWebhookSecret(String raw) {
        assertThat(TenantPgWebhookSecretMessages.INVALID_FORMAT).doesNotContain(raw);
        assertThatThrownBy(() -> service.patchWebhookSecret(testTenantId, testConfigId, raw))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(TenantPgWebhookSecretMessages.INVALID_FORMAT)
                .hasNoCause()
                .satisfies(error -> assertThat(error.toString()).doesNotContain(raw));
        verify(configurationRepository, never()).save(any(TenantPgConfiguration.class));
        verify(configurationRepository, never()).findByConfigIdAndIsDeletedFalse(anyString());
    }

    @Test
    @DisplayName("웹훅 시크릿 PATCH — 공백 시 IllegalArgumentException")
    void patchWebhookSecret_blank_throws() {
        assertThatThrownBy(() -> service.patchWebhookSecret(testTenantId, testConfigId, "   "))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("webhookSecret");

        verify(configurationRepository, never()).save(any(TenantPgConfiguration.class));
    }

    @Test
    @DisplayName("승인 — pending 연결테스트 실패 시 예외, live/pending 미변경")
    void approveConfiguration_pendingConnectionTestFails_blocksAndKeepsState() {
        testConfiguration.setStatus(PgConfigurationStatus.ACTIVE);
        testConfiguration.setApprovalStatus(ApprovalStatus.APPROVED);
        testConfiguration.setStoreId("live-store");
        testConfiguration.setApiKeyEncrypted("encrypted-live-api");
        testConfiguration.setSecretKeyEncrypted("encrypted-live-secret");
        testConfiguration.setPendingRequestJson(
                "{\"pgProvider\":\"TOSS\",\"pgName\":\"토스\","
                        + "\"apiKeyEncrypted\":\"encrypted-pending-api\","
                        + "\"secretKeyEncrypted\":\"encrypted-pending-secret\","
                        + "\"storeId\":\"pending-store\",\"settingsJson\":null,\"notes\":null}");
        testConfiguration.setPendingRequestedBy("admin-user");
        testConfiguration.setPendingRequestedAt(LocalDateTime.now());

        PgConnectionTestService testService = mock(PgConnectionTestService.class);
        when(configurationRepository.findByConfigIdAndIsDeletedFalse(testConfigId))
                .thenReturn(Optional.of(testConfiguration));
        when(encryptionService.decrypt(any(String.class))).thenReturn("decrypted-api", "decrypted-secret");
        when(connectionTestServices.stream()).thenReturn(java.util.stream.Stream.of(testService));
        when(testService.supports(PgProvider.TOSS)).thenReturn(true);
        when(testService.testConnection(any(TenantPgConfiguration.class)))
                .thenReturn(ConnectionTestResponse.builder()
                        .success(false)
                        .result("FAILED")
                        .message("API Key 유효하지 않음")
                        .testedAt(LocalDateTime.now())
                        .build());
        when(configurationRepository.save(any(TenantPgConfiguration.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(historyService).saveHistory(any(), any(), any(), any(), any(), any());

        PgConfigurationApproveRequest request = PgConfigurationApproveRequest.builder()
                .approvedBy("ops-user")
                .approvalNote("재승인")
                .testConnection(true)
                .build();

        assertThatThrownBy(() -> service.approveConfiguration(testConfigId, request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("연결 테스트 실패")
                .hasMessageContaining("API Key 유효하지 않음");

        assertThat(testConfiguration.getStoreId()).isEqualTo("live-store");
        assertThat(testConfiguration.getApiKeyEncrypted()).isEqualTo("encrypted-live-api");
        assertThat(testConfiguration.getPendingRequestJson()).isNotBlank();
        assertThat(testConfiguration.getApprovalStatus()).isEqualTo(ApprovalStatus.APPROVED);
        assertThat(testConfiguration.getStatus()).isEqualTo(PgConfigurationStatus.ACTIVE);
        verify(historyService, never()).saveHistory(
                eq(testConfigId),
                eq(TenantPgConfigurationHistory.ChangeType.APPROVED),
                any(),
                any(),
                any(),
                any());
    }

    @Test
    @DisplayName("승인 — pending 연결테스트 성공 시 pending 적용")
    void approveConfiguration_pendingConnectionTestSucceeds_appliesPending() {
        testConfiguration.setStatus(PgConfigurationStatus.ACTIVE);
        testConfiguration.setApprovalStatus(ApprovalStatus.APPROVED);
        testConfiguration.setStoreId("live-store");
        testConfiguration.setApiKeyEncrypted("encrypted-live-api");
        testConfiguration.setSecretKeyEncrypted("encrypted-live-secret");
        testConfiguration.setPendingRequestJson(
                "{\"pgProvider\":\"TOSS\",\"pgName\":\"토스\","
                        + "\"apiKeyEncrypted\":\"encrypted-pending-api\","
                        + "\"secretKeyEncrypted\":\"encrypted-pending-secret\","
                        + "\"storeId\":\"pending-store\",\"settingsJson\":null,\"notes\":null}");
        testConfiguration.setPendingRequestedBy("admin-user");
        testConfiguration.setPendingRequestedAt(LocalDateTime.now());

        PgConnectionTestService testService = mock(PgConnectionTestService.class);
        when(configurationRepository.findByConfigIdAndIsDeletedFalse(testConfigId))
                .thenReturn(Optional.of(testConfiguration));
        when(encryptionService.decrypt(any(String.class))).thenReturn("decrypted-api", "decrypted-secret");
        when(connectionTestServices.stream()).thenReturn(java.util.stream.Stream.of(testService));
        when(testService.supports(PgProvider.TOSS)).thenReturn(true);
        when(testService.testConnection(any(TenantPgConfiguration.class)))
                .thenReturn(ConnectionTestResponse.builder()
                        .success(true)
                        .result("SUCCESS")
                        .message("연결 성공")
                        .testedAt(LocalDateTime.now())
                        .build());
        when(configurationRepository.save(any(TenantPgConfiguration.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(historyService).saveHistory(any(), any(), any(), any(), any(), any());

        PgConfigurationApproveRequest request = PgConfigurationApproveRequest.builder()
                .approvedBy("ops-user")
                .approvalNote("재승인")
                .testConnection(true)
                .build();

        TenantPgConfigurationResponse result = service.approveConfiguration(testConfigId, request);

        assertThat(result.getHasPendingEdit()).isFalse();
        assertThat(result.getStoreId()).isEqualTo("pending-store");
        assertThat(result.getPendingEditDiff()).isNull();
        assertThat(testConfiguration.getApiKeyEncrypted()).isEqualTo("encrypted-pending-api");
        assertThat(testConfiguration.getPendingRequestJson()).isNull();
    }

    @Test
    @DisplayName("toResponse — pendingEditDiff live+test 채널키 끝4, URL query 마스킹, 시크릿 미포함")
    void toResponse_pendingEditDiff_masksSecretsAndExposesChangeFlags() throws Exception {
        testConfiguration.setStatus(PgConfigurationStatus.ACTIVE);
        testConfiguration.setApprovalStatus(ApprovalStatus.APPROVED);
        testConfiguration.setTestMode(true);
        testConfiguration.setStoreId("live-store-abcdef");
        testConfiguration.setMerchantId("live-merchant-xyz");
        testConfiguration.setWebhookUrl("https://live.example.com/webhook/path?token=live-secret-tok");
        testConfiguration.setReturnUrl("https://live.example.com/return");
        testConfiguration.setCancelUrl("https://live.example.com/cancel#frag-live");
        testConfiguration.setApiKeyEncrypted("encrypted-live-api");
        testConfiguration.setSecretKeyEncrypted("encrypted-live-secret");
        testConfiguration.setSettingsJson(
                "{\"" + TenantPgSettingsJsonKeys.PORTONE_CHANNEL_KEY
                        + "\":\"channel-key-live-LIVE\","
                        + "\"" + TenantPgSettingsJsonKeys.PORTONE_CHANNEL_KEY_TEST
                        + "\":\"channel-key-test-ABCD\","
                        + "\"" + TenantPgSettingsJsonKeys.PORTONE_WEBHOOK_SECRET
                        + "\":\"enc:live-webhook-secret-PLAIN\"}");
        String pendingSettings =
                "{\"" + TenantPgSettingsJsonKeys.PORTONE_CHANNEL_KEY
                        + "\":\"channel-key-pend-LIVE\","
                        + "\"" + TenantPgSettingsJsonKeys.PORTONE_CHANNEL_KEY_TEST
                        + "\":\"channel-key-pend-WXYZ\","
                        + "\"" + TenantPgSettingsJsonKeys.PORTONE_WEBHOOK_SECRET
                        + "\":\"enc:pending-webhook-secret-PLAIN\"}";
        testConfiguration.setPendingRequestJson(
                "{\"pgProvider\":\"TOSS\",\"pgName\":\"토스\","
                        + "\"apiKeyEncrypted\":\"encrypted-pending-api\","
                        + "\"secretKeyEncrypted\":\"encrypted-live-secret\","
                        + "\"storeId\":\"pending-store-ghijkl\","
                        + "\"merchantId\":\"pending-merchant-uvw\","
                        + "\"webhookUrl\":\"https://pending.example.com/webhook?sig=pending-query\","
                        + "\"returnUrl\":\"https://pending.example.com/return\","
                        + "\"cancelUrl\":\"https://pending.example.com/cancel\","
                        + "\"settingsJson\":"
                        + objectMapper.writeValueAsString(pendingSettings)
                        + ",\"notes\":null}");
        testConfiguration.setPendingRequestedAt(LocalDateTime.now());

        when(configurationRepository.findByTenantIdAndIsDeletedFalse(testTenantId))
                .thenReturn(List.of(testConfiguration));

        List<TenantPgConfigurationResponse> result =
                service.getConfigurations(testTenantId, null, null);

        assertThat(result).hasSize(1);
        TenantPgConfigurationResponse response = result.get(0);
        assertThat(response.getHasPendingEdit()).isTrue();
        assertThat(response.getPendingEditDiff()).isNotNull();
        assertThat(response.getPendingEditDiff().getApiKeyChanged()).isTrue();
        assertThat(response.getPendingEditDiff().getSecretKeyChanged()).isFalse();

        assertThat(response.getSettingsJson()).doesNotContain("enc:live-webhook-secret-PLAIN");
        assertThat(response.getSettingsJson()).doesNotContain(TenantPgSettingsJsonKeys.PORTONE_WEBHOOK_SECRET);

        String diffJson = objectMapper.writeValueAsString(response.getPendingEditDiff());
        assertThat(diffJson).doesNotContain("channel-key-live-LIVE");
        assertThat(diffJson).doesNotContain("channel-key-test-ABCD");
        assertThat(diffJson).doesNotContain("channel-key-pend-LIVE");
        assertThat(diffJson).doesNotContain("channel-key-pend-WXYZ");
        assertThat(diffJson).doesNotContain("encrypted-pending-api");
        assertThat(diffJson).doesNotContain("encrypted-live-api");
        assertThat(diffJson).doesNotContain("enc:pending-webhook-secret-PLAIN");
        assertThat(diffJson).doesNotContain("enc:live-webhook-secret-PLAIN");
        assertThat(diffJson).doesNotContain("live-secret-tok");
        assertThat(diffJson).doesNotContain("pending-query");
        assertThat(diffJson).doesNotContain("frag-live");

        assertThat(response.getPendingEditDiff().getCurrent().getChannelKeyMasked())
                .endsWith("LIVE")
                .startsWith("*");
        assertThat(response.getPendingEditDiff().getCurrent().getChannelKeyTestMasked())
                .endsWith("ABCD")
                .startsWith("*");
        assertThat(response.getPendingEditDiff().getPending().getChannelKeyMasked())
                .endsWith("LIVE")
                .startsWith("*");
        assertThat(response.getPendingEditDiff().getPending().getChannelKeyTestMasked())
                .endsWith("WXYZ")
                .startsWith("*");
        assertThat(response.getPendingEditDiff().getCurrent().getWebhookUrl())
                .isEqualTo("https://live.example.com/webhook/path?****");
        assertThat(response.getPendingEditDiff().getPending().getWebhookUrl())
                .isEqualTo("https://pending.example.com/webhook?****");
        assertThat(response.getPendingEditDiff().getCurrent().getCancelUrl())
                .isEqualTo("https://live.example.com/cancel#****");
        assertThat(response.getPendingEditDiff().getPending().getStoreId())
                .endsWith("ijkl");
        assertThat(response.getPendingEditDiff().getPending().getStoreId())
                .doesNotContain("pending-store-ghijkl");
    }

    @Test
    @DisplayName("toResponse — pendingEditDiff testMode=false 여도 live+test 채널키 둘 다 채움")
    void toResponse_pendingEditDiff_bothChannelKeysIndependentOfTestMode() throws Exception {
        testConfiguration.setStatus(PgConfigurationStatus.ACTIVE);
        testConfiguration.setApprovalStatus(ApprovalStatus.APPROVED);
        testConfiguration.setTestMode(false);
        testConfiguration.setSettingsJson(
                "{\"" + TenantPgSettingsJsonKeys.PORTONE_CHANNEL_KEY
                        + "\":\"live-channel-key-AAAA\","
                        + "\"" + TenantPgSettingsJsonKeys.PORTONE_CHANNEL_KEY_TEST
                        + "\":\"test-channel-key-BBBB\"}");
        String pendingSettings =
                "{\"" + TenantPgSettingsJsonKeys.PORTONE_CHANNEL_KEY
                        + "\":\"live-channel-pend-CCCC\","
                        + "\"" + TenantPgSettingsJsonKeys.PORTONE_CHANNEL_KEY_TEST
                        + "\":\"test-channel-pend-DDDD\"}";
        testConfiguration.setPendingRequestJson(
                "{\"pgProvider\":\"TOSS\",\"pgName\":\"토스\","
                        + "\"apiKeyEncrypted\":\"encrypted-live-api\","
                        + "\"secretKeyEncrypted\":\"encrypted-live-secret\","
                        + "\"storeId\":\"live-store\","
                        + "\"settingsJson\":"
                        + objectMapper.writeValueAsString(pendingSettings)
                        + ",\"notes\":null}");
        testConfiguration.setPendingRequestedAt(LocalDateTime.now());

        when(configurationRepository.findByTenantIdAndIsDeletedFalse(testTenantId))
                .thenReturn(List.of(testConfiguration));

        TenantPgConfigurationResponse response =
                service.getConfigurations(testTenantId, null, null).get(0);

        assertThat(response.getPendingEditDiff().getCurrent().getChannelKeyMasked())
                .endsWith("AAAA");
        assertThat(response.getPendingEditDiff().getCurrent().getChannelKeyTestMasked())
                .endsWith("BBBB");
        assertThat(response.getPendingEditDiff().getPending().getChannelKeyMasked())
                .endsWith("CCCC");
        assertThat(response.getPendingEditDiff().getPending().getChannelKeyTestMasked())
                .endsWith("DDDD");
        String diffJson = objectMapper.writeValueAsString(response.getPendingEditDiff());
        assertThat(diffJson).doesNotContain("live-channel-key-AAAA");
        assertThat(diffJson).doesNotContain("test-channel-key-BBBB");
    }

    @Test
    @DisplayName("승인 — pending + testConnection=false 여도 연결시험 강제, 실패 시 차단")
    void approveConfiguration_pendingIgnoresTestConnectionFalse_blocksOnFailure() {
        testConfiguration.setStatus(PgConfigurationStatus.ACTIVE);
        testConfiguration.setApprovalStatus(ApprovalStatus.APPROVED);
        testConfiguration.setStoreId("live-store");
        testConfiguration.setApiKeyEncrypted("encrypted-live-api");
        testConfiguration.setSecretKeyEncrypted("encrypted-live-secret");
        testConfiguration.setPendingRequestJson(
                "{\"pgProvider\":\"TOSS\",\"pgName\":\"토스\","
                        + "\"apiKeyEncrypted\":\"encrypted-pending-api\","
                        + "\"secretKeyEncrypted\":\"encrypted-pending-secret\","
                        + "\"storeId\":\"pending-store\",\"settingsJson\":null,\"notes\":null}");
        testConfiguration.setPendingRequestedAt(LocalDateTime.now());

        PgConnectionTestService testService = mock(PgConnectionTestService.class);
        when(configurationRepository.findByConfigIdAndIsDeletedFalse(testConfigId))
                .thenReturn(Optional.of(testConfiguration));
        when(encryptionService.decrypt(any(String.class))).thenReturn("decrypted-api", "decrypted-secret");
        when(connectionTestServices.stream()).thenReturn(java.util.stream.Stream.of(testService));
        when(testService.supports(PgProvider.TOSS)).thenReturn(true);
        when(testService.testConnection(any(TenantPgConfiguration.class)))
                .thenReturn(ConnectionTestResponse.builder()
                        .success(false)
                        .result("FAILED")
                        .message("강제 시험 실패")
                        .testedAt(LocalDateTime.now())
                        .build());
        when(configurationRepository.save(any(TenantPgConfiguration.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        PgConfigurationApproveRequest request = PgConfigurationApproveRequest.builder()
                .approvedBy("ops-user")
                .approvalNote("재승인")
                .testConnection(false)
                .build();

        assertThatThrownBy(() -> service.approveConfiguration(testConfigId, request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("연결 테스트 실패")
                .hasMessageContaining("강제 시험 실패");

        assertThat(testConfiguration.getStoreId()).isEqualTo("live-store");
        assertThat(testConfiguration.getPendingRequestJson()).isNotBlank();
        verify(testService).testConnection(any(TenantPgConfiguration.class));
        verify(historyService, never()).saveHistory(
                eq(testConfigId),
                eq(TenantPgConfigurationHistory.ChangeType.APPROVED),
                any(),
                any(),
                any(),
                any());
    }

    @Test
    @DisplayName("승인 — pending + testConnection=false 여도 연결시험 강제, 성공 시 적용")
    void approveConfiguration_pendingIgnoresTestConnectionFalse_appliesOnSuccess() {
        testConfiguration.setStatus(PgConfigurationStatus.ACTIVE);
        testConfiguration.setApprovalStatus(ApprovalStatus.APPROVED);
        testConfiguration.setStoreId("live-store");
        testConfiguration.setApiKeyEncrypted("encrypted-live-api");
        testConfiguration.setSecretKeyEncrypted("encrypted-live-secret");
        testConfiguration.setPendingRequestJson(
                "{\"pgProvider\":\"TOSS\",\"pgName\":\"토스\","
                        + "\"apiKeyEncrypted\":\"encrypted-pending-api\","
                        + "\"secretKeyEncrypted\":\"encrypted-pending-secret\","
                        + "\"storeId\":\"pending-store\",\"settingsJson\":null,\"notes\":null}");
        testConfiguration.setPendingRequestedAt(LocalDateTime.now());

        PgConnectionTestService testService = stubSuccessfulConnectionTest();
        when(configurationRepository.findByConfigIdAndIsDeletedFalse(testConfigId))
                .thenReturn(Optional.of(testConfiguration));
        when(configurationRepository.save(any(TenantPgConfiguration.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(historyService).saveHistory(any(), any(), any(), any(), any(), any());

        PgConfigurationApproveRequest request = PgConfigurationApproveRequest.builder()
                .approvedBy("ops-user")
                .approvalNote("재승인")
                .testConnection(false)
                .build();

        TenantPgConfigurationResponse result = service.approveConfiguration(testConfigId, request);

        assertThat(result.getHasPendingEdit()).isFalse();
        assertThat(result.getStoreId()).isEqualTo("pending-store");
        assertThat(testConfiguration.getPendingRequestJson()).isNull();
        verify(testService).testConnection(any(TenantPgConfiguration.class));
    }

    @Test
    @DisplayName("testConnectionBeforeApproval — pending 있으면 pending 자격 증명으로 테스트")
    void testConnectionBeforeApproval_withPending_usesPendingCredentials() {
        testConfiguration.setStatus(PgConfigurationStatus.ACTIVE);
        testConfiguration.setApprovalStatus(ApprovalStatus.APPROVED);
        testConfiguration.setStoreId("live-store");
        testConfiguration.setApiKeyEncrypted("encrypted-live-api");
        testConfiguration.setSecretKeyEncrypted("encrypted-live-secret");
        testConfiguration.setPendingRequestJson(
                "{\"pgProvider\":\"TOSS\",\"pgName\":\"토스\","
                        + "\"apiKeyEncrypted\":\"encrypted-pending-api\","
                        + "\"secretKeyEncrypted\":\"encrypted-pending-secret\","
                        + "\"storeId\":\"pending-store\",\"settingsJson\":null,\"notes\":null}");
        testConfiguration.setPendingRequestedAt(LocalDateTime.now());

        PgConnectionTestService testService = mock(PgConnectionTestService.class);
        java.util.concurrent.atomic.AtomicReference<String> storeIdAtTest =
                new java.util.concurrent.atomic.AtomicReference<>();
        java.util.concurrent.atomic.AtomicReference<String> apiKeyAtTest =
                new java.util.concurrent.atomic.AtomicReference<>();

        when(configurationRepository.findByConfigIdAndIsDeletedFalse(testConfigId))
                .thenReturn(Optional.of(testConfiguration));
        when(encryptionService.decrypt(any(String.class))).thenReturn("decrypted-api", "decrypted-secret");
        when(connectionTestServices.stream()).thenReturn(java.util.stream.Stream.of(testService));
        when(testService.supports(PgProvider.TOSS)).thenReturn(true);
        when(testService.testConnection(any(TenantPgConfiguration.class)))
                .thenAnswer(invocation -> {
                    TenantPgConfiguration cfg = invocation.getArgument(0);
                    storeIdAtTest.set(cfg.getStoreId());
                    apiKeyAtTest.set(cfg.getApiKeyEncrypted());
                    return ConnectionTestResponse.builder()
                            .success(true)
                            .result("SUCCESS")
                            .message("연결 성공")
                            .testedAt(LocalDateTime.now())
                            .build();
                });
        when(configurationRepository.save(any(TenantPgConfiguration.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(historyService).saveHistory(any(), any(), any(), any(), any(), any());

        ConnectionTestResponse result = service.testConnectionBeforeApproval(testConfigId);

        assertThat(result.getSuccess()).isTrue();
        assertThat(storeIdAtTest.get()).isEqualTo("pending-store");
        assertThat(apiKeyAtTest.get()).isEqualTo("encrypted-pending-api");
        // restore 후 live 유지
        assertThat(testConfiguration.getStoreId()).isEqualTo("live-store");
        assertThat(testConfiguration.getApiKeyEncrypted()).isEqualTo("encrypted-live-api");
        assertThat(testConfiguration.getPendingRequestJson()).isNotBlank();
    }
}

