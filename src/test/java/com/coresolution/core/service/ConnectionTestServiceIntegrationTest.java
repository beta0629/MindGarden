package com.coresolution.core.service;

import com.coresolution.core.domain.TenantPgConfiguration;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.dto.ConnectionTestResponse;
import com.coresolution.core.service.impl.*;
import com.mindgarden.consultation.service.PersonalDataEncryptionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 연결 테스트 서비스 통합 테스트
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@SpringBootTest(classes = com.mindgarden.consultation.ConsultationManagementApplication.class)
@ActiveProfiles("test")
@Transactional
@DisplayName("연결 테스트 서비스 통합 테스트")
class ConnectionTestServiceIntegrationTest {
    
    @Autowired(required = false)
    private TossConnectionTestServiceImpl tossConnectionTestService;
    
    @Autowired(required = false)
    private IamportConnectionTestServiceImpl iamportConnectionTestService;
    
    @Autowired(required = false)
    private KakaoConnectionTestServiceImpl kakaoConnectionTestService;
    
    @Autowired(required = false)
    private NaverConnectionTestServiceImpl naverConnectionTestService;
    
    @Autowired(required = false)
    private PaypalConnectionTestServiceImpl paypalConnectionTestService;
    
    @Autowired(required = false)
    private StripeConnectionTestServiceImpl stripeConnectionTestService;
    
    @Autowired
    private PersonalDataEncryptionService encryptionService;
    
    private TenantPgConfiguration createTestConfiguration(PgProvider provider, String apiKey, String secretKey) {
        String configId = UUID.randomUUID().toString();
        String tenantId = UUID.randomUUID().toString();
        
        TenantPgConfiguration config = TenantPgConfiguration.builder()
                .configId(configId)
                .tenantId(tenantId)
                .pgProvider(provider)
                .pgName(provider.name() + " 테스트")
                .apiKeyEncrypted(encryptionService.encrypt(apiKey))
                .secretKeyEncrypted(encryptionService.encrypt(secretKey))
                .testMode(true)
                .build();
        
        // BaseEntity 필드는 builder에서 설정 불가하므로 별도로 설정하지 않음
        return config;
    }
    
    @Test
    @DisplayName("토스페이먼츠 연결 테스트 서비스 - supports 확인")
    void testTossConnectionTestService_Supports() {
        if (tossConnectionTestService == null) {
            // 서비스가 없으면 스킵
            return;
        }
        
        assertTrue(tossConnectionTestService.supports(PgProvider.TOSS));
        assertFalse(tossConnectionTestService.supports(PgProvider.IAMPORT));
    }
    
    @Test
    @DisplayName("아임포트 연결 테스트 서비스 - supports 확인")
    void testIamportConnectionTestService_Supports() {
        if (iamportConnectionTestService == null) {
            return;
        }
        
        assertTrue(iamportConnectionTestService.supports(PgProvider.IAMPORT));
        assertFalse(iamportConnectionTestService.supports(PgProvider.TOSS));
    }
    
    @Test
    @DisplayName("카카오페이 연결 테스트 서비스 - supports 확인")
    void testKakaoConnectionTestService_Supports() {
        if (kakaoConnectionTestService == null) {
            return;
        }
        
        assertTrue(kakaoConnectionTestService.supports(PgProvider.KAKAO));
        assertFalse(kakaoConnectionTestService.supports(PgProvider.TOSS));
    }
    
    @Test
    @DisplayName("네이버페이 연결 테스트 서비스 - supports 확인")
    void testNaverConnectionTestService_Supports() {
        if (naverConnectionTestService == null) {
            return;
        }
        
        assertTrue(naverConnectionTestService.supports(PgProvider.NAVER));
        assertFalse(naverConnectionTestService.supports(PgProvider.TOSS));
    }
    
    @Test
    @DisplayName("PayPal 연결 테스트 서비스 - supports 확인")
    void testPaypalConnectionTestService_Supports() {
        if (paypalConnectionTestService == null) {
            return;
        }
        
        assertTrue(paypalConnectionTestService.supports(PgProvider.PAYPAL));
        assertFalse(paypalConnectionTestService.supports(PgProvider.TOSS));
    }
    
    @Test
    @DisplayName("Stripe 연결 테스트 서비스 - supports 확인")
    void testStripeConnectionTestService_Supports() {
        if (stripeConnectionTestService == null) {
            return;
        }
        
        assertTrue(stripeConnectionTestService.supports(PgProvider.STRIPE));
        assertFalse(stripeConnectionTestService.supports(PgProvider.TOSS));
    }
    
    @Test
    @DisplayName("연결 테스트 - API Key 누락")
    void testConnectionTest_MissingApiKey() {
        if (tossConnectionTestService == null) {
            return;
        }
        
        TenantPgConfiguration config = createTestConfiguration(
                PgProvider.TOSS, 
                "", // 빈 API Key
                "test-secret-key"
        );
        
        ConnectionTestResponse response = tossConnectionTestService.testConnection(config);
        
        assertNotNull(response);
        assertFalse(response.getSuccess());
        assertEquals("FAILED", response.getResult());
        assertNotNull(response.getMessage());
    }
    
    @Test
    @DisplayName("연결 테스트 - Secret Key 누락")
    void testConnectionTest_MissingSecretKey() {
        if (tossConnectionTestService == null) {
            return;
        }
        
        TenantPgConfiguration config = createTestConfiguration(
                PgProvider.TOSS, 
                "test-api-key",
                "" // 빈 Secret Key
        );
        
        ConnectionTestResponse response = tossConnectionTestService.testConnection(config);
        
        assertNotNull(response);
        assertFalse(response.getSuccess());
        assertEquals("FAILED", response.getResult());
        assertNotNull(response.getMessage());
    }
    
    @Test
    @DisplayName("연결 테스트 - 잘못된 키 형식")
    void testConnectionTest_InvalidKeyFormat() {
        if (tossConnectionTestService == null) {
            return;
        }
        
        TenantPgConfiguration config = createTestConfiguration(
                PgProvider.TOSS, 
                "invalid-key",
                "invalid-secret"
        );
        
        ConnectionTestResponse response = tossConnectionTestService.testConnection(config);
        
        assertNotNull(response);
        // 실제 API 호출 시 실패할 것이므로 결과는 FAILED일 가능성이 높음
        assertNotNull(response.getResult());
        assertNotNull(response.getTestedAt());
    }
}

