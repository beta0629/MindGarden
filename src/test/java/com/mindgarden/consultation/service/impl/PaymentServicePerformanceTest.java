package com.mindgarden.consultation.service.impl;

import com.coresolution.core.context.TenantContext;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.domain.TenantPgConfiguration;
import com.coresolution.core.domain.enums.ApprovalStatus;
import com.coresolution.core.domain.enums.PgConfigurationStatus;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.repository.TenantPgConfigurationRepository;
import com.coresolution.core.repository.TenantRepository;
import com.mindgarden.consultation.dto.PaymentRequest;
import com.mindgarden.consultation.dto.PaymentResponse;
import com.mindgarden.consultation.service.PaymentService;
import com.mindgarden.consultation.service.PersonalDataEncryptionService;
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
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * PaymentService 성능 테스트
 * 테넌트별 PG 설정을 사용한 결제 생성 성능 측정
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@SpringBootTest(classes = com.mindgarden.consultation.ConsultationManagementApplication.class)
@ActiveProfiles("test")
@Transactional
@DisplayName("PaymentService 성능 테스트")
class PaymentServicePerformanceTest {
    
    @Autowired
    private PaymentService paymentService;
    
    @Autowired
    private TenantRepository tenantRepository;
    
    @Autowired
    private TenantPgConfigurationRepository pgConfigurationRepository;
    
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
                .name("성능 테스트 테넌트")
                .businessType(Tenant.BusinessType.ACADEMY)
                .status(Tenant.TenantStatus.ACTIVE)
                .contactEmail("perf-test@example.com")
                .build();
        testTenant = tenantRepository.save(testTenant);
        
        // 테스트용 PG 설정 생성
        String testConfigId = UUID.randomUUID().toString();
        testPgConfig = TenantPgConfiguration.builder()
                .configId(testConfigId)
                .tenantId(testTenantId)
                .pgProvider(PgProvider.TOSS)
                .pgName("성능 테스트 토스페이먼츠")
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
    @DisplayName("결제 생성 성능 테스트 - 단일 요청")
    void testCreatePayment_Performance_SingleRequest() {
        // Given
        PaymentRequest request = createTestPaymentRequest();
        
        // When
        long startTime = System.currentTimeMillis();
        PaymentResponse response = paymentService.createPayment(request);
        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;
        
        // Then
        assertThat(response).isNotNull();
        assertThat(response.getPaymentId()).isNotNull();
        
        System.out.println("단일 결제 생성 시간: " + duration + "ms");
        assertThat(duration).isLessThan(2000); // 2초 이내
    }
    
    @Test
    @DisplayName("결제 생성 성능 테스트 - 연속 10개 요청")
    void testCreatePayment_Performance_Sequential10Requests() {
        // Given
        int requestCount = 10;
        List<Long> durations = new ArrayList<>();
        
        // When
        for (int i = 0; i < requestCount; i++) {
            PaymentRequest request = createTestPaymentRequest("ORDER_" + i);
            
            long startTime = System.currentTimeMillis();
            PaymentResponse response = paymentService.createPayment(request);
            long endTime = System.currentTimeMillis();
            long duration = endTime - startTime;
            durations.add(duration);
            
            assertThat(response).isNotNull();
        }
        
        // Then
        long totalTime = durations.stream().mapToLong(Long::longValue).sum();
        double averageTime = durations.stream().mapToLong(Long::longValue).average().orElse(0.0);
        long maxTime = durations.stream().mapToLong(Long::longValue).max().orElse(0L);
        long minTime = durations.stream().mapToLong(Long::longValue).min().orElse(0L);
        
        System.out.println("연속 10개 결제 생성 성능:");
        System.out.println("  - 총 시간: " + totalTime + "ms");
        System.out.println("  - 평균 시간: " + String.format("%.2f", averageTime) + "ms");
        System.out.println("  - 최대 시간: " + maxTime + "ms");
        System.out.println("  - 최소 시간: " + minTime + "ms");
        
        assertThat(averageTime).isLessThan(2000); // 평균 2초 이내
        assertThat(maxTime).isLessThan(5000); // 최대 5초 이내
    }
    
    // 동시 요청 테스트는 트랜잭션 및 테넌트 컨텍스트 관리의 복잡성으로 인해 제외
    // 실제 운영 환경에서는 각 요청이 별도의 HTTP 요청으로 처리되므로
    // 동시성 테스트는 실제 운영 환경에서 별도로 수행하는 것을 권장
    
    @Test
    @DisplayName("결제 생성 성능 테스트 - PG 설정 조회 성능")
    void testCreatePayment_Performance_PgConfigLookup() {
        // Given
        PaymentRequest request = createTestPaymentRequest();
        
        // When
        long startTime = System.currentTimeMillis();
        
        // PG 설정 조회는 PaymentService 내부에서 수행되므로
        // 전체 결제 생성 시간 측정
        PaymentResponse response = paymentService.createPayment(request);
        
        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;
        
        // Then
        assertThat(response).isNotNull();
        
        System.out.println("PG 설정 조회 포함 결제 생성 시간: " + duration + "ms");
        
        // PG 설정 조회 + 결제 생성이 2초 이내에 완료되어야 함
        assertThat(duration).isLessThan(2000);
    }
    
    // ==================== Helper Methods ====================
    
    private PaymentRequest createTestPaymentRequest() {
        return createTestPaymentRequest("ORDER_" + System.currentTimeMillis());
    }
    
    private PaymentRequest createTestPaymentRequest(String orderId) {
        return PaymentRequest.builder()
                .orderId(orderId)
                .amount(new BigDecimal("10000"))
                .method("CARD")
                .provider("TOSS")
                .payerId(1L)
                .recipientId(2L)
                .branchId(1L)
                .orderName("성능 테스트 결제")
                .customerEmail("customer@example.com")
                .customerName("테스트 고객")
                .description("성능 테스트")
                .timeoutMinutes(30)
                .successUrl("https://example.com/success")
                .failUrl("https://example.com/fail")
                .build();
    }
}

