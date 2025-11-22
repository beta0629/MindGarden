package com.coresolution.core.integration;

import com.coresolution.core.domain.Tenant;
import com.coresolution.core.domain.TenantDashboard;
import com.coresolution.core.domain.onboarding.OnboardingRequest;
import com.coresolution.core.domain.onboarding.OnboardingStatus;
import com.coresolution.core.domain.onboarding.RiskLevel;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.repository.TenantDashboardRepository;
import com.coresolution.core.service.OnboardingService;
import com.coresolution.core.service.TenantDashboardService;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * MVP 온보딩 플로우 통합 테스트
 * 1월 심사/발표를 위한 최소 기능 테스트
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-23
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@ActiveProfiles("test")
@Transactional
@DisplayName("MVP 온보딩 플로우 통합 테스트")
class MvpOnboardingFlowIntegrationTest {
    
    @Autowired
    private OnboardingService onboardingService;
    
    @Autowired
    private TenantRepository tenantRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private TenantDashboardRepository dashboardRepository;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    private String testTenantId;
    private String testTenantName;
    private String testEmail;
    private String testPassword;
    
    @BeforeEach
    void setUp() {
        long timestamp = System.currentTimeMillis();
        testTenantId = "test-consultation-" + timestamp;
        testTenantName = "테스트 상담소 " + timestamp;
        testEmail = "admin@consultation-" + timestamp + ".com";
        testPassword = "test1234";
    }
    
    @Test
    @DisplayName("온보딩 전체 플로우 테스트 - CONSULTATION 업종")
    void testOnboardingFlow_Consultation() throws Exception {
        // Step 1: 온보딩 요청 생성
        OnboardingRequest request = onboardingService.create(
            testTenantId,
            testTenantName,
            testEmail,
            RiskLevel.LOW,
            String.format("{\"adminPassword\": \"%s\"}", testPassword),
            "CONSULTATION"
        );
        
        assertThat(request).isNotNull();
        assertThat(request.getId()).isNotNull();
        assertThat(request.getTenantId()).isEqualTo(testTenantId);
        assertThat(request.getStatus()).isEqualTo(OnboardingStatus.PENDING);
        assertThat(request.getRequestedBy()).isEqualTo(testEmail);
        
        // Step 2: 온보딩 승인
        OnboardingRequest approved = onboardingService.decide(
            request.getId(),
            OnboardingStatus.APPROVED,
            "system-admin",
            "MVP 테스트 승인"
        );
        
        assertThat(approved).isNotNull();
        assertThat(approved.getStatus()).isEqualTo(OnboardingStatus.APPROVED);
        assertThat(approved.getDecidedBy()).isEqualTo("system-admin");
        
        // Step 3: 테넌트 생성 확인
        Tenant tenant = tenantRepository.findByTenantId(testTenantId).orElse(null);
        assertThat(tenant).isNotNull();
        assertThat(tenant.getStatus().name()).isEqualTo("ACTIVE");
        assertThat(tenant.getName()).isEqualTo(testTenantName);
        assertThat(tenant.getBusinessType()).isEqualTo("CONSULTATION");
        
        // Step 4: settings_json features 확인
        String settingsJson = tenant.getSettingsJson();
        assertThat(settingsJson).isNotNull();
        
        Map<String, Object> settings = objectMapper.readValue(settingsJson, Map.class);
        assertThat(settings).containsKey("features");
        
        Map<String, Object> features = (Map<String, Object>) settings.get("features");
        assertThat(features.get("consultation")).isEqualTo(true);
        assertThat(features.get("academy")).isEqualTo(false);
        
        // Step 5: 관리자 계정 생성 확인
        List<User> admins = userRepository.findAllByEmail(testEmail).stream()
            .filter(u -> testTenantId.equals(u.getTenantId()))
            .filter(u -> u.getRole() == UserRole.ADMIN)
            .filter(u -> u.getIsDeleted() == null || !u.getIsDeleted())
            .toList();
        
        assertThat(admins).hasSize(1);
        User admin = admins.get(0);
        assertThat(admin.getIsActive()).isTrue();
        assertThat(admin.getIsEmailVerified()).isTrue();
        assertThat(admin.getTenantId()).isEqualTo(testTenantId);
        
        // Step 6: 기본 대시보드 생성 확인
        List<TenantDashboard> dashboards = dashboardRepository.findByTenantIdAndIsDeletedFalse(testTenantId);
        assertThat(dashboards).isNotEmpty();
        
        // 최소 1개 이상의 기본 대시보드가 생성되어야 함
        boolean hasDefaultDashboard = dashboards.stream()
            .anyMatch(TenantDashboard::getIsDefault);
        assertThat(hasDefaultDashboard).isTrue();
        
        // Step 7: 대시보드 위젯 확인
        TenantDashboard defaultDashboard = dashboards.stream()
            .filter(TenantDashboard::getIsDefault)
            .findFirst()
            .orElse(null);
        
        assertThat(defaultDashboard).isNotNull();
        String dashboardConfig = defaultDashboard.getDashboardConfig();
        assertThat(dashboardConfig).isNotNull();
        
        Map<String, Object> config = objectMapper.readValue(dashboardConfig, Map.class);
        assertThat(config).containsKey("widgets");
        
        List<Map<String, Object>> widgets = (List<Map<String, Object>>) config.get("widgets");
        assertThat(widgets).isNotEmpty();
        // MVP: 최소 3개 이상의 위젯이 있어야 함
        assertThat(widgets.size()).isGreaterThanOrEqualTo(3);
        
        System.out.println("✅ 온보딩 플로우 테스트 성공:");
        System.out.println("  - 테넌트 ID: " + testTenantId);
        System.out.println("  - 관리자 이메일: " + testEmail);
        System.out.println("  - 대시보드 수: " + dashboards.size());
        System.out.println("  - 위젯 수: " + widgets.size());
    }
    
    @Test
    @DisplayName("온보딩 전체 플로우 테스트 - ACADEMY 업종")
    void testOnboardingFlow_Academy() throws Exception {
        long timestamp = System.currentTimeMillis();
        String academyTenantId = "test-academy-" + timestamp;
        String academyTenantName = "테스트 학원 " + timestamp;
        String academyEmail = "admin@academy-" + timestamp + ".com";
        String academyPassword = "test1234";
        
        // Step 1: 온보딩 요청 생성
        OnboardingRequest request = onboardingService.create(
            academyTenantId,
            academyTenantName,
            academyEmail,
            RiskLevel.LOW,
            String.format("{\"adminPassword\": \"%s\"}", academyPassword),
            "ACADEMY"
        );
        
        assertThat(request).isNotNull();
        assertThat(request.getStatus()).isEqualTo(OnboardingStatus.PENDING);
        
        // Step 2: 온보딩 승인
        OnboardingRequest approved = onboardingService.decide(
            request.getId(),
            OnboardingStatus.APPROVED,
            "system-admin",
            "MVP 테스트 승인"
        );
        
        assertThat(approved.getStatus()).isEqualTo(OnboardingStatus.APPROVED);
        
        // Step 3: 테넌트 생성 확인
        Tenant tenant = tenantRepository.findByTenantId(academyTenantId).orElse(null);
        assertThat(tenant).isNotNull();
        assertThat(tenant.getBusinessType()).isEqualTo("ACADEMY");
        
        // Step 4: settings_json features 확인 (ACADEMY)
        String settingsJson = tenant.getSettingsJson();
        Map<String, Object> settings = objectMapper.readValue(settingsJson, Map.class);
        Map<String, Object> features = (Map<String, Object>) settings.get("features");
        
        assertThat(features.get("consultation")).isEqualTo(false);
        assertThat(features.get("academy")).isEqualTo(true);
        
        // Step 5: 관리자 계정 생성 확인
        List<User> admins = userRepository.findAllByEmail(academyEmail).stream()
            .filter(u -> academyTenantId.equals(u.getTenantId()))
            .filter(u -> u.getRole() == UserRole.ADMIN)
            .toList();
        
        assertThat(admins).hasSize(1);
        
        System.out.println("✅ ACADEMY 온보딩 플로우 테스트 성공:");
        System.out.println("  - 테넌트 ID: " + academyTenantId);
        System.out.println("  - 관리자 이메일: " + academyEmail);
    }
    
    @Test
    @DisplayName("온보딩 플로우 - settings_json subdomain 확인")
    void testOnboardingFlow_Subdomain() throws Exception {
        // 온보딩 요청 생성 및 승인
        OnboardingRequest request = onboardingService.create(
            testTenantId,
            testTenantName,
            testEmail,
            RiskLevel.LOW,
            String.format("{\"adminPassword\": \"%s\"}", testPassword),
            "CONSULTATION"
        );
        
        onboardingService.decide(
            request.getId(),
            OnboardingStatus.APPROVED,
            "system-admin",
            "MVP 테스트 승인"
        );
        
        // 테넌트의 settings_json에서 subdomain 확인
        Tenant tenant = tenantRepository.findByTenantId(testTenantId).orElse(null);
        assertThat(tenant).isNotNull();
        
        String settingsJson = tenant.getSettingsJson();
        Map<String, Object> settings = objectMapper.readValue(settingsJson, Map.class);
        
        assertThat(settings).containsKey("subdomain");
        assertThat(settings).containsKey("domain");
        
        String subdomain = (String) settings.get("subdomain");
        String domain = (String) settings.get("domain");
        
        assertThat(subdomain).isNotNull();
        assertThat(domain).isNotNull();
        assertThat(domain).contains(subdomain);
        
        System.out.println("✅ Subdomain 확인:");
        System.out.println("  - Subdomain: " + subdomain);
        System.out.println("  - Domain: " + domain);
    }
}

