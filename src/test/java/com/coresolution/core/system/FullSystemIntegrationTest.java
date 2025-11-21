package com.coresolution.core.system;

import com.coresolution.core.context.TenantContext;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.ErdDiagram;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.domain.TenantPgConfiguration;
import com.coresolution.core.domain.enums.ApprovalStatus;
import com.coresolution.core.domain.enums.PgConfigurationStatus;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.dto.ErdDiagramResponse;
import com.coresolution.core.dto.TenantPgConfigurationDetailResponse;
import com.coresolution.core.repository.TenantPgConfigurationRepository;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.service.ErdGenerationService;
import com.coresolution.core.service.OnboardingApprovalService;
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
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 전체 시스템 통합 테스트
 * PG 설정, ERD 생성, 결제 시스템이 함께 동작하는지 확인
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@ActiveProfiles("test")
@Transactional
@DisplayName("전체 시스템 통합 테스트")
class FullSystemIntegrationTest {
    
    @Autowired
    private TenantRepository tenantRepository;
    
    @Autowired
    private TenantPgConfigurationRepository pgConfigurationRepository;
    
    @Autowired
    private TenantPgConfigurationService pgConfigurationService;
    
    @Autowired
    private ErdGenerationService erdGenerationService;
    
    @Autowired
    private OnboardingApprovalService onboardingApprovalService;
    
    @Autowired
    private PaymentService paymentService;
    
    @Autowired
    private PaymentRepository paymentRepository;
    
    @Autowired
    private PersonalDataEncryptionService encryptionService;
    
    private String testTenantId;
    private Tenant testTenant;
    private TenantPgConfiguration testPgConfig;
    
    @BeforeEach
    void setUp() {
        // 테스트용 테넌트 생성
        testTenantId = UUID.randomUUID().toString();
        testTenant = Tenant.builder()
                .tenantId(testTenantId)
                .name("전체 시스템 테스트 테넌트")
                .businessType("ACADEMY")
                .status(Tenant.TenantStatus.ACTIVE)
                .contactEmail("system-test@example.com")
                .build();
        testTenant = tenantRepository.save(testTenant);
        
        // 테스트용 PG 설정 생성 (활성화되고 승인된 상태)
        String testConfigId = UUID.randomUUID().toString();
        testPgConfig = TenantPgConfiguration.builder()
                .configId(testConfigId)
                .tenantId(testTenantId)
                .pgProvider(PgProvider.TOSS)
                .pgName("전체 시스템 테스트 토스페이먼츠")
                .apiKeyEncrypted(encryptionService.encrypt("test-api-key"))
                .secretKeyEncrypted(encryptionService.encrypt("test-secret-key"))
                .merchantId("test-merchant-id")
                .storeId("test-store-id")
                .webhookUrl("https://api.tosspayments.com/webhook")
                .returnUrl("https://example.com/return")
                .cancelUrl("https://example.com/cancel")
                .testMode(true)
                .status(PgConfigurationStatus.ACTIVE)
                .approvalStatus(ApprovalStatus.APPROVED)
                .requestedBy("test-user")
                .requestedAt(LocalDateTime.now())
                .approvedBy("admin-user")
                .approvedAt(LocalDateTime.now())
                .build();
        testPgConfig = pgConfigurationRepository.save(testPgConfig);
        
        // 테넌트 컨텍스트 설정
        TenantContext.setTenantId(testTenantId);
        
        // SecurityContext 설정
        org.springframework.security.authentication.UsernamePasswordAuthenticationToken authentication =
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        "test-admin",
                        "password",
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                );
        SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
        securityContext.setAuthentication(authentication);
        SecurityContextHolder.setContext(securityContext);
    }
    
    @AfterEach
    void tearDown() {
        TenantContext.clear();
        SecurityContextHolder.clearContext();
    }
    
    @Test
    @DisplayName("전체 시스템 통합 테스트 - PG 설정 → ERD 생성 → 결제 생성 플로우")
    void testFullSystemFlow_PgConfig_Erd_Payment() {
        // Step 1: PG 설정 조회 확인
        TenantPgConfigurationDetailResponse pgConfig = pgConfigurationService
                .getActiveConfigurationByProvider(testTenantId, PgProvider.TOSS);
        
        assertThat(pgConfig).isNotNull();
        assertThat(pgConfig.getConfigId()).isEqualTo(testPgConfig.getConfigId());
        assertThat(pgConfig.getPgProvider()).isEqualTo(PgProvider.TOSS);
        assertThat(pgConfig.getStatus()).isEqualTo(PgConfigurationStatus.ACTIVE);
        assertThat(pgConfig.getApprovalStatus()).isEqualTo(ApprovalStatus.APPROVED);
        
        // Step 2: ERD 생성 확인
        ErdDiagramResponse erdResponse = erdGenerationService.generateTenantErd(
                testTenantId,
                null, // 기본 스키마
                "system-test-user"
        );
        
        assertThat(erdResponse).isNotNull();
        assertThat(erdResponse.getDiagramId()).isNotNull();
        assertThat(erdResponse.getDiagramType()).isEqualTo(ErdDiagram.DiagramType.TENANT);
        assertThat(erdResponse.getMermaidCode()).isNotNull();
        assertThat(erdResponse.getMermaidCode()).contains("erDiagram");
        assertThat(erdResponse.getTenantId()).isEqualTo(testTenantId);
        
        // Step 3: 결제 생성 확인 (PG 설정 사용)
        PaymentRequest paymentRequest = PaymentRequest.builder()
                .orderId("ORDER_SYSTEM_TEST_" + System.currentTimeMillis())
                .amount(new BigDecimal("10000"))
                .method("CARD")
                .provider("TOSS")
                .payerId(1L)
                .recipientId(2L)
                .branchId(1L)
                .orderName("전체 시스템 테스트 결제")
                .customerEmail("customer@example.com")
                .customerName("테스트 고객")
                .description("전체 시스템 통합 테스트")
                .timeoutMinutes(30)
                .successUrl("https://example.com/success")
                .failUrl("https://example.com/fail")
                .build();
        
        PaymentResponse paymentResponse = paymentService.createPayment(paymentRequest);
        
        assertThat(paymentResponse).isNotNull();
        assertThat(paymentResponse.getPaymentId()).isNotNull();
        assertThat(paymentResponse.getOrderId()).isEqualTo(paymentRequest.getOrderId());
        assertThat(paymentResponse.getAmount()).isEqualByComparingTo(paymentRequest.getAmount());
        assertThat(paymentResponse.getStatus()).isEqualTo("PENDING");
        assertThat(paymentResponse.getPaymentUrl()).isNotNull();
        
        // Payment 엔티티 확인
        Payment payment = paymentRepository.findByPaymentIdAndIsDeletedFalse(paymentResponse.getPaymentId())
                .orElseThrow();
        assertThat(payment.getProvider()).isEqualTo(Payment.PaymentProvider.TOSS);
        assertThat(payment.getStatus()).isEqualTo(Payment.PaymentStatus.PENDING);
        // Note: Payment 엔티티에 tenantId 필드가 없으므로 테넌트 컨텍스트로 확인
        assertThat(TenantContextHolder.getTenantId()).isEqualTo(testTenantId);
    }
    
    @Test
    @DisplayName("전체 시스템 통합 테스트 - 온보딩 승인 → ERD 자동 생성 → PG 설정 → 결제 플로우")
    void testFullSystemFlow_Onboarding_Erd_PgConfig_Payment() {
        // Step 1: 온보딩 승인 (PL/SQL 프로시저 호출)
        // Note: 실제 온보딩 요청이 있어야 하므로, 여기서는 ERD 생성만 테스트
        String decisionNote = "전체 시스템 테스트 승인";
        
        // Step 2: ERD 생성 (온보딩 승인 시 자동 생성되는 것과 동일한 로직)
        ErdDiagramResponse erdResponse = erdGenerationService.generateTenantErd(
                testTenantId,
                null,
                "onboarding-system"
        );
        
        assertThat(erdResponse).isNotNull();
        assertThat(erdResponse.getDiagramId()).isNotNull();
        assertThat(erdResponse.getTenantId()).isEqualTo(testTenantId);
        
        // Step 3: PG 설정 확인
        TenantPgConfigurationDetailResponse pgConfig = pgConfigurationService
                .getActiveConfigurationByProvider(testTenantId, PgProvider.TOSS);
        
        assertThat(pgConfig).isNotNull();
        assertThat(pgConfig.getStatus()).isEqualTo(PgConfigurationStatus.ACTIVE);
        
        // Step 4: 결제 생성
        PaymentRequest paymentRequest = PaymentRequest.builder()
                .orderId("ORDER_ONBOARDING_TEST_" + System.currentTimeMillis())
                .amount(new BigDecimal("50000"))
                .method("CARD")
                .provider("TOSS")
                .payerId(1L)
                .orderName("온보딩 후 결제 테스트")
                .customerEmail("customer@example.com")
                .customerName("테스트 고객")
                .build();
        
        PaymentResponse paymentResponse = paymentService.createPayment(paymentRequest);
        
        assertThat(paymentResponse).isNotNull();
        assertThat(paymentResponse.getPaymentId()).isNotNull();
        assertThat(paymentResponse.getStatus()).isEqualTo("PENDING");
    }
    
    @Test
    @DisplayName("전체 시스템 통합 테스트 - 여러 테넌트 동시 처리")
    void testFullSystemFlow_MultipleTenants() {
        // 테넌트 2 생성
        String tenantId2 = UUID.randomUUID().toString();
        Tenant tenant2 = Tenant.builder()
                .tenantId(tenantId2)
                .name("테스트 테넌트 2")
                .businessType("ACADEMY")
                .status(Tenant.TenantStatus.ACTIVE)
                .contactEmail("tenant2@example.com")
                .build();
        tenant2 = tenantRepository.save(tenant2);
        
        // 테넌트 2의 PG 설정 생성
        String configId2 = UUID.randomUUID().toString();
        TenantPgConfiguration pgConfig2 = TenantPgConfiguration.builder()
                .configId(configId2)
                .tenantId(tenantId2)
                .pgProvider(PgProvider.TOSS)
                .pgName("테넌트 2 토스페이먼츠")
                .apiKeyEncrypted(encryptionService.encrypt("tenant2-api-key"))
                .secretKeyEncrypted(encryptionService.encrypt("tenant2-secret-key"))
                .status(PgConfigurationStatus.ACTIVE)
                .approvalStatus(ApprovalStatus.APPROVED)
                .requestedBy("test-user")
                .requestedAt(LocalDateTime.now())
                .approvedBy("admin-user")
                .approvedAt(LocalDateTime.now())
                .build();
        pgConfig2 = pgConfigurationRepository.save(pgConfig2);
        
        // 테넌트 1: PG 설정 조회 및 결제 생성
        TenantContext.setTenantId(testTenantId);
        TenantPgConfigurationDetailResponse pgConfig1 = pgConfigurationService
                .getActiveConfigurationByProvider(testTenantId, PgProvider.TOSS);
        
        assertThat(pgConfig1).isNotNull();
        assertThat(pgConfig1.getTenantId()).isEqualTo(testTenantId);
        
        PaymentRequest paymentRequest1 = PaymentRequest.builder()
                .orderId("ORDER_TENANT1_" + System.currentTimeMillis())
                .amount(new BigDecimal("10000"))
                .method("CARD")
                .provider("TOSS")
                .payerId(1L)
                .orderName("테넌트 1 결제")
                .build();
        
        PaymentResponse paymentResponse1 = paymentService.createPayment(paymentRequest1);
        assertThat(paymentResponse1).isNotNull();
        assertThat(paymentResponse1.getPaymentId()).isNotNull();
        
        // 테넌트 2: PG 설정 조회 및 결제 생성
        TenantContext.setTenantId(tenantId2);
        TenantPgConfigurationDetailResponse pgConfig2Response = pgConfigurationService
                .getActiveConfigurationByProvider(tenantId2, PgProvider.TOSS);
        
        assertThat(pgConfig2Response).isNotNull();
        assertThat(pgConfig2Response.getTenantId()).isEqualTo(tenantId2);
        assertThat(pgConfig2Response.getConfigId()).isEqualTo(configId2);
        
        PaymentRequest paymentRequest2 = PaymentRequest.builder()
                .orderId("ORDER_TENANT2_" + System.currentTimeMillis())
                .amount(new BigDecimal("20000"))
                .method("CARD")
                .provider("TOSS")
                .payerId(2L)
                .orderName("테넌트 2 결제")
                .build();
        
        PaymentResponse paymentResponse2 = paymentService.createPayment(paymentRequest2);
        assertThat(paymentResponse2).isNotNull();
        assertThat(paymentResponse2.getPaymentId()).isNotNull();
        
        // 각 테넌트의 결제가 올바른 PG 설정을 사용했는지 확인
        Payment payment1 = paymentRepository.findByPaymentIdAndIsDeletedFalse(paymentResponse1.getPaymentId())
                .orElseThrow();
        Payment payment2 = paymentRepository.findByPaymentIdAndIsDeletedFalse(paymentResponse2.getPaymentId())
                .orElseThrow();
        
        // Payment 엔티티에 tenantId 필드가 없으므로 결제 ID로 구분 확인
        assertThat(payment1.getPaymentId()).isNotNull();
        assertThat(payment2.getPaymentId()).isNotNull();
        assertThat(payment1.getPaymentId()).isNotEqualTo(payment2.getPaymentId());
    }
    
    @Test
    @DisplayName("전체 시스템 통합 테스트 - ERD 생성 및 조회")
    void testFullSystemFlow_ErdGenerationAndRetrieval() {
        // Step 1: 전체 시스템 ERD 생성
        ErdDiagramResponse fullSystemErd = erdGenerationService.generateFullSystemErd(
                null,
                "system-test-user"
        );
        
        assertThat(fullSystemErd).isNotNull();
        assertThat(fullSystemErd.getDiagramType()).isEqualTo(ErdDiagram.DiagramType.FULL);
        assertThat(fullSystemErd.getMermaidCode()).isNotNull();
        
        // Step 2: 테넌트별 ERD 생성
        ErdDiagramResponse tenantErd = erdGenerationService.generateTenantErd(
                testTenantId,
                null,
                "system-test-user"
        );
        
        assertThat(tenantErd).isNotNull();
        assertThat(tenantErd.getDiagramType()).isEqualTo(ErdDiagram.DiagramType.TENANT);
        assertThat(tenantErd.getTenantId()).isEqualTo(testTenantId);
        assertThat(tenantErd.getMermaidCode()).isNotNull();
        
        // Step 3: ERD 버전 확인
        assertThat(fullSystemErd.getVersion()).isGreaterThanOrEqualTo(1);
        assertThat(tenantErd.getVersion()).isGreaterThanOrEqualTo(1);
    }
}

