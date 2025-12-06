package com.mindgarden.consultation.service.impl;

import com.coresolution.core.context.TenantContext;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.domain.TenantPgConfiguration;
import com.coresolution.core.domain.enums.ApprovalStatus;
import com.coresolution.core.domain.enums.PgConfigurationStatus;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.repository.TenantPgConfigurationRepository;
import com.coresolution.core.repository.TenantRepository;
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
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * PaymentService 통합 테스트
 * 테넌트별 PG 설정을 사용한 결제 생성 테스트
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@ActiveProfiles("test")
@Transactional
@DisplayName("PaymentService 통합 테스트 (테넌트별 PG 설정)")
class PaymentServiceIntegrationTest {
    
    @Autowired
    private PaymentService paymentService;
    
    @Autowired
    private PaymentRepository paymentRepository;
    
    @Autowired
    private TenantRepository tenantRepository;
    
    @Autowired
    private TenantPgConfigurationRepository pgConfigurationRepository;
    
    @Autowired
    private PersonalDataEncryptionService encryptionService;
    
    private String testTenantId;
    private String testConfigId;
    private Tenant testTenant;
    private TenantPgConfiguration testPgConfig;
    
    @BeforeEach
    void setUp() {
        // 테스트용 테넌트 생성 (tenantId는 36자 이하여야 함)
        testTenantId = UUID.randomUUID().toString();
        testTenant = Tenant.builder()
                .tenantId(testTenantId)
                .name("테스트 테넌트")
                .businessType("ACADEMY")
                .status(Tenant.TenantStatus.ACTIVE)
                .contactEmail("test@example.com")
                .build();
        testTenant = tenantRepository.save(testTenant);
        
        // 테스트용 PG 설정 생성 (활성화되고 승인된 상태)
        testConfigId = UUID.randomUUID().toString();
        testPgConfig = TenantPgConfiguration.builder()
                .configId(testConfigId)
                .tenantId(testTenantId)
                .pgProvider(PgProvider.TOSS)
                .pgName("테스트 토스페이먼츠")
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
        
        // SecurityContext 설정 (ADMIN 역할 - 복호화 서비스 접근용)
        org.springframework.security.authentication.UsernamePasswordAuthenticationToken authentication =
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        "test-admin",
                        "password",
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                );
        SecurityContext securityContext = org.springframework.security.core.context.SecurityContextHolder.createEmptyContext();
        securityContext.setAuthentication(authentication);
        SecurityContextHolder.setContext(securityContext);
    }
    
    @AfterEach
    void tearDown() {
        // 테넌트 컨텍스트 정리
        TenantContext.clear();
        // SecurityContext 정리
        SecurityContextHolder.clearContext();
    }
    
    @Test
    @DisplayName("결제 생성 - 테넌트별 PG 설정 사용 성공")
    void testCreatePayment_WithTenantPgConfig_Success() {
        // Given
        PaymentRequest request = PaymentRequest.builder()
                .orderId("ORDER_" + System.currentTimeMillis())
                .amount(new BigDecimal("10000"))
                .method("CARD")
                .provider("TOSS")
                .payerId(1L)
                .recipientId(2L)
                .branchId(1L)
                .orderName("테스트 결제")
                .customerEmail("customer@example.com")
                .customerName("테스트 고객")
                .description("통합 테스트 결제")
                .timeoutMinutes(30)
                .successUrl("https://example.com/success")
                .failUrl("https://example.com/fail")
                .build();
        
        // When
        PaymentResponse response = paymentService.createPayment(request);
        
        // Then
        assertThat(response).isNotNull();
        assertThat(response.getPaymentId()).isNotNull();
        assertThat(response.getOrderId()).isEqualTo(request.getOrderId());
        assertThat(response.getAmount()).isEqualByComparingTo(request.getAmount());
        assertThat(response.getStatus()).isEqualTo("PENDING");
        assertThat(response.getPaymentUrl()).isNotNull();
        
        // Payment 엔티티 확인
        Payment payment = paymentRepository.findByPaymentIdAndIsDeletedFalse(response.getPaymentId())
                .orElseThrow();
        assertThat(payment.getProvider()).isEqualTo(Payment.PaymentProvider.TOSS);
        assertThat(payment.getStatus()).isEqualTo(Payment.PaymentStatus.PENDING);
    }
    
    @Test
    @DisplayName("결제 생성 - 테넌트 컨텍스트 없음 예외")
    void testCreatePayment_NoTenantContext_ThrowsException() {
        // Given
        TenantContext.clear(); // 테넌트 컨텍스트 제거
        
        PaymentRequest request = PaymentRequest.builder()
                .orderId("ORDER_" + System.currentTimeMillis())
                .amount(new BigDecimal("10000"))
                .method("CARD")
                .provider("TOSS")
                .payerId(1L)
                .orderName("테스트 결제")
                .customerEmail("customer@example.com")
                .customerName("테스트 고객")
                .build();
        
        // When & Then
        assertThatThrownBy(() -> paymentService.createPayment(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("테넌트 컨텍스트가 설정되지 않았습니다");
    }
    
    @Test
    @DisplayName("결제 생성 - 활성화된 PG 설정 없음 예외")
    void testCreatePayment_NoActivePgConfig_ThrowsException() {
        // Given
        // PG 설정을 비활성화
        testPgConfig.setStatus(PgConfigurationStatus.INACTIVE);
        pgConfigurationRepository.save(testPgConfig);
        
        PaymentRequest request = PaymentRequest.builder()
                .orderId("ORDER_" + System.currentTimeMillis())
                .amount(new BigDecimal("10000"))
                .method("CARD")
                .provider("TOSS")
                .payerId(1L)
                .orderName("테스트 결제")
                .customerEmail("customer@example.com")
                .customerName("테스트 고객")
                .build();
        
        // When & Then
        assertThatThrownBy(() -> paymentService.createPayment(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("활성화된 PG 설정을 찾을 수 없습니다");
    }
    
    @Test
    @DisplayName("결제 생성 - 승인되지 않은 PG 설정 예외")
    void testCreatePayment_NotApprovedPgConfig_ThrowsException() {
        // Given
        // PG 설정을 승인 대기 상태로 변경
        testPgConfig.setApprovalStatus(ApprovalStatus.PENDING);
        pgConfigurationRepository.save(testPgConfig);
        
        PaymentRequest request = PaymentRequest.builder()
                .orderId("ORDER_" + System.currentTimeMillis())
                .amount(new BigDecimal("10000"))
                .method("CARD")
                .provider("TOSS")
                .payerId(1L)
                .orderName("테스트 결제")
                .customerEmail("customer@example.com")
                .customerName("테스트 고객")
                .build();
        
        // When & Then
        assertThatThrownBy(() -> paymentService.createPayment(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("활성화된 PG 설정을 찾을 수 없습니다");
    }
    
    @Test
    @DisplayName("결제 생성 - 다른 PG Provider 설정 예외")
    void testCreatePayment_DifferentPgProvider_ThrowsException() {
        // Given
        // IAMPORT 설정 생성 (TOSS가 아님)
        String iamportConfigId = UUID.randomUUID().toString();
        TenantPgConfiguration iamportConfig = TenantPgConfiguration.builder()
                .configId(iamportConfigId)
                .tenantId(testTenantId)
                .pgProvider(PgProvider.IAMPORT)
                .pgName("테스트 아임포트")
                .apiKeyEncrypted(encryptionService.encrypt("test-api-key"))
                .secretKeyEncrypted(encryptionService.encrypt("test-secret-key"))
                .status(PgConfigurationStatus.ACTIVE)
                .approvalStatus(ApprovalStatus.APPROVED)
                .requestedBy("test-user")
                .requestedAt(LocalDateTime.now())
                .approvedBy("admin-user")
                .approvedAt(LocalDateTime.now())
                .build();
        pgConfigurationRepository.save(iamportConfig);
        
        // TOSS 설정 삭제
        testPgConfig.setIsDeleted(true);
        pgConfigurationRepository.save(testPgConfig);
        
        PaymentRequest request = PaymentRequest.builder()
                .orderId("ORDER_" + System.currentTimeMillis())
                .amount(new BigDecimal("10000"))
                .method("CARD")
                .provider("TOSS") // TOSS 요청
                .payerId(1L)
                .orderName("테스트 결제")
                .customerEmail("customer@example.com")
                .customerName("테스트 고객")
                .build();
        
        // When & Then
        assertThatThrownBy(() -> paymentService.createPayment(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("활성화된 PG 설정을 찾을 수 없습니다");
    }
    
    @Test
    @DisplayName("결제 생성 - 여러 활성화된 설정 중 특정 Provider 사용")
    void testCreatePayment_MultipleActiveConfigs_UseSpecificProvider() {
        // Given
        // IAMPORT 설정도 추가
        String iamportConfigId = UUID.randomUUID().toString();
        TenantPgConfiguration iamportConfig = TenantPgConfiguration.builder()
                .configId(iamportConfigId)
                .tenantId(testTenantId)
                .pgProvider(PgProvider.IAMPORT)
                .pgName("테스트 아임포트")
                .apiKeyEncrypted(encryptionService.encrypt("test-api-key-iamport"))
                .secretKeyEncrypted(encryptionService.encrypt("test-secret-key-iamport"))
                .status(PgConfigurationStatus.ACTIVE)
                .approvalStatus(ApprovalStatus.APPROVED)
                .requestedBy("test-user")
                .requestedAt(LocalDateTime.now())
                .approvedBy("admin-user")
                .approvedAt(LocalDateTime.now())
                .build();
        pgConfigurationRepository.save(iamportConfig);
        
        // TOSS로 결제 요청
        PaymentRequest request = PaymentRequest.builder()
                .orderId("ORDER_" + System.currentTimeMillis())
                .amount(new BigDecimal("10000"))
                .method("CARD")
                .provider("TOSS")
                .payerId(1L)
                .orderName("테스트 결제")
                .customerEmail("customer@example.com")
                .customerName("테스트 고객")
                .build();
        
        // When
        PaymentResponse response = paymentService.createPayment(request);
        
        // Then
        assertThat(response).isNotNull();
        assertThat(response.getPaymentId()).isNotNull();
        // TOSS 설정이 사용되었는지 확인 (Payment 엔티티의 provider 확인)
        Payment payment = paymentRepository.findByPaymentIdAndIsDeletedFalse(response.getPaymentId())
                .orElseThrow();
        assertThat(payment.getProvider()).isEqualTo(Payment.PaymentProvider.TOSS);
    }
}

