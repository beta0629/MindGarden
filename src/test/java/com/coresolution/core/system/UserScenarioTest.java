package com.coresolution.core.system;

import com.coresolution.core.context.TenantContext;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.domain.TenantPgConfiguration;
import com.coresolution.core.domain.enums.ApprovalStatus;
import com.coresolution.core.domain.enums.PgConfigurationStatus;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.dto.*;
import com.coresolution.core.repository.TenantPgConfigurationRepository;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.service.ErdGenerationService;
import com.coresolution.core.service.TenantPgConfigurationService;
import com.coresolution.consultation.dto.PaymentRequest;
import com.coresolution.consultation.dto.PaymentResponse;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.service.PaymentService;
import com.coresolution.consultation.service.PersonalDataEncryptionService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 사용자 시나리오 테스트
 * 실제 사용자가 시스템을 사용하는 시나리오를 기반으로 한 End-to-End 테스트
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@ActiveProfiles("test")
@Transactional
@DisplayName("사용자 시나리오 테스트")
class UserScenarioTest {
    
    @Autowired
    private TenantRepository tenantRepository;
    
    @Autowired
    private TenantPgConfigurationRepository pgConfigurationRepository;
    
    @Autowired
    private TenantPgConfigurationService pgConfigurationService;
    
    @Autowired
    private ErdGenerationService erdGenerationService;
    
    @Autowired
    private PaymentService paymentService;
    
    @Autowired
    private PaymentRepository paymentRepository;
    
    @Autowired
    private PersonalDataEncryptionService encryptionService;
    
    private String testTenantId;
    private Tenant testTenant;
    private SecurityContext securityContext;
    
    @BeforeEach
    void setUp() {
        // 테스트용 테넌트 생성
        testTenantId = UUID.randomUUID().toString();
        testTenant = Tenant.builder()
                .tenantId(testTenantId)
                .name("사용자 시나리오 테스트 테넌트")
                .businessType("ACADEMY")
                .status(Tenant.TenantStatus.ACTIVE)
                .contactEmail("scenario-test@example.com")
                .build();
        testTenant = tenantRepository.save(testTenant);
        
        // 테넌트 컨텍스트 설정
        TenantContext.setTenantId(testTenantId);
        
        // SecurityContext 설정
        org.springframework.security.authentication.UsernamePasswordAuthenticationToken authentication =
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        "test-user",
                        "password",
                        List.of(new SimpleGrantedAuthority("ROLE_TENANT_USER"))
                );
        securityContext = SecurityContextHolder.createEmptyContext();
        securityContext.setAuthentication(authentication);
        SecurityContextHolder.setContext(securityContext);
    }
    
    @AfterEach
    void tearDown() {
        TenantContext.clear();
        SecurityContextHolder.clearContext();
    }
    
    @Test
    @DisplayName("시나리오 1: 신규 테넌트 온보딩 → PG 설정 등록 → 승인 대기 → 승인 → 결제 사용")
    void testScenario1_NewTenantOnboarding_PgConfig_Approval_Payment() {
        // Step 1: 신규 테넌트 온보딩 완료 (테넌트 생성 완료)
        assertThat(testTenant).isNotNull();
        assertThat(testTenant.getTenantId()).isEqualTo(testTenantId);
        assertThat(testTenant.getStatus()).isEqualTo(Tenant.TenantStatus.ACTIVE);
        
        // Step 2: 테넌트가 PG 설정 등록
        TenantPgConfigurationRequest pgConfigRequest = TenantPgConfigurationRequest.builder()
                .pgProvider(PgProvider.TOSS)
                .pgName("토스페이먼츠")
                .apiKey("test-api-key-12345")
                .secretKey("test-secret-key-67890")
                .merchantId("test-merchant-id")
                .storeId("test-store-id")
                .webhookUrl("https://example.com/webhook")
                .returnUrl("https://example.com/return")
                .cancelUrl("https://example.com/cancel")
                .testMode(true)
                .notes("신규 테넌트 PG 설정")
                .build();
        
        TenantPgConfigurationResponse pgConfigResponse = pgConfigurationService.createConfiguration(
                testTenantId,
                pgConfigRequest,
                "test-user"
        );
        
        assertThat(pgConfigResponse).isNotNull();
        assertThat(pgConfigResponse.getConfigId()).isNotNull();
        assertThat(pgConfigResponse.getPgProvider()).isEqualTo(PgProvider.TOSS);
        assertThat(pgConfigResponse.getStatus()).isEqualTo(PgConfigurationStatus.PENDING);
        assertThat(pgConfigResponse.getApprovalStatus()).isEqualTo(ApprovalStatus.PENDING);
        
        // Step 3: OPS 관리자가 승인 대기 목록 확인
        List<TenantPgConfigurationResponse> pendingConfigs = pgConfigurationService.getPendingApprovals(null, null);
        assertThat(pendingConfigs).isNotEmpty();
        assertThat(pendingConfigs.stream()
                .anyMatch(c -> c.getConfigId().equals(pgConfigResponse.getConfigId()))).isTrue();
        
        // Step 4: OPS 관리자가 PG 설정 승인
        // SecurityContext를 ADMIN으로 변경
        org.springframework.security.authentication.UsernamePasswordAuthenticationToken adminAuth =
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        "admin-user",
                        "password",
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                );
        SecurityContext adminContext = SecurityContextHolder.createEmptyContext();
        adminContext.setAuthentication(adminAuth);
        SecurityContextHolder.setContext(adminContext);
        
        PgConfigurationApproveRequest approveRequest = PgConfigurationApproveRequest.builder()
                .approvedBy("admin-user")
                .approvalNote("테스트 승인")
                .build();
        
        TenantPgConfigurationResponse approvedConfig = pgConfigurationService.approveConfiguration(
                pgConfigResponse.getConfigId(),
                approveRequest
        );
        
        assertThat(approvedConfig).isNotNull();
        assertThat(approvedConfig.getApprovalStatus()).isEqualTo(ApprovalStatus.APPROVED);
        assertThat(approvedConfig.getApprovedBy()).isNotNull();
        assertThat(approvedConfig.getApprovedAt()).isNotNull();
        
        // Step 5: 테넌트가 PG 설정 활성화
        SecurityContextHolder.setContext(securityContext);
        TenantPgConfigurationResponse activatedConfig = pgConfigurationService.activateConfiguration(
                pgConfigResponse.getConfigId(),
                "test-user"
        );
        
        assertThat(activatedConfig).isNotNull();
        assertThat(activatedConfig.getStatus()).isEqualTo(PgConfigurationStatus.ACTIVE);
        
        // Step 6: 테넌트가 결제 생성 (활성화된 PG 설정 사용)
        // 결제 생성 시 ADMIN 권한 필요 (복호화 서비스 접근용)
        SecurityContextHolder.setContext(adminContext);
        
        PaymentRequest paymentRequest = PaymentRequest.builder()
                .orderId("ORDER_SCENARIO1_" + System.currentTimeMillis())
                .amount(new BigDecimal("10000"))
                .method("CARD")
                .provider("TOSS")
                .payerId(1L)
                .orderName("시나리오 1 테스트 결제")
                .customerEmail("customer@example.com")
                .customerName("테스트 고객")
                .description("신규 테넌트 첫 결제")
                .timeoutMinutes(30)
                .build();
        
        PaymentResponse paymentResponse = paymentService.createPayment(paymentRequest);
        
        assertThat(paymentResponse).isNotNull();
        assertThat(paymentResponse.getPaymentId()).isNotNull();
        assertThat(paymentResponse.getStatus()).isEqualTo("PENDING");
        assertThat(paymentResponse.getPaymentUrl()).isNotNull();
        
        // Payment 엔티티 확인
        Payment payment = paymentRepository.findByPaymentIdAndIsDeletedFalse(paymentResponse.getPaymentId())
                .orElseThrow();
        assertThat(payment.getProvider()).isEqualTo(Payment.PaymentProvider.TOSS);
        assertThat(payment.getStatus()).isEqualTo(Payment.PaymentStatus.PENDING);
    }
    
    @Test
    @DisplayName("시나리오 2: 기존 테넌트 → ERD 조회 → PG 설정 확인 → 결제 생성")
    void testScenario2_ExistingTenant_ErdView_PgCheck_Payment() {
        // Step 1: 기존 테넌트 (이미 PG 설정이 활성화된 상태)
        String configId = UUID.randomUUID().toString();
        TenantPgConfiguration existingPgConfig = TenantPgConfiguration.builder()
                .configId(configId)
                .tenantId(testTenantId)
                .pgProvider(PgProvider.TOSS)
                .pgName("기존 토스페이먼츠")
                .apiKeyEncrypted(encryptionService.encrypt("existing-api-key"))
                .secretKeyEncrypted(encryptionService.encrypt("existing-secret-key"))
                .merchantId("existing-merchant-id")
                .status(PgConfigurationStatus.ACTIVE)
                .approvalStatus(ApprovalStatus.APPROVED)
                .requestedBy("test-user")
                .requestedAt(LocalDateTime.now().minusDays(7))
                .approvedBy("admin-user")
                .approvedAt(LocalDateTime.now().minusDays(6))
                .build();
        existingPgConfig = pgConfigurationRepository.save(existingPgConfig);
        
        // Step 2: 테넌트가 자신의 ERD 조회
        ErdDiagramResponse erdResponse = erdGenerationService.generateTenantErd(
                testTenantId,
                null,
                "test-user"
        );
        
        assertThat(erdResponse).isNotNull();
        assertThat(erdResponse.getDiagramId()).isNotNull();
        assertThat(erdResponse.getTenantId()).isEqualTo(testTenantId);
        assertThat(erdResponse.getMermaidCode()).isNotNull();
        assertThat(erdResponse.getMermaidCode()).contains("erDiagram");
        
        // Step 3: 테넌트가 자신의 PG 설정 확인
        TenantPgConfigurationDetailResponse pgConfig = pgConfigurationService.getConfigurationDetail(
                testTenantId,
                configId
        );
        
        assertThat(pgConfig).isNotNull();
        assertThat(pgConfig.getConfigId()).isEqualTo(configId);
        assertThat(pgConfig.getStatus()).isEqualTo(PgConfigurationStatus.ACTIVE);
        assertThat(pgConfig.getApprovalStatus()).isEqualTo(ApprovalStatus.APPROVED);
        
        // Step 4: 테넌트가 결제 생성 (ADMIN 권한 필요)
        org.springframework.security.authentication.UsernamePasswordAuthenticationToken adminAuth =
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        "admin-user",
                        "password",
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                );
        SecurityContext adminContext = SecurityContextHolder.createEmptyContext();
        adminContext.setAuthentication(adminAuth);
        SecurityContextHolder.setContext(adminContext);
        
        PaymentRequest paymentRequest = PaymentRequest.builder()
                .orderId("ORDER_SCENARIO2_" + System.currentTimeMillis())
                .amount(new BigDecimal("50000"))
                .method("CARD")
                .provider("TOSS")
                .payerId(1L)
                .orderName("시나리오 2 테스트 결제")
                .customerEmail("customer@example.com")
                .customerName("테스트 고객")
                .description("기존 테넌트 결제")
                .timeoutMinutes(30)
                .build();
        
        PaymentResponse paymentResponse = paymentService.createPayment(paymentRequest);
        
        assertThat(paymentResponse).isNotNull();
        assertThat(paymentResponse.getPaymentId()).isNotNull();
        assertThat(paymentResponse.getStatus()).isEqualTo("PENDING");
    }
    
    @Test
    @DisplayName("시나리오 3: 테넌트 → PG 설정 변경 요청 → 거부 → 재요청 → 승인 → 활성화")
    void testScenario3_Tenant_PgConfigUpdate_Reject_Retry_Approve_Activate() {
        // Step 1: 기존 PG 설정 생성 (비활성화 상태로 변경 - 새 설정을 활성화하기 위해)
        String configId = UUID.randomUUID().toString();
        TenantPgConfiguration existingConfig = TenantPgConfiguration.builder()
                .configId(configId)
                .tenantId(testTenantId)
                .pgProvider(PgProvider.TOSS)
                .pgName("기존 설정")
                .apiKeyEncrypted(encryptionService.encrypt("old-api-key"))
                .secretKeyEncrypted(encryptionService.encrypt("old-secret-key"))
                .status(PgConfigurationStatus.INACTIVE) // 비활성화 상태
                .approvalStatus(ApprovalStatus.APPROVED)
                .requestedBy("test-user")
                .requestedAt(LocalDateTime.now().minusDays(30))
                .approvedBy("admin-user")
                .approvedAt(LocalDateTime.now().minusDays(29))
                .build();
        existingConfig = pgConfigurationRepository.save(existingConfig);
        
        // Step 2: 테넌트가 PG 설정 변경 요청
        TenantPgConfigurationRequest updateRequest = TenantPgConfigurationRequest.builder()
                .pgProvider(PgProvider.TOSS)
                .pgName("변경된 토스페이먼츠")
                .apiKey("new-api-key-12345")
                .secretKey("new-secret-key-67890")
                .merchantId("new-merchant-id")
                .testMode(true)
                .notes("PG 설정 변경 요청")
                .build();
        
        TenantPgConfigurationResponse updateResponse = pgConfigurationService.createConfiguration(
                testTenantId,
                updateRequest,
                "test-user"
        );
        
        assertThat(updateResponse).isNotNull();
        assertThat(updateResponse.getConfigId()).isNotNull();
        assertThat(updateResponse.getStatus()).isEqualTo(PgConfigurationStatus.PENDING);
        assertThat(updateResponse.getApprovalStatus()).isEqualTo(ApprovalStatus.PENDING);
        
        // Step 3: OPS 관리자가 거부
        // SecurityContext를 ADMIN으로 변경
        org.springframework.security.authentication.UsernamePasswordAuthenticationToken adminAuth =
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        "admin-user",
                        "password",
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                );
        SecurityContext adminContext = SecurityContextHolder.createEmptyContext();
        adminContext.setAuthentication(adminAuth);
        SecurityContextHolder.setContext(adminContext);
        
        PgConfigurationRejectRequest rejectRequest = PgConfigurationRejectRequest.builder()
                .rejectedBy("admin-user")
                .rejectionReason("API 키 형식이 올바르지 않습니다. 올바른 형식으로 수정 후 재요청해주세요.")
                .build();
        
        TenantPgConfigurationResponse rejectedConfig = pgConfigurationService.rejectConfiguration(
                updateResponse.getConfigId(),
                rejectRequest
        );
        
        assertThat(rejectedConfig).isNotNull();
        assertThat(rejectedConfig.getApprovalStatus()).isEqualTo(ApprovalStatus.REJECTED);
        assertThat(rejectedConfig.getRejectionReason()).contains("API 키 형식이 올바르지 않습니다");
        
        // Step 4: 테넌트가 수정 후 재요청
        // SecurityContext를 다시 테넌트 사용자로 변경
        SecurityContextHolder.setContext(securityContext);
        
        TenantPgConfigurationRequest retryRequest = TenantPgConfigurationRequest.builder()
                .pgProvider(PgProvider.TOSS)
                .pgName("수정된 토스페이먼츠")
                .apiKey("correct-api-key-12345")
                .secretKey("correct-secret-key-67890")
                .merchantId("correct-merchant-id")
                .testMode(true)
                .notes("수정 후 재요청")
                .build();
        
        TenantPgConfigurationResponse retryResponse = pgConfigurationService.createConfiguration(
                testTenantId,
                retryRequest,
                "test-user"
        );
        
        assertThat(retryResponse).isNotNull();
        assertThat(retryResponse.getConfigId()).isNotNull();
        assertThat(retryResponse.getStatus()).isEqualTo(PgConfigurationStatus.PENDING);
        assertThat(retryResponse.getApprovalStatus()).isEqualTo(ApprovalStatus.PENDING);
        
        // Step 5: OPS 관리자가 승인
        SecurityContextHolder.setContext(adminContext);
        
        PgConfigurationApproveRequest approveRequest = PgConfigurationApproveRequest.builder()
                .approvedBy("admin-user")
                .approvalNote("수정된 설정 승인")
                .build();
        
        TenantPgConfigurationResponse approvedConfig = pgConfigurationService.approveConfiguration(
                retryResponse.getConfigId(),
                approveRequest
        );
        
        assertThat(approvedConfig).isNotNull();
        assertThat(approvedConfig.getApprovalStatus()).isEqualTo(ApprovalStatus.APPROVED);
        
        // Step 6: 테넌트가 새 설정 활성화
        SecurityContextHolder.setContext(securityContext);
        
        TenantPgConfigurationResponse activatedConfig = pgConfigurationService.activateConfiguration(
                retryResponse.getConfigId(),
                "test-user"
        );
        
        assertThat(activatedConfig).isNotNull();
        assertThat(activatedConfig.getStatus()).isEqualTo(PgConfigurationStatus.ACTIVE);
    }
    
    @Test
    @DisplayName("시나리오 4: 테넌트 → ERD 조회 → 커스텀 ERD 생성 → 결제 생성")
    void testScenario4_Tenant_ErdView_CustomErd_Payment() {
        // Step 1: 테넌트가 기본 ERD 조회
        ErdDiagramResponse defaultErd = erdGenerationService.generateTenantErd(
                testTenantId,
                null,
                "test-user"
        );
        
        assertThat(defaultErd).isNotNull();
        assertThat(defaultErd.getDiagramId()).isNotNull();
        assertThat(defaultErd.getTenantId()).isEqualTo(testTenantId);
        
        // Step 2: 테넌트가 커스텀 ERD 생성 (특정 테이블만 선택)
        // Note: 커스텀 ERD 생성은 HQ OPS 포털에서만 가능하므로,
        // 여기서는 기본 ERD 생성으로 대체
        
        // Step 3: PG 설정 확인 및 결제 생성
        String configId = UUID.randomUUID().toString();
        TenantPgConfiguration pgConfig = TenantPgConfiguration.builder()
                .configId(configId)
                .tenantId(testTenantId)
                .pgProvider(PgProvider.TOSS)
                .pgName("토스페이먼츠")
                .apiKeyEncrypted(encryptionService.encrypt("test-api-key"))
                .secretKeyEncrypted(encryptionService.encrypt("test-secret-key"))
                .status(PgConfigurationStatus.ACTIVE)
                .approvalStatus(ApprovalStatus.APPROVED)
                .requestedBy("test-user")
                .requestedAt(LocalDateTime.now())
                .approvedBy("admin-user")
                .approvedAt(LocalDateTime.now())
                .build();
        pgConfigurationRepository.save(pgConfig);
        
        // 결제 생성 시 ADMIN 권한 필요 (복호화 서비스 접근용)
        org.springframework.security.authentication.UsernamePasswordAuthenticationToken adminAuth =
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        "admin-user",
                        "password",
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                );
        SecurityContext adminContext = SecurityContextHolder.createEmptyContext();
        adminContext.setAuthentication(adminAuth);
        SecurityContextHolder.setContext(adminContext);
        
        PaymentRequest paymentRequest = PaymentRequest.builder()
                .orderId("ORDER_SCENARIO4_" + System.currentTimeMillis())
                .amount(new BigDecimal("30000"))
                .method("CARD")
                .provider("TOSS")
                .payerId(1L)
                .orderName("시나리오 4 테스트 결제")
                .customerEmail("customer@example.com")
                .customerName("테스트 고객")
                .description("ERD 조회 후 결제")
                .timeoutMinutes(30)
                .build();
        
        PaymentResponse paymentResponse = paymentService.createPayment(paymentRequest);
        
        assertThat(paymentResponse).isNotNull();
        assertThat(paymentResponse.getPaymentId()).isNotNull();
        assertThat(paymentResponse.getStatus()).isEqualTo("PENDING");
    }
}

